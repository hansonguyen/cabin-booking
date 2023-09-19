'use server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'

import { Comment, Event, EventSchema } from '../types/types'
import { authOptions } from './auth'

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
    throw new Error('Failed to create event.')
  }
  // Refresh cache
  revalidateTag('events')
}

/**
 * Delete a single event with API
 * @param event
 */
export const handleDelete = async (event: Event) => {
  if (!event) throw new Error('No event selected.')

  const response = await fetch(`${process.env.BASE_URL}/booking/${event._id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error('Failed to delete event.')
  }
  // Refresh cache
  revalidateTag('events')
}

export const updateEvent = async (updatedEvent: Event) => {
  if (!updatedEvent) throw new Error('No event selected.')
  if (!updatedEvent._id) throw new Error('No event ID.')

  const response = await fetch(
    `${process.env.BASE_URL}/booking/${updatedEvent._id}`,
    {
      method: 'PUT',
      body: JSON.stringify(updatedEvent)
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update event.')
  }
  // Refresh cache
  revalidateTag('events')
}

export const validateNewEvent = async (
  formData: FormData,
  id?: string
): Promise<Event | { error: string }> => {
  const session = await getServerSession(authOptions)

  const newEvent = {
    _id: id ? id : undefined,
    title: formData.get('title')?.valueOf(),
    userName: session?.user?.name,
    userId: session?.user?.id,
    start: formData.get('start')?.valueOf(),
    end: formData.get('end')?.valueOf(),
    allDay: true
  }

  const result = EventSchema.safeParse(newEvent)

  if (!result.success) {
    let errorMsg = ''
    result.error.issues.forEach((issue) => {
      errorMsg += issue.message + ' '
    })
    return {
      error: errorMsg
    }
  }

  return result.data
}

/**
 * Get comments for a booking event
 * @param bookingId 
 * @returns 
 */
export const getComments = async (bookingId: string) => {
  const response = await fetch(
    `${process.env.BASE_URL}/comment?bookingId=${bookingId}`
  )
  const rawData = await response.json()

  if (!rawData) {
    return []
  }

  // Reformat data to proper format
  const cleanedData: Comment[] = rawData.map((data: Comment) => {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  })

  return cleanedData
}
