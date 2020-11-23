import { GetStaticProps } from 'next'
import cytoscape from 'cytoscape'
import * as admin from 'firebase-admin'
import Head from 'next/head'
import { useLayoutEffect, useRef, useState } from 'react'
import Tweet from '../components/Tweet'

export const getStaticProps: GetStaticProps = async (_context) => {
  if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.SERVICE_ACCOUNT_KEY!.replace(/\n/g, '\\n'))
        ),
      })
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      })
    }
  }
  const style = [
    {
      selector: 'node',
      style: {
        height: 80,
        width: 80,
        'background-fit': 'cover',
        'border-color': '#e5e7eb',
        'border-width': 2,
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
  ]
  const nodes = []
  const edges = []
  const idToUser = {}
  const usernameToUser = {}
  const db = admin.firestore()
  let snapshot = await db.collection('users').get()
  console.log(snapshot.size, 'users') // eslint-disable-line no-console
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (data.username === 'auth0') return

    const id = `user-${data.username}`
    idToUser[doc.id] = data
    usernameToUser[data.username] = data
    nodes.push({
      data: {
        id,
        twitterId: doc.id,
      },
    })
    style.push({
      selector: `#${id}`,
      style: {
        'background-image': data.profile_image_data_uri,
      } as any,
    })
  })

  snapshot = await db.collectionGroup('tweets').get()
  console.log(snapshot.size, 'tweets') // eslint-disable-line no-console
  snapshot.forEach((doc) => {
    const id = `tweet-${doc.id}`
    const data = doc.data()
    if (data.entities && data.entities.mentions)
      data.entities.mentions.forEach(({ username }) => {
        const source = idToUser[data.author_id]
        const target = usernameToUser[username]
        if (!source || !target) return

        edges.push({
          data: {
            id,
            source: `user-${source.username}`,
            target: `user-${target.username}`,
          },
        })
      })
  })

  return {
    props: {
      graphData: {
        elements: {
          nodes,
          edges,
        },
        style,
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
        layout: {
          name: 'concentric',
          concentric(node: any) {
            return node.indegree()
          },
          levelWidth(_nodes) {
            return 1
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
        <title>Who influences whom</title>
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
        <details open className="text-sm text-gray-500">
          <summary>Visualization of mention relation of the tweet.</summary>
          <Tweet id="1329563881006641152" />
        </details>
      </header>

      <main>
        <div className="w-screen h-screen" ref={cyRef}></div>
      </main>
    </div>
  )
}
