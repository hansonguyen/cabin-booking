// Actions
import { getEvents } from '../actions/actions'
import NewEvent from '../components/NewEvent'
import MainCalendar from './MainCalendar'

async function CalendarPage() {
  const events = await getEvents()
  return (
    <>
      <NewEvent />
      <MainCalendar events={events} />
    </>
  )
}

export default CalendarPage
