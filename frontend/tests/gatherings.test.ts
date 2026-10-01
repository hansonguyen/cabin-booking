import test from 'node:test'
import assert from 'node:assert/strict'
import type { Booking } from '../src/lib/bookings.ts'
import { monthWeeks, upcoming } from '../src/lib/calendar.ts'
import { type Gathering, isGathering, seedGatherings, validateGathering } from '../src/lib/gatherings.ts'
import { cabinStatus } from '../src/lib/greeting.ts'
import { nextYear } from '../src/lib/yearly.ts'

const stay = (id: string, userId: string, start: string, end: string, gatheringId: string | null = null): Booking => ({
  id, userId, title: '', start, end, guests: 2, names: '', notes: '', open: false, gatheringId
})
const thanksgiving: Gathering = {
  id: 'tg', seriesId: 'tg', year: 2026, title: 'Thanksgiving', start: '2026-11-25', end: '2026-11-29',
  notes: '', repeats: true, createdBy: 'lawrence'
}

test('yearly gatherings keep their place around a holiday, or their weekday of the month', () => {
  assert.deepEqual(nextYear('2026-11-25', '2026-11-29'), { start: '2027-11-24', end: '2027-11-28', basis: 'around Thanksgiving' })
  assert.equal(nextYear('2026-12-30', '2027-01-02').start, '2027-12-30')
  assert.equal(nextYear('2026-05-22', '2026-05-25').start, '2027-05-28')
  assert.deepEqual(nextYear('2026-08-14', '2026-08-16'), { start: '2027-08-13', end: '2027-08-15', basis: 'the second Friday of August' })
  assert.equal(nextYear('2026-08-29', '2026-08-31').basis, 'the last Saturday of August')
})

test('gathering validation and stored-data checks', () => {
  assert.equal(validateGathering(thanksgiving, '2026-09-28'), null)
  assert.ok(validateGathering({ ...thanksgiving, title: ' ' }, '2026-09-28'))
  assert.ok(validateGathering({ ...thanksgiving, end: '2026-12-20' }, '2026-09-28'))
  assert.ok(validateGathering(thanksgiving, '2026-11-26'))
  assert.equal(validateGathering(thanksgiving, '2026-11-26', thanksgiving.start), null)
  assert.ok(isGathering(thanksgiving))
  assert.equal(isGathering({ ...thanksgiving, repeats: 'yes' }), false)
  const [sample] = seedGatherings(new Date(2026, 8, 28))
  assert.deepEqual([sample.start, sample.end], ['2026-11-25', '2026-11-29'])
})

test('overlapping stays stack in separate lanes; gatherings take the top lane', () => {
  const weeks = monthWeeks(2026, 10, [stay('a', 'emma', '2026-11-24', '2026-11-27'), stay('b', 'alex', '2026-11-26', '2026-11-28'), stay('c', 'hanson', '2026-11-27', '2026-11-29')], [thanksgiving])
  const week = weeks.find((w) => w.days.includes('2026-11-26'))!
  assert.deepEqual(week.gatherings.map((s) => s.lane), [0])
  assert.deepEqual(Object.fromEntries(week.stays.map((s) => [s.item.id, s.lane])), { a: 1, b: 2, c: 1 })
  assert.equal(week.lanes, 3)
})

test('upcoming lists plans inside their gathering, and the status names everyone there', () => {
  const plans = stay('p', 'emma', '2026-11-25', '2026-11-29', 'tg')
  const items = upcoming([plans, stay('s', 'alex', '2026-10-01', '2026-10-03')], [thanksgiving], '2026-09-28')
  assert.deepEqual(items.map((i) => i.kind), ['stay', 'gathering'])
  assert.deepEqual(items[1].kind === 'gathering' && items[1].plans.map((b) => b.id), ['p'])
  const name = (id: string) => id[0].toUpperCase() + id.slice(1)
  assert.equal(
    cabinStatus([stay('a', 'emma', '2026-10-01', '2026-10-03'), stay('b', 'alex', '2026-10-01', '2026-10-04')], '2026-10-01', 'me', name, [thanksgiving]),
    'Emma and Alex are at the cabin. Thanksgiving at the cabin starts on Nov 25.'
  )
  assert.match(cabinStatus([plans], '2026-11-26', 'me', name, [thanksgiving]), /^Thanksgiving at the cabin runs until Sunday\. Emma and one other are at the cabin until Sunday\.$/)
})
