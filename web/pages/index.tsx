import { GetStaticProps } from 'next'
import cytoscape from 'cytoscape'
import * as admin from 'firebase-admin'
import Head from 'next/head'
import { useLayoutEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'

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
        'border-color': '#000',
        'border-width': 3,
        'border-opacity': 0.5,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'curve-style': 'straight',
        'target-arrow-shape': 'triangle-backcurve',
      },
    },
  ]
  const nodes = []
  const edges = []
  const users = {}
  const db = admin.firestore()
  let snapshot = await db.collection('users').get()
  snapshot.forEach((doc) => {
    const data = doc.data()
    const id = `user-${data.username}`
    users[doc.id] = data
    nodes.push({ data: { id } })
    style.push({
      selector: `#${id}`,
      style: {
        'background-image': data.profile_image_url,
      },
    })
  })

  snapshot = await db.collectionGroup('tweets').get()
  snapshot.forEach((doc) => {
    const id = `tweet-${doc.id}`
    const data = doc.data()
    if (data.entities && data.entities.mentions)
      data.entities.mentions.forEach(({ username }) => {
        edges.push({
          data: {
            id,
            source: `user-${users[data.author_id].username}`,
            target: `user-${username}`,
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
        }, // list of graph elements to start with
        style,
      },
    },
    revalidate: 60 * 30,
  }
}

export default function Home({ graphData }) {
  const [, setCy] = useState(null)
  const cyRef = useRef(null)

  useLayoutEffect(() => {
    if (cyRef.current) {
      setCy(
        cytoscape({
          container: cyRef.current,
          ...graphData,
          layout: {
            name: 'concentric',
            concentric(node) {
              return node.indegree()
            },
            levelWidth(_nodes) {
              return 1
            },
          },
        })
      )
    }
  }, [cyRef.current])

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.graph} ref={cyRef}></div>
      </main>
    </div>
  )
}
