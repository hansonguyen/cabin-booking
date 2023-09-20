import { z } from 'zod'

export const EventSchema = z
  .object({
    _id: z.string().optional(),
    title: z.string().min(1, { message: 'Title is required.' }),
    userName: z.string().min(1, { message: 'User name is required.' }),
    userId: z.string().min(1, { message: 'User ID is required.' }),
    start: z
      .string()
      .min(1, { message: 'Start date is required.' })
      .transform((value) => {
        // Convert the string to a Date object
        const start = new Date(value)
        start.setUTCHours(start.getTimezoneOffset() / 60, 0, 0, 0)
        return start
      }),
    end: z
      .string()
      .min(1, { message: 'End date is required.' })
      .transform((value) => {
        // Convert the string to a Date object
        const end = new Date(value)
        end.setUTCHours(end.getTimezoneOffset() / 60, 0, 0, 1)
        return end
      }),
    allDay: z.boolean()
  })
  .refine((data) => data.start <= data.end, {
    message: 'End date must be the same as or after the start date.',
    path: ['end']
  })

export type Event = z.infer<typeof EventSchema>

export const CommentSchema = z.object({
  _id: z.string().optional(),
  userName: z.string().min(1, { message: 'User name is required.' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
  bookingId: z.string().min(1, { message: 'Booking ID is required.' }),
  message: z.string().min(1, { message: 'Message is required.' }),
  createdAt: z
    .string()
    .transform((value) => {
      // Convert the string to a Date
      const createdAt = new Date(value)
      return createdAt
    }).optional(),
  updatedAt: z
    .string()
    .transform((value) => {
      // Convert the string to a Date object
      const updatedAt = new Date(value)
      return updatedAt
    }).optional()
})

export type Comment = z.infer<typeof CommentSchema>