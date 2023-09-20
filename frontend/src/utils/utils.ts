import { Comment, Event } from '../types/types'

/**
 * Type guard to check if object is event
 * @param event 
 * @returns 
 */
export const isEvent = (event: any): event is Event => {
  return (
    (event as Event).title !== undefined &&
    (event as Event).start !== undefined &&
    (event as Event).end !== undefined &&
    (event as Event).allDay !== undefined
  )
}

/**
 * Type guard to check if object is comment
 * @param comment 
 * @returns 
 */
export const isComment = (comment: any): comment is Comment => {
  return (
    (comment as Comment).bookingId !== undefined &&
    (comment as Comment).message !== undefined
  )
}
