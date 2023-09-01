'use server'
// Types
import { EventApiResponse, Event } from '../types/types'
// Other
import { revalidateTag } from 'next/cache'

/**
 * Get list of all events from API
 * @returns Array of events
 */
export const getEvents = async (): Promise<Event[]> => {
  const response = await fetch(`${process.env.BASE_URL}/booking`, {
    next: { revalidate: 0, tags: ['events'] }
  })
  const rawData = await response.json()
  
  // Reformat data to proper format
  const cleanedData: Event[] = rawData.map((data: EventApiResponse) => {
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end)
    }
  })

  return cleanedData
}

/**
 * Creates new event and posts to database through API
 * @param formData
 */
export const handleSubmit = async (formData: FormData) => {
  // Validate entries
  const title = formData.get('title')?.valueOf()
  if (typeof title !== 'string' || title.length === 0)
    throw new Error('Invalid title')

  const userId = formData.get('userId')?.valueOf()
  if (typeof userId !== 'string' || userId.length === 0)
    throw new Error('Invalid User Id')

  const start = formData.get('start')?.valueOf()
  if (typeof start !== 'string' || start.length === 0)
    throw new Error('Invalid Start Date')

  const end = formData.get('end')?.valueOf()
  if (typeof end !== 'string' || end.length === 0)
    throw new Error('Invalid End Date')

  const event: EventApiResponse = {
    title: title,
    userId: userId,
    start: start,
    end: end,
    allDay: true
  }

  const response = await fetch(`${process.env.BASE_URL}/booking`, {
    method: 'POST',
    body: JSON.stringify(event)
  })

  if (!response.ok) {
    throw new Error('Failed to create event')
  }
  // Refresh cache
  revalidateTag('events')
}

/**
 * Delete a single event with API
 * @param event 
 */
export const handleDelete = async (event: Event) => {
  if (!event) throw new Error('No event selected')

  const response = await fetch(`${process.env.BASE_URL}/booking/${event._id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error('Failed to delete event')
  }
  // Refresh cache
  revalidateTag('events')
}
