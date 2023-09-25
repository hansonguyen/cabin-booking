import '@/src/styles/globals.css'

import { Event } from '@/src/types/types'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  return (
    <div className="relative">
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userName}`}
      </span>
    </div>
  )
}

export default EventComponent
