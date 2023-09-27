import '@/src/styles/globals.css'

import { Event } from '@/src/types/types'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  const { data: session } = useSession()

  let backgroundColor = '#b28dd7'
  return (
    <div className="relative" style={{ backgroundColor}}>
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userName}`}
      </span>
    </div>
  )
}

export default EventComponent
