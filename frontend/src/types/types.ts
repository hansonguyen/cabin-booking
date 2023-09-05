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
      .pipe(
        z.coerce.date({
          required_error: 'Must input a start date.',
          invalid_type_error: 'Invalid start date.'
        })
      ),
    end: z
      .string()
      .min(1, { message: 'End date is required.' })
      .pipe(
        z.coerce.date({
          required_error: 'Must input an end date.',
          invalid_type_error: 'Invalid end date.'
        })
      ),
    allDay: z.boolean()
  })
  .refine((data) => data.start <= data.end, {
    message: 'End date must be the same as or after the start date.',
    path: ['end']
  })

export type Event = z.infer<typeof EventSchema>
