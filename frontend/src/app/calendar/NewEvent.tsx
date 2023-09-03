'use client'
// Actions
import { Input } from '@nextui-org/react'

import { handleSubmit } from '@/src/actions/actions'
import { experimental_useOptimistic as useOptimistic, useRef } from 'react'
import MainCalendar from './MainCalendar'
import { Event } from '@/src/types/types'
import NewEventButton from '@/src/components/NewEventButton'
import { useSession } from 'next-auth/react'

type NewEventProps = {
  events: Event[]
}

function NewEvent({ events }: NewEventProps) {
  const { data: session } = useSession()
  const ref = useRef<HTMLFormElement>(null)
  const [optimisticEvents, addOptimisticEvent] = useOptimistic(
    events,
    (state: Event[], newEvent: Event) => {
      return [...state, newEvent]
    }
  )

  return (
    <>
      <h1 className="text-2xl text-center">Create new event</h1>
      <form
        ref={ref}
        action={async (formData) => {
          ref.current?.reset()
          const title = formData.get('title')?.valueOf()
          if (typeof title !== 'string' || title.length === 0)
            throw new Error('Invalid title.')

          const userId = session?.user?.name
          if (typeof userId !== 'string' || userId.length === 0)
            throw new Error('Invalid User Id.')

          const startStr = formData.get('start')?.valueOf()
          if (typeof startStr !== 'string' || startStr.length === 0)
            throw new Error('Invalid Start Date.')
          const start = new Date(startStr)

          const endStr = formData.get('end')?.valueOf()
          if (typeof endStr !== 'string' || endStr.length === 0)
            throw new Error('Invalid End Date.')
          const end = new Date(endStr)

          const newEvent: Event = {
            _id: Math.random().toString(),
            title: title,
            userId: userId,
            start: start,
            end: end,
            allDay: true
          }
          addOptimisticEvent(newEvent)
          await handleSubmit(formData)
        }}
        className="flex justify-center align-center gap-4"
      >
        <div className="flex flex-col">
          <label htmlFor="title">Title</label>
          <Input required type="text" name="title" />
        </div>
        {/* <div className="flex flex-col">
          <label htmlFor="userId">UserId</label>
          <Input required type="text" name="userId" />
        </div> */}
        <div className="flex flex-col">
          <label htmlFor="start">Start</label>
          <Input required type="date" name="start" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="end">End</label>
          <Input required type="date" name="end" />
        </div>
        <NewEventButton />
      </form>
      <MainCalendar events={optimisticEvents} />
    </>
  )
}

export default NewEvent
