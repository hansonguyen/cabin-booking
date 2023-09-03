export type Event = {
  _id: string
  userId: string
  title: string
  start: Date
  end: Date
  allDay: boolean
}

export type EventApiResponse = {
  _id?: string
  userId: string
  title: string
  start: string
  end: string
  allDay: boolean
}
