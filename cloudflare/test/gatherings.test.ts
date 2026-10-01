import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { setup, seedGathering } from './helpers/database.ts'

const thanksgiving = { title: 'Thanksgiving', start: '2099-11-25', end: '2099-11-29', notes: 'Potluck Thursday.', repeats: true }
const plans = (gatheringId: string, patch = {}) => ({ title: 'Our plans', start: thanksgiving.start, end: thanksgiving.end, guests: 4, names: '', notes: '', open: true, gatheringId, ...patch })

test('saved gatherings retain plans, permissions, and safe removal', async () => {
  const { call, sql } = setup()
  const id = seedGathering(sql, thanksgiving)
  const g = (await call('/gatherings')).data.find((record: { id: string }) => record.id === id)
  assert.equal(g.createdBy, 'host@example.com')
  assert.equal(g.repeats, false)

  const mine = await call('/bookings', 'POST', plans(g.id))
  assert.equal(mine.status, 201)
  assert.equal(mine.data.gatheringId, g.id)
  assert.equal((await call('/bookings', 'POST', plans(g.id))).status, 409)
  const saturday = await call('/bookings', 'POST', plans(g.id, { start: '2099-11-27' }), 'relative@example.com')
  assert.equal(saturday.status, 201)
  assert.equal((await call('/bookings', 'POST', plans(g.id, { start: '2099-12-01', end: '2099-12-03' }), 'aunt@example.com')).status, 400)
  assert.equal((await call('/bookings', 'POST', plans('00000000-0000-0000-0000-000000000000'), 'aunt@example.com')).status, 409)

  assert.equal((await call(`/gatherings/${g.id}`, 'PUT', { ...thanksgiving, start: '2099-11-26', version: 1 }, 'relative@example.com')).status, 410)
  assert.equal((await call('/bookings')).data.find((b: { id: string }) => b.id === mine.data.id).start, thanksgiving.start)

  // Only the creator or administrator removes it; plans remain as ordinary stays.
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 1 }, 'relative@example.com')).status, 403)
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 2 })).status, 409)
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 1 })).status, 204)
  const after = (await call('/bookings')).data
  assert.equal(after.length, 2)
  assert.ok(after.every((b: { gatheringId: string | null }) => b.gatheringId === null))
  sql.close()
})

test('new gatherings are rejected and yearly records never create future events', async () => {
  const { call, sql } = setup()
  assert.equal((await call('/gatherings', 'POST', thanksgiving)).status, 410)
  assert.equal((await call('/gatherings')).data.length, 0)
  const id = seedGathering(sql, { ...thanksgiving, start: '2024-11-27', end: '2024-12-01' })
  const list = (await call('/gatherings')).data
  assert.equal(list.length, 1)
  assert.equal(list[0].id, id)
  assert.equal(list[0].repeats, false)
  assert.equal(list[0].notes, thanksgiving.notes)
  assert.equal((await call('/gatherings')).data.length, 1)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM gatherings').get()!.n, 1)
  sql.close()
})

test('the migration keeps existing stays and lets them overlap', () => {
  const sql = new DatabaseSync(':memory:')
  sql.exec('PRAGMA foreign_keys = ON')
  const run = (file: string) => sql.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'))
  for (const file of ['0001_initial.sql', '0002_care.sql', '0003_list_and_book.sql', '0004_member_names.sql', '0005_item_creators.sql']) run(file)
  sql.prepare(`INSERT INTO bookings (id, owner_email, title, start_date, end_date, guests, guest_names, notes, open_to_company, created_at, updated_at)
    VALUES ('a', 'host@example.com', 'Weekend', '2026-10-01', '2026-10-03', 12, 'Us', 'Note', 1, 'c', 'u')`).run()
  sql.prepare("INSERT INTO booking_nights (night, booking_id) VALUES ('2026-10-01', 'a'), ('2026-10-02', 'a')").run()
  run('0006_gatherings.sql')
  assert.deepEqual({ ...sql.prepare('SELECT * FROM bookings').get() }, {
    id: 'a', owner_email: 'host@example.com', title: 'Weekend', start_date: '2026-10-01', end_date: '2026-10-03', guests: 12,
    guest_names: 'Us', notes: 'Note', open_to_company: 1, gathering_id: null, created_at: 'c', updated_at: 'u'
  })
  sql.prepare(`INSERT INTO bookings (id, owner_email, title, start_date, end_date, guests, created_at, updated_at)
    VALUES ('b', 'other@example.com', 'Same weekend', '2026-10-01', '2026-10-03', 30, 'c', 'u')`).run()
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'booking_nights'").get()!.n, 0)
  sql.close()
})

test('old browser tabs cannot edit or restart retired gathering events', async () => {
  const { call, sql } = setup()
  const id = seedGathering(sql, thanksgiving)
  assert.equal((await call(`/gatherings/${id}`, 'PUT', { ...thanksgiving, version: 1, repeats: true })).status, 410)
  const record = (await call('/gatherings')).data[0]
  assert.equal(record.title, thanksgiving.title)
  assert.equal(record.version, 1)
  assert.equal(record.repeats, false)
  assert.equal((await call('/gatherings')).data.length, 1)
  sql.close()
})
