'use client'
import { Input } from '@nextui-org/react'
import {Checkbox} from "@nextui-org/react"
import { experimental_useOptimistic as useOptimistic, useRef } from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify'

import CreateButton from '@/src/components/CreateButton'
import { Event } from '@/src/types/types'
import { createEvent, validateNewEvent } from '@/src/utils/actions'
import { isEvent } from '@/src/utils/utils'

import MainCalendar from '../MainCalendar'

type NewEventProps = {
  events: Event[]
}

function NewEvent({ events }: NewEventProps) {
  const ref = useRef<HTMLFormElement>(null)
  // Used to optimistically update events in calendar
  const [optimisticEvents, addOptimisticEvent] = useOptimistic(
    events,
    (state: Event[], newEvent: Event) => {
      return [...state, newEvent]
    }
  )

  /**
   * Attempt to create a new event
   * @param formData
   * @returns
   */


  const [checked, setChecked] = useState(false);
  const handleNewSubmit = async (formData: FormData) => {
    const result = await validateNewEvent(formData, checked)

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
        action={(formData) => handleNewSubmit(formData)}
        className="text-center mt-4"
      >
        <div className="flex justify-center align-center gap-4 mt-4">
          <div className="flex flex-col">
          <label htmlFor="title">Title of Trip <span style={{ color: 'red' }}>*</span></label>
            <Input required type="text" name="title" />
          </div>          
          <div className="flex flex-col">
            <label htmlFor="start">Start <span style={{ color: 'red' }}>*</span></label>
            <Input required type="date" name="start" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end">End <span style={{ color: 'red' }}>*</span></label>
            <Input required type="date" name="end" />
          </div> 
          <div className="flex flex-col">
            <label htmlFor="title">Description</label>
            <Input required type="text" name="description" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="title">Custom Name?</label>
            <Input required type="text" name="customName" />
          </div>
          <div className="flex flex-col items-center">
          <label htmlFor="everyone">For Everyone?</label>
            <Checkbox isSelected={checked} name="everyone" onChange={(e) => setChecked(e.target.checked)} style = {{paddingTop: '1.5ch'}} />
          </div>
        </div>
        <CreateButton label="Create Event" />
      </form>
      <MainCalendar events={optimisticEvents} />
    </>
  )
}

export default NewEvent
