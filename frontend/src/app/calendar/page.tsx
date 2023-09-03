// Actions
import { getEvents } from '@/src/actions/actions'
import NewEvent from '@/src/components/NewEvent'
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
