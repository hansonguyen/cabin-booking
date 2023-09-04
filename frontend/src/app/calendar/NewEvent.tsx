'use client'
// Actions
import { Input } from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import { experimental_useOptimistic as useOptimistic, useRef } from 'react'

import { createEvent, validateNewEvent } from '@/src/actions/actions'
import NewEventButton from '@/src/components/NewEventButton'
import { Event } from '@/src/types/types'

import MainCalendar from './MainCalendar'

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

  const handleSubmit = async (formData: FormData) => {
    ref.current?.reset()
    const newEvent = await validateNewEvent(formData)
    addOptimisticEvent(newEvent)
    await createEvent(newEvent)
  }

  return (
    <>
      <form ref={ref} action={(formData) => handleSubmit(formData)} className='text-center mt-4'>
        <div className="flex justify-center align-center gap-4 mt-4">
          <div className="flex flex-col">
            <label htmlFor="title">Title</label>
            <Input required type="text" name="title" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="start">Start</label>
            <Input required type="date" name="start" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end">End</label>
            <Input required type="date" name="end" />
          </div>
        </div>
        <NewEventButton />
      </form>
      <MainCalendar events={optimisticEvents} />
    </>
  )
}

export default NewEvent
