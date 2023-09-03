export type Event = {
  _id?: string
  userId: string
  title: string
  start: Date | string
  end: Date | string
  allDay: boolean
}
