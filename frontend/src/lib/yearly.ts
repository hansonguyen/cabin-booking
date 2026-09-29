// Shared by the Worker (cloudflare/src/routes/gatherings.ts) so both sides agree on
// next year's dates. Keep this file free of imports and browser APIs.

const DAY = 86_400_000
const toTime = (key: string) => Date.parse(`${key}T00:00:00Z`)
const toKey = (time: number) => new Date(time).toISOString().slice(0, 10)
const utc = (year: number, month: number, day: number) => Date.UTC(year, month, day)

/** The nth (1-based) weekday of a month; n = -1 means the last one. */
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  if (n < 0) {
    const last = utc(year, month + 1, 0)
    return last - ((new Date(last).getUTCDay() - weekday + 7) % 7) * DAY
  }
  const first = utc(year, month, 1)
  return first + (((weekday - new Date(first).getUTCDay() + 7) % 7) + (n - 1) * 7) * DAY
}

function easter(year: number): number {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((8 * b + 13) / 25)) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  return utc(year, month, ((h + l - 7 * m + 114) % 31) + 1)
}

/** Holidays families plan cabin weekends around, in calendar order. */
const holidays: { name: string; on: (year: number) => number }[] = [
  { name: 'New Year’s Day', on: (y) => utc(y, 0, 1) },
  { name: 'Martin Luther King Jr. Day', on: (y) => nthWeekday(y, 0, 1, 3) },
  { name: 'Presidents’ Day', on: (y) => nthWeekday(y, 1, 1, 3) },
  { name: 'Easter', on: easter },
  { name: 'Memorial Day', on: (y) => nthWeekday(y, 4, 1, -1) },
  { name: 'the Fourth of July', on: (y) => utc(y, 6, 4) },
  { name: 'Labor Day', on: (y) => nthWeekday(y, 8, 1, 1) },
  { name: 'Thanksgiving', on: (y) => nthWeekday(y, 10, 4, 4) },
  { name: 'Christmas', on: (y) => utc(y, 11, 25) }
]

const ordinals = ['first', 'second', 'third', 'fourth']
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Next year's dates for a yearly gathering. A gathering that spans a holiday keeps the same
 * position around it (Wednesday before Thanksgiving through Sunday). Otherwise it keeps the
 * same weekday of the month (the second Friday of August). Length is always preserved.
 */
export function nextYear(start: string, end: string): { start: string; end: string; basis: string } {
  const from = toTime(start)
  const length = toTime(end) - from
  const year = new Date(from).getUTCFullYear()
  // A New Year's gathering starts in one year and spans the next year's holiday.
  for (const y of [year, year + 1]) {
    for (const holiday of holidays) {
      const day = holiday.on(y)
      if (day >= from && day <= toTime(end)) {
        const moved = holiday.on(y + 1) + (from - day)
        return { start: toKey(moved), end: toKey(moved + length), basis: `around ${holiday.name}` }
      }
    }
  }
  const date = new Date(from)
  const n = Math.ceil(date.getUTCDate() / 7)
  const moved = nthWeekday(year + 1, date.getUTCMonth(), date.getUTCDay(), n > 4 ? -1 : n)
  const which = n > 4 ? 'last' : ordinals[n - 1]
  return {
    start: toKey(moved),
    end: toKey(moved + length),
    basis: `the ${which} ${weekdays[date.getUTCDay()]} of ${months[date.getUTCMonth()]}`
  }
}
