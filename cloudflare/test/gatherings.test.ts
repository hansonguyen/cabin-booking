import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { setup } from './helpers/database.ts'

const thanksgiving = { title: 'Thanksgiving', start: '2099-11-25', end: '2099-11-29', notes: 'Potluck Thursday.', repeats: true }
const plans = (gatheringId: string, patch = {}) => ({ title: 'Our plans', start: thanksgiving.start, end: thanksgiving.end, guests: 4, names: '', notes: '', open: true, gatheringId, ...patch })

test('families add plans to a gathering once, within its dates', async () => {
  const { call, sql } = setup()
  const created = await call('/gatherings', 'POST', { ...thanksgiving, createdBy: 'intruder@example.com' })
  assert.equal(created.status, 201)
  const g = created.data
  assert.equal(g.createdBy, 'host@example.com')
  assert.equal(g.seriesId, g.id)
  assert.equal(g.year, 2099)
  assert.equal((await call('/gatherings', 'POST', { ...thanksgiving, end: thanksgiving.start })).status, 400)
  assert.equal((await call('/gatherings', 'POST', { ...thanksgiving, start: '2000-11-25' })).status, 400)

  const mine = await call('/bookings', 'POST', plans(g.id))
  assert.equal(mine.status, 201)
  assert.equal(mine.data.gatheringId, g.id)
  assert.equal((await call('/bookings', 'POST', plans(g.id))).status, 409)
  const saturday = await call('/bookings', 'POST', plans(g.id, { start: '2099-11-27' }), 'relative@example.com')
  assert.equal(saturday.status, 201)
  assert.equal((await call('/bookings', 'POST', plans(g.id, { start: '2099-12-01', end: '2099-12-03' }), 'aunt@example.com')).status, 400)
  assert.equal((await call('/bookings', 'POST', plans('00000000-0000-0000-0000-000000000000'), 'aunt@example.com')).status, 409)

  // Anyone may move the gathering; plans that matched its dates follow, custom ones stay.
  const moved = await call(`/gatherings/${g.id}`, 'PUT', { ...thanksgiving, start: '2099-11-26', version: 1 }, 'relative@example.com')
  assert.equal(moved.status, 200)
  assert.equal(moved.data.version, 2)
  const stays = (await call('/bookings')).data
  assert.equal(stays.find((b: { id: string }) => b.id === mine.data.id).start, '2099-11-26')
  assert.equal(stays.find((b: { id: string }) => b.id === saturday.data.id).start, '2099-11-27')
  assert.equal((await call(`/gatherings/${g.id}`, 'PUT', { ...thanksgiving, title: 'Stale', version: 1 })).status, 409)
  assert.equal(sql.prepare('SELECT title FROM gatherings').get()!.title, 'Thanksgiving')

  // Only the creator or administrator removes it; plans remain as ordinary stays.
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 2 }, 'relative@example.com')).status, 403)
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 1 })).status, 409)
  assert.equal((await call(`/gatherings/${g.id}`, 'DELETE', { version: 2 })).status, 204)
  const after = (await call('/bookings')).data
  assert.equal(after.length, 2)
  assert.ok(after.every((b: { gatheringId: string | null }) => b.gatheringId === null))
  sql.close()
})

test('a yearly gathering adds next year once it ends, and removing it ends the tradition', async () => {
  const { call, sql, env } = setup()
  env.ADMIN_EMAIL = 'admin@example.com'
  sql.prepare(`INSERT INTO gatherings (id, series_id, year, title, start_date, end_date, notes, repeats, created_by, updated_by, updated_at)
    VALUES (?, ?, 2024, 'Thanksgiving', '2024-11-27', '2024-12-01', 'Bring pie.', 1, 'host@example.com', 'host@example.com', '2024-01-01T00:00:00.000Z')`)
    .run('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
  const list = (await call('/gatherings')).data
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(list.filter((g: { end: string }) => g.end > today).length, 1)
  assert.ok(list.every((g: { seriesId: string }) => g.seriesId === '11111111-1111-1111-1111-111111111111'))
  const upcoming = list.at(-1)
  assert.equal(upcoming.notes, 'Bring pie.')
  assert.equal(upcoming.createdBy, 'host@example.com')
  // Still Wednesday before Thanksgiving through Sunday.
  assert.equal(new Date(`${upcoming.start}T00:00:00Z`).getUTCDay(), 3)
  assert.equal((await call('/gatherings')).data.length, list.length)

  assert.equal((await call(`/gatherings/${upcoming.id}`, 'DELETE', { version: 1 }, 'admin@example.com')).status, 204)
  assert.equal((await call('/gatherings')).data.length, list.length - 1)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM gatherings WHERE repeats = 1').get()!.n, 0)
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

test('stopping a yearly series invalidates other years so stale tabs cannot restart it', async () => {
  const { call, sql } = setup()
  const { data: first } = await call('/gatherings', 'POST', thanksgiving)
  const secondId = '22222222-2222-2222-2222-222222222222'
  sql.prepare(`INSERT INTO gatherings (id, series_id, year, title, start_date, end_date, notes, repeats, created_by, updated_by, updated_at)
    VALUES (?, ?, 2100, 'Thanksgiving', '2100-11-24', '2100-11-28', '', 1, 'host@example.com', 'host@example.com', '2026-01-01T00:00:00Z')`)
    .run(secondId, first.seriesId)
  assert.equal((await call(`/gatherings/${first.id}`, 'PUT', { ...thanksgiving, version: 1, repeats: false })).status, 200)
  let second = (await call('/gatherings')).data.find((g: { id: string }) => g.id === secondId)
  assert.equal(second.repeats, false)
  assert.equal(second.version, 2)
  assert.equal((await call(`/gatherings/${secondId}`, 'PUT', { ...second, repeats: true, version: 1 })).status, 409)
  assert.equal((await call(`/gatherings/${secondId}`, 'PUT', { ...second, repeats: true })).status, 200)
  const refreshedFirst = (await call('/gatherings')).data.find((g: { id: string }) => g.id === first.id)
  assert.equal(refreshedFirst.version, 3)
  assert.equal((await call(`/gatherings/${first.id}`, 'DELETE', { version: 3 })).status, 204)
  second = (await call('/gatherings')).data.find((g: { id: string }) => g.id === secondId)
  assert.equal(second.version, 4)
  assert.equal(second.repeats, false)
  assert.equal((await call(`/gatherings/${secondId}`, 'PUT', { ...second, repeats: true, version: 3 })).status, 409)
  sql.close()
})

test('an in-flight yearly rollover cannot recreate a deleted gathering', async () => {
  const { call, sql, env } = setup()
  const id = '11111111-1111-1111-1111-111111111111'
  sql.prepare(`INSERT INTO gatherings (id, series_id, year, title, start_date, end_date, notes, repeats, created_by, updated_by, updated_at)
    VALUES (?, ?, 2024, 'Thanksgiving', '2024-11-27', '2024-12-01', '', 1, 'host@example.com', 'host@example.com', '2024-01-01T00:00:00Z')`).run(id, id)
  const batch = env.DB.batch.bind(env.DB)
  env.DB.batch = (async (statements: D1PreparedStatement[]) => {
    sql.prepare('DELETE FROM gatherings WHERE id = ?').run(id)
    return batch(statements)
  }) as typeof env.DB.batch
  assert.deepEqual((await call('/gatherings')).data, [])
  sql.close()
})
