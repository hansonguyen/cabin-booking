'use client'
import React from 'react'
// Components
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
// Types
import { Event } from '../types/types'
// Date Related
import format from 'date-fns/format'
import getDay from 'date-fns/getDay'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
// Styles
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-datepicker/dist/react-datepicker.css'
import EventComponent from './EventComponent'

const locales = {
  'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

interface MainCalendarProps {
  events: Event[]
}

const MainCalendar = ({ events }: MainCalendarProps) => {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500, margin: '130px' }}
      components={{
        event: EventComponent
      }}
    />
  )
}

export default MainCalendar
