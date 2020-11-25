import { useLayoutEffect, useRef } from 'react'

const Tweet = ({ id }) => {
  const ref = useRef(null)

  useLayoutEffect(() => {
    if (ref.current) {
      window.twttr.ready(() => {
        if (ref.current) {
          window.twttr.widgets
            .createTweet(id, ref.current, {
              conversation: 'none',
            })
            .then(() => {
              while (ref.current.childElementCount > 1) {
                ref.current.removeChild(ref.current.firstElementChild)
              }
            })
        }
      })
    }
  }, [ref.current])

  return (
    <div ref={ref}>
      <div className="border rounded-lg p-3 w-full mt-3 mx-auto space-y-2">
        <div className="animate-pulse flex space-x-2">
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
    </div>
  )
}

export default Tweet
