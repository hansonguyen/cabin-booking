'use client'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-datepicker/dist/react-datepicker.css'

// import 'react-big-calendar/lib/sass/styles'
import format from 'date-fns/format'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import React from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'

import { Event } from '@/src/types/types'

import EventComponent from './event/EventComponent'
import { useRouter } from 'next/navigation'

const locales = {
  'en-US': enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

type MainCalendarProps = {
  events: Event[]
}

const MainCalendar = ({ events }: MainCalendarProps) => {
  const router = useRouter()

  return (
    <div>
      <Calendar
        className="my-calendar"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 1000, margin: '6rem 8rem', paddingBottom: '2rem'}}
        components={{
          event: EventComponent
        }}
        views={['month']}
        onSelectEvent={(event) => router.push(`calendar/${event._id}`)}
      />
    </div>
  )
}


export default MainCalendar
