'use client'
import { Input } from '@nextui-org/react'
import { experimental_useOptimistic as useOptimistic, useRef } from 'react'
import { toast } from 'react-toastify'

import { createEvent, validateNewEvent } from '@/src/actions/actions'
import NewEventButton from '@/src/components/NewEventButton'
import { Event } from '@/src/types/types'
import { isEvent } from '@/src/utils/utils'

import MainCalendar from './MainCalendar'

type NewEventProps = {
  events: Event[]
}

function NewEvent({ events }: NewEventProps) {
  const ref = useRef<HTMLFormElement>(null)
  const [optimisticEvents, addOptimisticEvent] = useOptimistic(
    events,
    (state: Event[], newEvent: Event) => {
      return [...state, newEvent]
    }
  )

  const handleSubmit = async (formData: FormData) => {
    const result = await validateNewEvent(formData)
    if (!isEvent(result)) {
      const toastId = 'validate-error'
      toast.error(result.error, {
        toastId,
        position: 'top-center',
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })
      return
    }
    ref.current?.reset()
    addOptimisticEvent(result)
    await createEvent(result)
    toast.success(`Successfully added ${result.title}.`, {
      position: 'top-center',
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'colored'
    })
  }

  return (
    <>
      <form
        ref={ref}
        action={(formData) => handleSubmit(formData)}
        className="text-center mt-4"
      >
        <div className="flex justify-center align-center gap-4 mt-4">
          <div className="flex flex-col">
            <label htmlFor="title">Title of Trip</label>
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
          <div className="flex flex-col">
            <label htmlFor="everyone">Everyone?</label>
            <input type="checkbox" id="everyone" name="everyone"/>
          </div>
        </div>
        <NewEventButton />
      </form>
      <MainCalendar events={optimisticEvents} />
    </>
  )
}

export default NewEvent
