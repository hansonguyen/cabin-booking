'use client'
import '@/src/styles/globals.css'

import { useSession } from 'next-auth/react'

import { Event } from '@/src/types/types'

import EventSettings from './EventSettings'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  const { data: session } = useSession()

  return (
    <div className="relative">
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userName}`}
        {session?.user?.id === event.userId && <EventSettings event={event} />}
      </span>
    </div>
  )
}

export default EventComponent
