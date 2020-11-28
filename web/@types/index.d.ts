import { Tweet, User } from '../src/repo'

type UserModel = User & {
  mentionIds: Array<string>
}

type TweetModel = Tweet & {
  edge: {
    source: { href: string; username: string }
    target: { href: string; username: string }
  }
}

type GraphNode = {
  data: {
    id: string
    user: User2
  }
}

type GraphEdge = {
  data: {
    id: string
    source: string
    target: string
    tweet: TweetModel
  }
}

type GraphData = {
  elements: {
    nodes: Array<GraphNode>
    edges: Array<GraphEdge>
  }
}
