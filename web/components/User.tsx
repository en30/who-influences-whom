const User = ({ user }) => (
  <>
    <div className="py-2 flex">
      <a
        className="w-12 h-12"
        style={{ flex: '0 0 48px' }}
        href={`https://twitter.com/i/user/${user.twitterId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={user.profileImageURL}
          alt="Picture of the user"
          width={48}
          height={48}
          className="border rounded-full w-12 h-12"
        />
      </a>
      <div className="ml-3">
        <a
          className="block leading-tight text-black font-bold"
          href={`https://twitter.com/i/user/${user.twitterId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {user.name}
        </a>
        <a
          className="block leading-tight text-gray-500 text-md"
          href={`https://twitter.com/i/user/${user.twitterId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{user.username}
        </a>
        <div className="leading-tight mt-2">{user.description}</div>
      </div>
    </div>
  </>
)

export default User
