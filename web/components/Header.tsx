import { useEffect, useState } from 'react'
import Tweet from '../components/Tweet'

const key = 'isHeaderOpen'

const Header = () => {
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!localStorage) {
      setOpen(true)
    } else {
      const v = localStorage.getItem(key)
      setOpen(v === null || v === 'true')
    }
  }, [])

  const toggle = () => {
    if (localStorage) localStorage.setItem(key, (!open).toString())
    setOpen(!open)
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full sm:w-96">
      <div className="sm:border-r border-b py-2 px-4 bg-white">
        <h1 className="font-bold text-gray-700">Who influences whom?</h1>
        <div
          className={
            'transition-all overflow-hidden duration-400 ease-in ' +
            (open ? 'max-h-64' : 'max-h-0')
          }
        >
          <div className="text-sm text-gray-500">
            Visualization of mentions related to the tweet.
          </div>
          <Tweet id="1329563881006641152" />
          <div className="text-xs text-gray-500">
            For performance reason, the graph only includes users whose indegree
            is greater than 10.
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="bg-white hover:bg-gray-100 border-l border-r border-b rounded-b-lg px-2 focus:outline-none focus:ring-1 ring-blue-300 ring-inset"
          onClick={toggle}
        >
          {open ? (
            <svg
              className="h-6 w-6 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
