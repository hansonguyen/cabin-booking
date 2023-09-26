'use client'
import '@/src/styles/globals.css'

import { useSession } from 'next-auth/react'

import { Event } from '@/src/types/types'

import EventSettings from './EventSettings'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
<<<<<<< Updated upstream
  const { data: session } = useSession()

=======
  let backgroundColor = '#b28dd7'
  let borderColor = '#b28dd7' 
>>>>>>> Stashed changes
  return (
    <div className="relative" style={{ backgroundColor, borderColor }}>
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userName}`}
        {session?.user?.id === event.userId && <EventSettings event={event} />}
      </span>
    </div>
  )
}

export default EventComponent
