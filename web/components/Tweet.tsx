import { MouseEvent } from 'react'
import EmbeddedTweet from './EmbeddedTweet'
import CloseButton from './CloseButton'
import { TweetModel } from '../@types'

const Tweet = ({
  tweet,
  close,
}: {
  tweet: TweetModel
  close: (event: MouseEvent<HTMLButtonElement>) => void
}) => (
  <>
    <div className="flex justify-end">
      <CloseButton onClick={close} />
    </div>
    <EmbeddedTweet id={tweet.id} />
  </>
)

export default Tweet
