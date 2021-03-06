import { memo } from 'react'
import EmbeddedTweet from './EmbeddedTweet'
import { TweetModel } from '../@types'

const Tweet = ({ tweet }: { tweet: TweetModel }) => (
  <>
    <div className="flex items-center px-4 py-2">
      <div className="flex-1 flex items-center text-sm text-gray-500">
        <a href={tweet.edge.source.href}>@{tweet.edge.source.username}</a>
        <svg
          className="text-gray-500 h-4 w-4 mx-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
        <a href={tweet.edge.target.href}>@{tweet.edge.target.username}</a>
      </div>
    </div>
    <div className="px-4">
      <EmbeddedTweet id={tweet.id} />
    </div>
  </>
)

export default memo(Tweet)
