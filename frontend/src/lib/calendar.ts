import { type Booking, addDays, dateKey, nights, parseDate, prettyDate } from './bookings.ts'
import { type Gathering, plansFor } from './gatherings.ts'

export type Span = { start: string; end: string }
export type Segment<T extends Span = Booking> = {
  item: T
  /** Position in day columns (0–7). Stays begin and end at the middle of a day. */
  from: number
  to: number
  clippedStart: boolean
  clippedEnd: boolean
  /** Row within the week, so overlapping stays sit one above the other. */
  lane: number
}
export type Week = { days: string[]; gatherings: Segment<Gathering>[]; stays: Segment[]; lanes: number }

function segments<T extends Span>(days: string[], items: T[]): Omit<Segment<T>, 'lane'>[] {
  return items
    .map((item) => {
      const clippedStart = item.start < days[0]
      const clippedEnd = item.end > days[6]
      const from = clippedStart ? 0 : days.indexOf(item.start) + 0.5
      const to = clippedEnd ? 7 : days.indexOf(item.end) + 0.5
      return { item, from, to, clippedStart, clippedEnd }
    })
    .filter((s) => s.item.end >= days[0] && s.item.start <= days[6] && s.to > s.from)
}

/**
 * Monday-first weeks covering a month. Gatherings take the top lanes; stays fill the first
 * free lane below, so stays that overlap stack instead of hiding each other.
 */
export function monthWeeks(year: number, month: number, bookings: Booking[], gatheringList: Gathering[] = []): Week[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const last = dateKey(new Date(year, month + 1, 0))
  const weeks: Week[] = []
  for (let cursor = dateKey(new Date(year, month, 1 - offset)); cursor <= last; cursor = addDays(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(cursor, i))
    const taken: [number, number][][] = []
    const place = <T extends Span>(s: Omit<Segment<T>, 'lane'>): Segment<T> => {
      let lane = taken.findIndex((spans) => spans.every(([from, to]) => s.to <= from || s.from >= to))
      if (lane < 0) lane = taken.push([]) - 1
      taken[lane].push([s.from, s.to])
      return { ...s, lane }
    }
    const byStart = <T extends Span>(a: Omit<Segment<T>, 'lane'>, b: Omit<Segment<T>, 'lane'>) =>
      a.item.start.localeCompare(b.item.start) || b.item.end.localeCompare(a.item.end)
    const gatherings = segments(days, gatheringList).sort(byStart).map(place)
    const stays = segments(days, bookings).sort(byStart).map(place)
    weeks.push({ days, gatherings, stays, lanes: taken.length })
  }
  return weeks
}

export type Upcoming = { kind: 'gathering'; gathering: Gathering; plans: Booking[] } | { kind: 'stay'; booking: Booking }

/** Gatherings and stays not yet over, soonest first. Plans appear inside their gathering. */
export function upcoming(bookings: Booking[], gatheringList: Gathering[], today: string): Upcoming[] {
  const items: Upcoming[] = [
    ...gatheringList
      .filter((g) => g.end > today)
      .map((gathering) => ({ kind: 'gathering' as const, gathering, plans: plansFor(gathering, bookings) })),
    ...bookings
      .filter((b) => b.end > today && !gatheringList.some((g) => g.id === b.gatheringId))
      .map((booking) => ({ kind: 'stay' as const, booking }))
  ]
  const start = (u: Upcoming) => (u.kind === 'stay' ? u.booking.start : u.gathering.start)
  return items.sort((a, b) => start(a).localeCompare(start(b)))
}

/** "today", "tomorrow", "Thursday", or "on Oct 23". */
export function relativeDay(today: string, day: string, preposition = 'on'): string {
  const gap = nights(today, day)
  if (gap === 0) return 'today'
  if (gap === 1) return 'tomorrow'
  if (gap > 1 && gap < 7) return parseDate(day).toLocaleDateString('en-US', { weekday: 'long' })
  return `${preposition} ${prettyDate(day)}`
}

/** "Oct 9 – 11" or "Sep 28 – Oct 2". */
export function dateRange(start: string, end: string): string {
  const a = parseDate(start)
  const b = parseDate(end)
  return a.getMonth() === b.getMonth()
    ? `${prettyDate(start)} – ${b.getDate()}`
    : `${prettyDate(start)} – ${prettyDate(end)}`
}

/** "Fri Oct 9 – Sun Oct 11". */
export function longDateRange(start: string, end: string): string {
  const f = (d: string) => prettyDate(d, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${f(start)} – ${f(end)}`
}

/** Nights a stay occupies: arrival day through the night before departure. */
export function stayNights(start: string, end: string): string[] {
  const out: string[] = []
  for (let d = start; d < end; d = addDays(d, 1)) out.push(d)
  return out
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}
