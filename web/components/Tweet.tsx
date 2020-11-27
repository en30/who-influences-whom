import { Tweet as TweetModel } from '../src/repo'
import EmbeddedTweet from './EmbeddedTweet'

const Tweet = ({ tweet }: { tweet: TweetModel }) => (
  <EmbeddedTweet id={tweet.id} />
)

export default Tweet
