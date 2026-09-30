export type Member = {
  id: string
  name: string
  initials: string
  color: string
}
export type Booking = {
  updatedAt?: string
  id: string
  userId: string
  title: string
  start: string
  end: string
  guests: number
  names: string
  notes: string
  open: boolean
  /** Set when this stay is someone's plans for a family gathering. */
  gatheringId?: string | null
}
export const MAX_GUESTS = 30
export const members: Member[] = [
  { id: 'lawrence', name: 'Lawrence Smith', initials: 'LS', color: 'green' },
  { id: 'hanson', name: 'Hanson Nguyen', initials: 'HN', color: 'plum' },
  { id: 'emma', name: 'Emma Smith', initials: 'ES', color: 'blue' },
  { id: 'alex', name: 'Alex Smith', initials: 'AS', color: 'gold' }
]
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`)
}
export function addDays(value: string, amount: number): string {
  const d = parseDate(value)
  d.setDate(d.getDate() + amount)
  return dateKey(d)
}
export function nights(start: string, end: string): number {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      86400000
  )
}
export function prettyDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
  return parseDate(value).toLocaleDateString('en-US', options)
}
export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return a.start < b.end && a.end > b.start
}
export function firstName(name: string): string {
  return name.split(' ')[0] || name
}
export function defaultTitle(name: string): string {
  return `${firstName(name)}’s stay`
}
export function validateBooking(
  booking: Booking,
  existing: Booking[],
  today: string,
  allowedMembers: Member[] = members,
  earliestStart = today
): string | null {
  if (!allowedMembers.some((m) => m.id === booking.userId))
    return 'Choose a cabin member.'
  if (!booking.title.trim() || booking.title.length > 80)
    return 'Give your trip a title of 1–80 characters.'
  if (
    ![booking.start, booking.end].every(
      (d) =>
        /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        !Number.isNaN(parseDate(d).getTime()) &&
        dateKey(parseDate(d)) === d
    )
  )
    return 'Choose valid arrival and departure dates.'
  if (booking.start < earliestStart) return 'Arrival must be today or later.'
  if (booking.end <= booking.start) return 'Departure must be after arrival.'
  if (nights(booking.start, booking.end) > 60) return 'A stay cannot exceed 60 nights.'
  if (
    !Number.isInteger(booking.guests) ||
    booking.guests < 1 ||
    booking.guests > MAX_GUESTS
  )
    return `Choose between 1 and ${MAX_GUESTS} people.`
  if (booking.names.length > 300 || booking.notes.length > 2000)
    return 'Please shorten your guest list or notes.'
  // Stays may overlap. Each person shares one set of plans per gathering.
  if (
    booking.gatheringId &&
    existing.some((b) => b.id !== booking.id && b.userId === booking.userId && b.gatheringId === booking.gatheringId)
  )
    return 'You already have plans for this gathering. Edit those instead.'
  return null
}
export function seedBookings(now: Date): Booking[] {
  const base = dateKey(now)
  const stay = (
    id: string,
    userId: string,
    title: string,
    from: number,
    to: number,
    guests: number,
    names: string,
    notes: string,
    open = false
  ): Booking => ({
    id,
    userId,
    title,
    start: addDays(base, from),
    end: addDays(base, to),
    guests,
    names,
    notes,
    open
  })
  return [
    stay('sample-1', 'emma', 'Last swim of the year', 5, 8, 4, 'Ben, Olivia & James', 'Last swim of the year, probably. Dinner on the deck if it’s warm.', true),
    stay('sample-2', 'lawrence', 'Lawrence’s stay', 13, 15, 2, 'Sam', 'Hoping to get a few hikes in. Bringing coffee.'),
    stay('sample-3', 'hanson', 'Hanson’s stay', 27, 29, 6, 'Hanson & friends', 'Board games and a big dinner.', true),
    stay('sample-4', 'alex', 'Alex’s stay', 17, 19, 1, '', 'Working remote, quiet week.'),
    stay('sample-5', 'alex', 'Alex’s stay', -8, -5, 2, 'Alex & Jo', 'Pulled the dock in for the season. Propane ran out Sunday morning — refilled in town, receipt’s on the fridge.'),
    stay('sample-6', 'hanson', 'Hanson’s stay', -22, -19, 6, 'Hanson & friends', 'Big dinner Saturday. Left two unopened bags of coffee in the pantry.'),
    stay('sample-7', 'emma', 'Emma’s stay', -43, -39, 3, 'Ben & Olivia', 'The heron was back on the far rock every morning. Kitchen faucet is dripping again.')
  ]
}
export function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== 'object') return false
  const b = value as Booking
  return (
    ['id', 'userId', 'title', 'start', 'end', 'names', 'notes'].every(
      (k) => typeof b[k as keyof Booking] === 'string'
    ) &&
    typeof b.open === 'boolean' &&
    Number.isInteger(b.guests) &&
    b.guests >= 1 &&
    b.guests <= MAX_GUESTS &&
    (b.gatheringId === undefined || b.gatheringId === null || typeof b.gatheringId === 'string') &&
    members.some((m) => m.id === b.userId) &&
    [b.start, b.end].every(
      (d) =>
        /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        !Number.isNaN(parseDate(d).getTime()) &&
        dateKey(parseDate(d)) === d
    ) &&
    b.start < b.end
  )
}
