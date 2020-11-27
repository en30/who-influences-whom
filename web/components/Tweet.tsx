import EmbeddedTweet from './EmbeddedTweet'

const Tweet = ({ tweet }) => (
  <EmbeddedTweet id={tweet.id.replace(/^tweet-/, '')} />
)

export default Tweet
