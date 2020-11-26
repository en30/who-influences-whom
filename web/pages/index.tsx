import { GetStaticProps } from 'next'
import cytoscape from 'cytoscape'
import Head from 'next/head'
import { useLayoutEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Tweet from '../components/Tweet'
import * as Repo from '../src/repo'

export const getStaticProps: GetStaticProps = async (_context) => {
  const [users, tweets] = await Promise.all([Repo.allUsers(), Repo.allTweets()])
  console.log(users.length, 'users') // eslint-disable-line no-console
  console.log(tweets.length, 'tweets') // eslint-disable-line no-console

  const inDeg = {}
  tweets.forEach((tweet) =>
    (tweet.entities?.mentions || []).forEach(({ username }) => {
      inDeg[username] = (inDeg[username] || 0) + 1
    })
  )

  const nodes = []
  const usernameToId = {}
  const usedUserIds = new Set<string>()
  users.forEach(
    ({
      id,
      name,
      username,
      description,
      profile_image_data_uri,
      profile_image_url,
    }) => {
      if (username === 'auth0') return
      if (inDeg[username] === undefined || inDeg[username] <= 10) return

      const nodeId = `user-${id}`
      nodes.push({
        data: {
          id: nodeId,
          twitterId: id,
          name,
          username,
          description,
          profileImageDataURI: profile_image_data_uri,
          profileImageURL: profile_image_url,
          mentionInDegree: inDeg[username],
        },
      })
      usedUserIds.add(id)
      usernameToId[username] = id
    }
  )

  const edges = []
  tweets.forEach((tweet) =>
    (tweet.entities?.mentions || []).forEach(({ username }) => {
      const targetId = usernameToId[username]
      if (!usedUserIds.has(tweet.author_id) || !usedUserIds.has(targetId))
        return

      const edgeId = `tweet-${tweet.id}`
      edges.push({
        data: {
          id: edgeId,
          source: `user-${tweet.author_id}`,
          target: `user-${targetId}`,
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

export default function Home({ graphData }) {
  const [user, setUser] = useState(null)
  const [tweet, setTweet] = useState(null)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [, setCy] = useState(null)
  const cyRef = useRef(null)

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
              'background-image': `data(profileImageDataURI)`,
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
        ],
        layout: {
          name: 'concentric',
          concentric(node: any) {
            return node.data('mentionInDegree')
          },
          levelWidth(_nodes) {
            return 4
          },
        },
      })
      cy.on('tap', 'node', (e) => {
        location.hash = e.target.id()
        setUser(e.target.data())
        setTweet(null)
        setIsDetailOpen(true)
      })
      cy.on('tap', 'edge', (e) => {
        location.hash = e.target.id()
        setUser(null)
        setTweet(e.target.data())
        setIsDetailOpen(true)
      })
      cy.on('tap', (e) => {
        if (e.target === cy) {
          history.pushState(
            '',
            document.title,
            window.location.pathname + window.location.search
          )
          setIsDetailOpen(false)
        }
      })

      setCy(cy)
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
      </Head>

      <Header />
      <main>
        <div className="w-screen h-screen" ref={cyRef}></div>
      </main>

      <div
        className={
          'fixed bottom-0 left-0 border-t bg-white w-full h-64 py-2 px-4 transition-transform transform ' +
          'sm:right-0 sm:top-0 sm:left-auto sm:bottom-auto sm:border-t-0 sm:border-l sm:w-80 sm:h-full ' +
          (isDetailOpen
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-64 sm:translate-x-80')
        }
      >
        {user ? (
          <>
            <div className="py-2 flex">
              <a
                className="w-12 h-12"
                style={{ flex: '0 0 48px' }}
                href={`https://twitter.com/i/user/${user.twitterId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={user.profileImageURL}
                  alt="Picture of the user"
                  width={48}
                  height={48}
                  className="border rounded-full w-12 h-12"
                />
              </a>
              <div className="ml-3">
                <a
                  className="block leading-tight text-black font-bold"
                  href={`https://twitter.com/i/user/${user.twitterId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.name}
                </a>
                <a
                  className="block leading-tight text-gray-500 text-md"
                  href={`https://twitter.com/i/user/${user.twitterId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.username}
                </a>
                <div className="leading-tight mt-2">{user.description}</div>
              </div>
            </div>
          </>
        ) : null}
        {tweet && <Tweet id={tweet.id.replace(/^tweet-/, '')} />}
      </div>
    </div>
  )
}
