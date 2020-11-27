import { User as UserModel, Mention, ShortendedURL } from '../src/repo'

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

const Description = ({
  children,
  entities,
}: {
  children: string
  entities?: {
    mentions?: Array<Mention>
    urls: Array<ShortendedURL>
  }
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

const User = ({ user }: { user: UserModel }) => (
  <>
    <div className="py-2 flex">
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
        <Link to={user} className="block leading-tight text-black font-bold">
          {user.name}
        </Link>
        <Link to={user} className="block leading-tight text-gray-500 text-md">
          @{user.username}
        </Link>
        <Description entities={user.entities?.description}>
          {user.description}
        </Description>
      </div>
    </div>
  </>
)

export default User
