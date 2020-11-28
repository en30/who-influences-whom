import { GetStaticProps } from 'next'
import cytoscape from 'cytoscape'
import Head from 'next/head'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Tweet from '../components/Tweet'
import User from '../components/User'
import * as Repo from '../src/repo'
import {
  GraphData,
  GraphEdge,
  GraphNode,
  TweetModel,
  UserModel,
} from '../@types'

type Props = {
  graphData: GraphData
}

export const getStaticProps: GetStaticProps = async (_context) => {
  const [users, tweets] = await Promise.all([Repo.allUsers(), Repo.allTweets()])
  console.log(users.length, 'users') // eslint-disable-line no-console
  console.log(tweets.length, 'tweets') // eslint-disable-line no-console

  const mentionIds: { [key: string]: UserModel['mentionIds'] } = {}
  tweets.forEach((tweet) =>
    (tweet.entities?.mentions || []).forEach(({ username }) => {
      if (mentionIds[username] === undefined) mentionIds[username] = []
      mentionIds[username].push(tweet.id)
    })
  )

  const nodes: Array<GraphNode> = []
  const usernameToId = {}
  const usedUsers: { [id: string]: UserModel } = {}
  users.forEach((user) => {
    const { id, username } = user
    if (username === 'auth0') return
    if (mentionIds[username] === undefined || mentionIds[username].length <= 10)
      return

    const nodeId = `user-${id}`
    const nodeUser = {
      ...user,
      mentionIds: mentionIds[username],
    }
    nodes.push({
      data: {
        id: nodeId,
        user: nodeUser,
      },
    })
    usedUsers[nodeUser.id] = nodeUser
    usernameToId[username] = id
  })

  const edges: Array<GraphEdge> = []
  tweets.forEach((tweet) =>
    (tweet.entities?.mentions || []).forEach(({ username }) => {
      const targetId = usernameToId[username]
      if (!usedUsers[tweet.author_id] || !usedUsers[targetId]) return

      const edgeId = `tweet-${tweet.id}`
      edges.push({
        data: {
          id: edgeId,
          source: `user-${tweet.author_id}`,
          target: `user-${targetId}`,
          tweet: {
            ...tweet,
            edge: {
              source: {
                href: `#user-${tweet.author_id}`,
                username: usedUsers[tweet.author_id].username,
              },
              target: {
                href: `#user-${targetId}`,
                username: usedUsers[targetId].username,
              },
            },
          },
        },
      })
    })
  )

  console.log(nodes.length, 'nodes') // eslint-disable-line no-console
  console.log(edges.length, 'edges') // eslint-disable-line no-console

  return {
    props: {
      graphData: {
        elements: {
          nodes,
          edges,
        },
      },
    },
    revalidate: 60 * 60 * 24,
  }
}

type Resource = ['user', UserModel] | ['tweet', TweetModel] | null

export default function Home({ graphData }: Props) {
  const [resource, setResource] = useState<Resource>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const onCyCreated = useRef<(cy: cytoscape.Core) => void>(() => undefined)
  const cyRef = useRef(null)

  const startClosingDetail = () => setIsDetailOpen(false)
  const onDetailClosed = () => {
    if (isDetailOpen) return

    // to trigger hashchange
    location.hash = ''

    // to remove hash completely
    history.pushState(
      '',
      document.title,
      window.location.pathname + window.location.search
    )
  }

  useEffect(() => {
    const setResourceByHash = () => {
      let match = location.hash.match(/^#user-([\d]+)$/)
      if (match) {
        const node = graphData.elements.nodes.find(
          (node) => node.data.user.id === match[1]
        )
        if (!node) return
        setResource(['user', node.data.user])
        onCyCreated.current = (cy) => cy.$(`#${node.data.id}`).select()
        setIsDetailOpen(true)
        return
      }
      match = location.hash.match(/^#tweet-([\d]+)$/)
      if (match) {
        const edge = graphData.elements.edges.find(
          (edge) => edge.data.tweet.id === match[1]
        )
        if (!edge) return
        setResource(['tweet', edge.data.tweet])
        onCyCreated.current = (cy) => cy.$(`#${edge.data.id}`).select()
        setIsDetailOpen(true)
        return
      }

      setResource(null)
      setIsDetailOpen(false)
    }

    setResourceByHash()
    window.addEventListener('hashchange', setResourceByHash, false)
    return () => window.removeEventListener('hashchange', setResourceByHash)
  }, [])

  useLayoutEffect(() => {
    if (cyRef.current) {
      const cy = cytoscape({
        container: cyRef.current,
        autoungrabify: true,
        ...graphData,
        style: [
          {
            selector: 'node',
            style: {
              height: 80,
              width: 80,
              'background-fit': 'cover',
              'border-color': '#e5e7eb',
              'border-width': 2,
              'background-image': (ele) =>
                ele.data().user.profile_image_data_uri,
            },
          },
          {
            selector: 'node:selected',
            style: {
              height: 120,
              width: 120,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'curve-style': 'straight',
              'target-arrow-shape': 'triangle',
            },
          },
          {
            selector: 'edge:selected',
            style: {
              width: 3,
            },
          },
        ],
        layout: {
          name: 'concentric',
          concentric(node: any) {
            return node.data('user').mentionIds.length
          },
          levelWidth(_nodes) {
            return 4
          },
        },
      })
      cy.on('tap', 'node', (e) => {
        location.hash = e.target.id()
      })
      cy.on('tap', 'edge', (e) => {
        location.hash = e.target.id()
      })
      cy.on('tap', (e) => {
        if (e.target === cy) {
          startClosingDetail()
        }
      })
      onCyCreated.current(cy)
      onCyCreated.current = () => undefined

      return () => cy.destroy()
    }
  }, [cyRef.current])

  return (
    <div>
      <Head>
        <title>Who influences whom?</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.twttr = (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || { };
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = "https://platform.twitter.com/widgets.js";
          fjs.parentNode.insertBefore(js, fjs);

          t._e = [];
          t.ready = function(f) {
            t._e.push(f);
          };

          return t;
        }(document, "script", "twitter-wjs"));
        `,
          }}
        ></script>

        <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#" />
        <meta
          property="og:url"
          content="https://who-influences-whom.vercel.app"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Who influences whom?" />
        <meta
          property="og:description"
          content={`Mention graph of a tweet from auth0, "Name a developer who's had an influence on you."`}
        />
        <meta
          property="og:image"
          content="https://who-influences-whom.vercel.app/screen_shot.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@en30Y" />
        <meta name="twitter:title" content="Who influences whom?" />
        <meta
          name="twitter:description"
          content={`Mention graph of a tweet from auth0, "Name a developer who's had an influence on you."`}
        />
        <meta
          name="twitter:image"
          content="https://who-influences-whom.vercel.app/screen_shot.png"
        />
      </Head>

      <Header />
      <main>
        <div className="w-screen h-screen" ref={cyRef}></div>
      </main>

      <div
        className={
          'fixed bottom-0 left-0 border-t bg-white w-full h-72 overflow-y-scroll py-2 px-4 transition-transform transform ' +
          'sm:right-0 sm:top-0 sm:left-auto sm:bottom-auto sm:border-t-0 sm:border-l sm:w-80 sm:h-full ' +
          (isDetailOpen
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-72 sm:translate-y-0 sm:translate-x-80')
        }
        onTransitionEnd={onDetailClosed}
      >
        {resource && resource[0] === 'user' && (
          <User user={resource[1]} close={startClosingDetail} />
        )}
        {resource && resource[0] === 'tweet' && (
          <Tweet tweet={resource[1]} close={startClosingDetail} />
        )}
      </div>
    </div>
  )
}
