import { GetStaticProps } from 'next'
import { useEffect, useRef, useState, useCallback } from 'react'
import Header from '../components/Header'
import Graph, { selected } from '../components/Graph'
import Tweet from '../components/Tweet'
import User from '../components/User'
import CloseButton from '../components/CloseButton'
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

const sortAsBigInt = (a: string, b: string) => {
  const bia = BigInt(a),
    bib = BigInt(b)
  return bia < bib ? -1 : bia > bib ? 1 : 0
}

export const getStaticProps: GetStaticProps = async (_context) => {
  const [users, tweets] = await Promise.all([Repo.allUsers(), Repo.allTweets()])
  console.log(users.length, 'users') // eslint-disable-line no-console
  console.log(tweets.length, 'tweets') // eslint-disable-line no-console

  const usernameToInMentionIds: {
    [username: string]: UserModel['inMentionIds']
  } = {}
  const idToOutMentionIds: { [userId: string]: UserModel['outMentionIds'] } = {}
  tweets.forEach((tweet) => {
    ;(tweet.entities?.mentions || []).forEach(({ username }) => {
      if (usernameToInMentionIds[username] === undefined)
        usernameToInMentionIds[username] = []
      usernameToInMentionIds[username].push(tweet.id)
    })
    if (idToOutMentionIds[tweet.author_id] === undefined)
      idToOutMentionIds[tweet.author_id] = []
    idToOutMentionIds[tweet.author_id].push(tweet.id)
  })

  const nodes: Array<GraphNode> = []
  const usernameToId = {}
  const usedUsers: { [id: string]: UserModel } = {}
  users.forEach((user) => {
    const { id, username } = user
    if (username === 'auth0') return
    if (
      usernameToInMentionIds[username] === undefined ||
      usernameToInMentionIds[username].length <= 10
    )
      return

    const nodeId = `user-${id}`
    const nodeUser = {
      ...user,
      inMentionIds: usernameToInMentionIds[username].sort(sortAsBigInt),
      outMentionIds: (idToOutMentionIds[id] || []).sort(sortAsBigInt),
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
  const detailRef = useRef(null)

  const startClosingDetail = useCallback(() => setIsDetailOpen(false), [])
  const onDetailClosed = useCallback(() => {
    if (isDetailOpen) return

    // to trigger hashchange
    location.hash = ''

    // to remove hash completely
    history.pushState(
      '',
      document.title,
      window.location.pathname + window.location.search
    )
  }, [isDetailOpen])

  useEffect(() => {
    const setResourceByHash = () => {
      if (detailRef.current) detailRef.current.scrollTop = 0

      const match = selected(location.hash, graphData)
      if (match === null) {
        setResource(null)
        setIsDetailOpen(false)
      } else if (match[0] === 'node') {
        setResource(['user', match[1].data.user])
        setIsDetailOpen(true)
      } else if (match[0] === 'edge') {
        setResource(['tweet', match[1].data.tweet])
        setIsDetailOpen(true)
      }
    }

    setResourceByHash()
    window.addEventListener('hashchange', setResourceByHash, false)
    return () => window.removeEventListener('hashchange', setResourceByHash)
  }, [])

  return (
    <div>
      <Header />
      <main>
        <Graph data={graphData} onTapSpace={startClosingDetail} />
      </main>

      <div
        ref={detailRef}
        className={
          'fixed bottom-0 left-0 border-t bg-white w-full h-72 transition-transform transform ' +
          'sm:right-0 sm:top-0 sm:left-auto sm:bottom-auto sm:border-t-0 sm:border-l sm:w-80 sm:h-full ' +
          (isDetailOpen
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-72 sm:translate-y-0 sm:translate-x-80')
        }
        onTransitionEnd={onDetailClosed}
      >
        <div className="absolute right-0 top-0 px-4 py-2 z-20">
          <CloseButton onClick={startClosingDetail} />
        </div>

        <div className="overflow-y-scroll h-72 sm:h-full">
          {resource && resource[0] === 'user' && <User user={resource[1]} />}
          {resource && resource[0] === 'tweet' && <Tweet tweet={resource[1]} />}
        </div>
      </div>
    </div>
  )
}
