import { Event } from '../types/types'

export const isEvent = (event: any): event is Event => {
  return (
    (event as Event).title !== undefined &&
    (event as Event).start !== undefined &&
    (event as Event).end !== undefined &&
    (event as Event).allDay !== undefined
  )
}
