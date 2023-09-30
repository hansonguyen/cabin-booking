import '@/src/styles/globals.css'

import { Event } from '@/src/types/types'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {

  let backgroundColor = event.everyone ? '#880808' : '#5F8575'
  let displayName = event.everyone ? 'Everyone!' : event.userName;

  return (
    <div className="relative" style={{ backgroundColor}}>
      <span className="flex justify-between h-6">
        {` ${event.title} - ${displayName}`}
      </span>
    </div>
  )
}

export default EventComponent
