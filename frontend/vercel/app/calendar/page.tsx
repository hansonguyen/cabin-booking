// Components
import MainCalendar from './MainCalendar'
// Types
import { Event, EventApiResponse } from '../types/types'

const getEvents = async (): Promise<Event[]> => {
  const response = await fetch(`${process.env.BASE_URL}/booking`, { next: { revalidate: 0 } })
  const rawData = await response.json()
  const cleanedData: Event[] = rawData.map((data: EventApiResponse) => {
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end)
    }
  })
  return cleanedData
}

async function CalendarPage() {
  const events = await getEvents()
  return (
    <>
      <h1 className="text-red-500">Smith Cabin</h1>
      <MainCalendar events={events} />
    </>
  )
}

export default CalendarPage
