export type Event = {
  _id: string
  userId: string
  title: string
  start: Date
  end: Date
}

export type EventApiResponse = {
  _id: string
  userId: string
  title: string
  start: string
  end: string
}
