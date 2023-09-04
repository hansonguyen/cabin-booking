'use client'

import { Button } from '@nextui-org/react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col justify-center items-center p-10 gap-20">
      <div className='text-center'>
        <h1 className="text-5xl font-bold">Something went wrong!</h1>
        <h2 className="text-4xl font-semibold mt-5">Please try again.</h2>
      </div>
      <p className="italic text-xl">{error.message}</p>
      <Button
        color="warning"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        size="lg"
      >
        Try again
      </Button>
    </div>
  )
}
