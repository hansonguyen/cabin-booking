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
