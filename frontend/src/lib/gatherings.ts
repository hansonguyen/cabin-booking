import { type Booking, addDays, dateKey, nights, parseDate } from './bookings.ts'
import { nextYear } from './yearly.ts'

/** A time the whole family goes up. Everyone is assumed to be coming; plans are optional. */
export type Gathering = {
  id: string
  seriesId: string
  year: number
  title: string
  start: string
  end: string
  notes: string
  repeats: boolean
  createdBy: string | null
  version?: number
  updatedAt?: string
}

const validDay = (d: unknown) =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && dateKey(parseDate(d)) === d

export function validateGathering(g: Gathering, today: string, earliestStart = today): string | null {
  if (!g.title.trim() || g.title.trim().length > 80) return 'Give the gathering a name of 1–80 characters.'
  if (!validDay(g.start) || !validDay(g.end)) return 'Pick the first and last day.'
  if (g.start < earliestStart) return 'A gathering must start today or later.'
  if (g.end <= g.start) return 'The last day must be after the first.'
  if (nights(g.start, g.end) > 21) return 'A gathering cannot exceed 21 nights.'
  if (g.notes.length > 2000) return 'Please shorten the notes.'
  return null
}

export function isGathering(value: unknown): value is Gathering {
  if (!value || typeof value !== 'object') return false
  const g = value as Gathering
  return (
    ['id', 'seriesId', 'title', 'notes'].every((k) => typeof g[k as keyof Gathering] === 'string') &&
    Number.isInteger(g.year) &&
    typeof g.repeats === 'boolean' &&
    validDay(g.start) &&
    validDay(g.end) &&
    g.start < g.end
  )
}

/** The plans people have shared for a gathering, earliest arrival first. */
export function plansFor(gathering: Gathering, bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.gatheringId === gathering.id).sort((a, b) => a.start.localeCompare(b.start))
}

/** Mirrors the Worker: once a yearly gathering ends, add next year's. */
export function withNextYears(gatherings: Gathering[], today: string, makeId: () => string): Gathering[] {
  const added: Gathering[] = []
  const series = new Map<string, Gathering>()
  for (const g of gatherings) {
    const latest = series.get(g.seriesId)
    if (!latest || g.year > latest.year) series.set(g.seriesId, g)
  }
  for (let g of series.values()) {
    for (let i = 0; i < 5 && g.repeats && g.end <= today; i++) {
      const { start, end } = nextYear(g.start, g.end)
      g = { ...g, start, end, id: makeId(), year: g.year + 1, version: 1 }
      added.push(g)
    }
  }
  return added.length ? [...gatherings, ...added] : gatherings
}

function thanksgivingFrom(now: Date): string {
  for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
    const first = new Date(year, 10, 1)
    const day = new Date(year, 10, 1 + ((4 - first.getDay() + 7) % 7) + 21)
    if (dateKey(day) > dateKey(now)) return dateKey(day)
  }
  return dateKey(now)
}

/** Preview sample: the next Thanksgiving, Wednesday through Sunday. */
export function seedGatherings(now: Date): Gathering[] {
  const day = parseDate(thanksgivingFrom(now))
  const start = new Date(day)
  start.setDate(day.getDate() - 1)
  const end = new Date(day)
  end.setDate(day.getDate() + 3)
  return [
    {
      id: 'sample-thanksgiving',
      seriesId: 'sample-thanksgiving',
      year: start.getFullYear(),
      title: 'Thanksgiving',
      start: dateKey(start),
      end: dateKey(end),
      notes: 'Dinner Thursday at 4. Everyone brings a dish.',
      repeats: true,
      createdBy: 'lawrence',
      version: 1
    }
  ]
}

/** Preview sample: two families have shared plans; everyone else is simply expected. */
export function seedPlans(g: Gathering): Booking[] {
  const base = { names: '', open: true, gatheringId: g.id }
  return [
    { ...base, id: 'sample-plans-emma', userId: 'emma', title: 'Emma’s stay', start: g.start, end: g.end, guests: 4, names: 'Ben, Olivia & James', notes: 'Bringing the turkey.' },
    { ...base, id: 'sample-plans-hanson', userId: 'hanson', title: 'Hanson’s stay', start: addDays(g.start, 2), end: g.end, guests: 3, notes: 'Driving up Friday after work.' }
  ]
}
