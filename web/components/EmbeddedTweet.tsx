import { useLayoutEffect, useRef, useState, memo } from 'react'

const EmbeddedTweet = ({ id }) => {
  const ref = useRef(null)
  const [loading, setLoading] = useState(true)

  useLayoutEffect(() => {
    if (ref.current) {
      window.twttr.ready(() => {
        if (ref.current) {
          setLoading(true)
          ref.current.innerHTML = ''

          window.twttr.widgets
            .createTweet(id, ref.current, {
              conversation: 'none',
            })
            .then(() => {
              setLoading(false)
              while (ref.current && ref.current.childElementCount > 1) {
                ref.current.removeChild(ref.current.firstElementChild)
              }
            })
        }
      })
    }
  }, [id, ref.current])

  return (
    <div>
      {loading ? (
        <div className="animate-pulse border rounded-lg p-3 w-full my-1 mx-auto space-y-2">
          <div className="flex space-x-2">
            <div className="rounded-full bg-gray-300 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-2">
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
          <div className="py-2">
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      ) : null}
      <div ref={ref}></div>
    </div>
  )
}

export default memo(EmbeddedTweet)
