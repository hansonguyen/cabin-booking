'use client'
// Actions
import { Button, Input } from '@nextui-org/react'

import { handleSubmit } from '../actions/actions'

function NewEvent() {
  return (
    <>
      <h1 className="text-2xl text-center">Create new event</h1>
      <form
        action={handleSubmit}
        className="flex justify-center align-center gap-4"
      >
        <div className="flex flex-col">
          <label htmlFor="title">Title</label>
          <Input required type="text" name="title" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="userId">UserId</label>
          <Input required type="text" name="userId" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="start">Start</label>
          <Input required type="date" name="start" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="end">End</label>
          <Input required type="date" name="end" />
        </div>
        <Button type="submit" color='primary'>Create Event</Button>
      </form>
    </>
  )
}

export default NewEvent
