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

  return <div ref={ref}></div>
}

export default Tweet
