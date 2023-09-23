'use server'
import { getServerSession } from 'next-auth'
import { revalidateTag } from 'next/cache'

import { Comment, CommentSchema, Event, EventSchema } from '../types/types'
import { authOptions } from './auth'
import { redis } from './redis'

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
export const deleteEvent = async (event: Event) => {
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

/**
 * Update a single event
 * @param updatedEvent
 */
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

/**
 * Validate event, returns event object or error
 * @param formData
 * @param id
 * @returns
 */
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
  // Check cache for comments first
  const cachedComments = await redis.get(bookingId)

  if (cachedComments) {
    const rawData = JSON.parse(cachedComments)
    const cleanedData: Comment[] = rawData.map((data: Comment) => {
      if (data.createdAt && data.updatedAt)
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }
    })
    return cleanedData
  }

  const response = await fetch(
    `${process.env.BASE_URL}/comment?bookingId=${bookingId}`,
    {
      next: { revalidate: 0, tags: ['comments'] }
    }
  )
  const rawData = await response.json()

  if (!rawData) {
    // Set cache
    await redis.set(bookingId, JSON.stringify([]))
    return []
  }

  // Reformat data to proper format
  const cleanedData: Comment[] = rawData.map((data: Comment) => {
    if (data.createdAt && data.updatedAt)
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      }
  })

  // Set cache
  await redis.set(bookingId, JSON.stringify(cleanedData))
  revalidateTag('comments')

  return cleanedData
}

/**
 * Post new comment to DB
 * @param comment
 */
export const createComment = async (comment: Comment) => {
  const response = await fetch(`${process.env.BASE_URL}/comment`, {
    method: 'POST',
    body: JSON.stringify(comment)
  })

  if (!response.ok) {
    throw new Error('Failed to create comment.')
  }
  // Revalidate cache
  await redis.del(comment.bookingId)
  revalidateTag('comments')
}

/**
 * Delete a comment from DB
 * @param comment
 */
export const deleteComment = async (comment: Comment) => {
  if (!comment) throw new Error('No comment selected.')

  const response = await fetch(
    `${process.env.BASE_URL}/comment/${comment._id}`,
    {
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete comment.')
  }
  // Revalidate cache
  await redis.del(comment.bookingId)
  revalidateTag('comments')
}

/**
 * Update a single comment
 * @param updatedComment
 */
export const updateComment = async (updatedComment: Comment) => {
  if (!updatedComment) throw new Error('No comment selected.')
  if (!updatedComment._id) throw new Error('No comment ID.')

  const response = await fetch(
    `${process.env.BASE_URL}/comment/${updatedComment._id}`,
    {
      method: 'PUT',
      body: JSON.stringify(updatedComment)
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update comment.')
  }
  // Revalidate cache
  await redis.del(updatedComment.bookingId)
  revalidateTag('comments')
}

/**
 * Valiate comment body, returns new comment object or error
 * @param formData
 * @param bookingId
 * @param id
 * @returns
 */
export const validateNewComment = async (
  formData: FormData,
  bookingId: string,
  id?: string,
  createdAt?: Date
): Promise<Comment | { error: string }> => {
  const session = await getServerSession(authOptions)

  const newComment = {
    _id: id ? id : undefined,
    userName: session?.user?.name,
    userId: session?.user?.id,
    bookingId: bookingId,
    message: formData.get('message')?.valueOf(),
    createdAt: createdAt ? createdAt.toUTCString() : undefined
  }

  const result = CommentSchema.safeParse(newComment)

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
