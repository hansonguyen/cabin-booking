import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  isBooking,
  nights,
  overlaps,
  seedBookings,
  validateBooking
} from '../src/lib/bookings.ts'
const booking = seedBookings(new Date(2026, 8, 5))[0]
test('stays may overlap; each person shares one set of plans per gathering', () => {
  assert.equal(
    overlaps(booking, { ...booking, start: booking.end, end: addDays(booking.end, 2) }),
    false
  )
  const overlapping = { ...booking, id: 'new', userId: 'alex', start: addDays(booking.start, 1) }
  assert.ok(overlaps(booking, overlapping))
  assert.equal(validateBooking(overlapping, [booking], '2026-09-05'), null)
  const plans = { ...booking, gatheringId: 'thanksgiving' }
  assert.equal(validateBooking(plans, [booking], '2026-09-05'), null)
  assert.match(validateBooking({ ...plans, id: 'again' }, [plans], '2026-09-05')!, /already have plans/)
  assert.equal(validateBooking({ ...plans, id: 'other', userId: 'alex' }, [plans], '2026-09-05'), null)
  assert.equal(validateBooking({ ...booking, guests: 30 }, [], '2026-09-05'), null)
})
test('validates date ranges, real dates, members and guest counts', () => {
  for (const patch of [
    { end: booking.start },
    { start: '2026-02-30' },
    { start: '2026-01-01' },
    { guests: 0 },
    { guests: 1.5 },
    { guests: 31 },
    { userId: 'outsider' },
    { title: '  ' }
  ])
    assert.ok(validateBooking({ ...booking, ...patch }, [], '2026-09-05'))
})
test('date math survives month boundaries and daylight saving', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(nights('2026-03-07', '2026-03-09'), 2)
  assert.equal(nights('2026-10-31', '2026-11-02'), 2)
})
test('stored data validation rejects corrupt or unknown records', () => {
  assert.ok(isBooking(booking))
  for (const bad of [
    null,
    {},
    { ...booking, userId: 'unknown' },
    { ...booking, start: '2026-02-30' },
    { ...booking, guests: '2' },
    { ...booking, end: booking.start }
  ])
    assert.equal(isBooking(bad), false)
})
