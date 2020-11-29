import { MouseEvent, memo, useState } from 'react'
import { UserModel } from '../@types'
import { Mention, ShortendedURL } from '../src/repo'
import CloseButton from './CloseButton'
import EmbeddedTweet from './EmbeddedTweet'

const Link = ({ to, children, ...props }) => (
  <a
    href={`https://twitter.com/i/user/${to.id}`}
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    {children}
  </a>
)

const substring = (s: string, start: number, end: number) =>
  Array.from(s).slice(start, end).join('')

const embedEntities = (parts, entities, f) => {
  if (!entities) return parts

  let res = parts
  entities.forEach((entity) => {
    res = res.flatMap((part) => {
      const [start, end, elem] = part as [number, number, string]
      if (start <= entity.start && entity.end <= end) {
        return [
          [start, entity.start, substring(elem, 0, entity.start - start)],
          [entity.start, entity.end, f(entity)],
          [entity.end, end, substring(elem, entity.end - start, end - start)],
        ]
      } else {
        return [part]
      }
    })
  })
  return res
}

const Description = memo(
  ({
    children,
    entities,
  }: {
    children: string
    entities?: UserModel['entities']['description']
  }) => {
    let parts = [[0, children.length, children]]

    parts = embedEntities(parts, entities?.mentions, (mention: Mention) => (
      <a
        key={`${mention.start}-${mention.end}`}
        className="text-blue-400 hover:underline"
        href={`https://twitter.com/${mention.username}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        @{mention.username}
      </a>
    ))

    parts = embedEntities(parts, entities?.urls, (shortened: ShortendedURL) => (
      <a
        key={`${shortened.start}-${shortened.end}`}
        className="text-blue-400 hover:underline"
        href={shortened.expanded_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {shortened.display_url}
      </a>
    ))

    return (
      <div className="leading-tight mt-2">
        {parts.map(([_start, _end, elem]) => elem)}
      </div>
    )
  }
)

const TweetsContainer = ({ title, children }) => (
  <div className="my-6">
    <div className="sticky top-0 z-10 bg-white px-4 py-2 text-sm font-bold">
      {title}
    </div>
    {children}
  </div>
)

const Tweets = ({ title, ids }) => {
  const [open, setOpen] = useState(false)

  if (ids.length === 0) {
    return (
      <TweetsContainer title={title}>
        <div className="px-4 text-sm text-gray-400">no tweet</div>
      </TweetsContainer>
    )
  }

  if (!open) {
    return (
      <TweetsContainer title={title}>
        <div className="px-4">
          <button
            className="px-3 py-1 text-xs border rounded text-gray-800 shadow"
            onClick={() => setOpen(true)}
          >
            Load {ids.length} tweets
          </button>
          <div className="mt-2 flex items-top text-yellow-400">
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs ml-1">
              loading tweets might take some time and data traffic.
            </div>
          </div>
        </div>
      </TweetsContainer>
    )
  }

  return (
    <TweetsContainer title={title}>
      <ul className="px-4">
        {ids.map((id) => (
          <li key={id}>
            <EmbeddedTweet id={id} />
          </li>
        ))}
      </ul>
    </TweetsContainer>
  )
}

const User = ({
  user,
  close,
}: {
  user: UserModel
  close: (event: MouseEvent<HTMLButtonElement>) => void
}) => (
  <>
    <div className="flex items-center px-4 py-2">
      <div className="flex-1 text-sm text-gray-500">
        {user.inMentionIds.length} mentions
      </div>
      <CloseButton onClick={close} />
    </div>
    <div className="px-4 flex">
      <Link to={user} className="w-12 h-12" style={{ flex: '0 0 48px' }}>
        <img
          src={user.profile_image_url}
          alt="Picture of the user"
          width={48}
          height={48}
          className="border rounded-full w-12 h-12"
        />
      </Link>
      <div className="ml-3">
        <div>
          <Link to={user} className="leading-tight text-black font-bold">
            {user.name}
          </Link>
        </div>
        <div>
          <Link to={user} className="leading-tight text-gray-500 text-md">
            @{user.username}
          </Link>
        </div>
        <Description entities={user.entities?.description}>
          {user.description}
        </Description>
      </div>
    </div>

    <Tweets
      key={`${user.id}-in`}
      title={`Mentions from @${user.username}`}
      ids={user.outMentionIds}
    />
    <Tweets
      key={`${user.id}-out`}
      title={`Mentions to @${user.username}`}
      ids={user.inMentionIds}
    />
  </>
)

export default User
