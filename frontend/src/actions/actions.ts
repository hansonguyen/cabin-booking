'use server'
// Types
// Other
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'

import { Event } from '../types/types'
import { authOptions } from '../utils/auth'

/**
 * Get list of all events from API
 * @returns Array of events
 */
export const getEvents = async (): Promise<Event[]> => {
  const response = await fetch(`${process.env.BASE_URL}/booking`, {
    next: { revalidate: 0, tags: ['events'] }
  })
  const rawData = await response.json()

  if (!rawData) {
    return []
  }

  // Reformat data to proper format
  const cleanedData: Event[] = rawData.map((data: Event) => {
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
export const createEvent = async (newEvent: Event) => {
  const response = await fetch(`${process.env.BASE_URL}/booking`, {
    method: 'POST',
    body: JSON.stringify(newEvent)
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

export const validateNewEvent = async (formData: FormData): Promise<Event> => {
  const session = await getServerSession(authOptions)

  const title = formData.get('title')?.valueOf()
  if (typeof title !== 'string' || title.length === 0)
    throw new Error('Invalid title.')

  const userName = session?.user?.name
  if (typeof userName !== 'string' || userName.length === 0)
    throw new Error('Invalid user name.')

  const userId = session?.user?.id
  if (typeof userId !== 'string' || userId.length === 0)
    throw new Error('Invalid user ID.')

  const startStr = formData.get('start')?.valueOf()
  if (typeof startStr !== 'string' || startStr.length === 0)
    throw new Error('Invalid start date.')
  const start = new Date(startStr)

  const endStr = formData.get('end')?.valueOf()
  if (typeof endStr !== 'string' || endStr.length === 0)
    throw new Error('Invalid end date.')
  const end = new Date(endStr)

  const newEvent: Event = {
    title: title,
    userName: userName,
    userId: userId,
    start: start,
    end: end,
    allDay: true
  }

  return newEvent
}

export const findUser = () => {

}