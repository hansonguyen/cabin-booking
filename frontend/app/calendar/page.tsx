// Components
import MainCalendar from './MainCalendar'
import NewEvent from '../components/NewEvent'
// Actions
import { getEvents } from '../actions/actions'

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
