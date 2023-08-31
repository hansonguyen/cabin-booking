import { Event } from "../types/types"

interface EventComponentProps {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  return (
    <>
      <span>{`${event.title} -${event.userId}`}</span>
    </>
  )
}

export default EventComponent