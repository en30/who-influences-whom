import { GetStaticProps } from 'next'
import cytoscape from 'cytoscape'
import Head from 'next/head'
import { useLayoutEffect, useRef, useState } from 'react'
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
  users.forEach(({ id, username, profile_image_data_uri }) => {
    if (username === 'auth0') return
    if (inDeg[username] === undefined || inDeg[username] <= 10) return

    const nodeId = `user-${id}`
    nodes.push({
      data: {
        id: nodeId,
        twitterId: id,
        profileImageDataURI: profile_image_data_uri,
        mentionInDegree: inDeg[username],
      },
    })
    usedUserIds.add(id)
    usernameToId[username] = id
  })

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
  const [, setCy] = useState(null)
  const cyRef = useRef(null)

  useLayoutEffect(() => {
    if (cyRef.current) {
      const cy = cytoscape({
        container: cyRef.current,
        hideEdgesOnViewport: true,
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
        window.open(`https://twitter.com/i/user/${e.target.data().twitterId}`)
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

      <header className="fixed top-0 left-0 z-50 bg-white w-full sm:w-auto sm:border-r border-b sm:rounded-br-lg py-2 px-4">
        <h1 className="font-bold text-gray-700">Who influences whom?</h1>
        <details open className="text-xs text-gray-500">
          <summary className="text-sm text-gray-500">
            Visualization of mentions related to the tweet.
          </summary>
          <Tweet id="1329563881006641152" />
          For performance reason, the graph only includes users whose indegree
          is greater than 10.
        </details>
      </header>

      <main>
        <div className="w-screen h-screen" ref={cyRef}></div>
      </main>
    </div>
  )
}
