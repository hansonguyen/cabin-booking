// Actions
import { handleSubmit } from '../actions/actions'

function NewEvent() {
  return (
    <>
      <h1 className="text-2xl text-center">Create new event</h1>
      <form action={handleSubmit} className='flex justify-center align-center gap-4'>
        <div className="flex flex-col">
          <label htmlFor="title">Title</label>
          <input
            required
            type="text"
            name="title"
            className="w-[12rem] border-solid border-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="userId">UserId</label>
          <input
            required
            type="text"
            name="userId"
            className="w-[12rem] border-solid border-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="start">Start</label>
          <input
            required
            type="date"
            name="start"
            className="w-[12rem] border-solid border-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="end">End</label>
          <input
            required
            type="date"
            name="end"
            className="w-[12rem] border-solid border-2"
          />
        </div>
        <button type="submit" className="px-2 py-1 bg-blue-500 rounded-lg">
          Create Event
        </button>
      </form>
    </>
  )
}

export default NewEvent
