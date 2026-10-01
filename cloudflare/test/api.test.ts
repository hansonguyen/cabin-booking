import assert from 'node:assert/strict'
import test from 'node:test'
import { setup } from './helpers/database.ts'

const task = { id: 'coffee', title: 'Coffee beans', category: 'Running low', notes: '', assignee: '', status: 'To do', priority: 'High' }
const article = { id: 'wifi', title: 'Wi-Fi & TV', topic: 'Arrival & departure', problem: '', solution: 'Check the router.', tags: 'internet', author: 'Original author', updatedAt: '2026-09-01T12:00:00.000Z', verified: false }

test('migration preserves legacy items and leaves an immutable snapshot', async () => {
  const legacy = { version: 1, tasks: [{ ...task, status: 'Done' }], articles: [article] }
  const { sql, call } = setup(legacy)
  const tasks = (await call('/tasks')).data
  assert.equal(tasks[0].title, task.title)
  assert.equal(tasks[0].status, 'Done')
  assert.equal(tasks[0].completedAt, null)
  assert.equal(tasks[0].version, 1)
  const pages = (await call('/pages')).data
  assert.equal(pages[0].author, article.author)
  assert.equal(pages[0].updatedAt, article.updatedAt)
  assert.equal(pages[0].topic, article.topic)
  assert.deepEqual(JSON.parse(sql.prepare('SELECT data FROM cabin_care').get()!.data as string), legacy)
  assert.throws(() => sql.prepare('UPDATE cabin_care SET data = ?').run('{}'), /migrated/)
  assert.equal((await call('/care', 'PUT', legacy)).status, 409)
  assert.equal((await call('/care')).data.data.articles.length, 1)
  sql.close()
})

test('tasks support quick add, claim, completion, reopen, and versioned deletion', async () => {
  const { call, sql } = setup()
  let result = await call('/tasks', 'POST', task)
  assert.equal(result.status, 201)
  assert.equal(result.data.version, 1)
  assert.equal((await call('/tasks', 'POST', task)).status, 409)
  result = await call('/tasks/coffee', 'PATCH', { version: 1, assignee: 'relative@example.com' }, 'relative@example.com')
  assert.equal(result.data.assignee, 'relative@example.com')
  result = await call('/tasks/coffee', 'PATCH', { version: 2, status: 'Done', completedBy: 'forged' })
  assert.equal(result.data.completedBy, 'host@example.com')
  assert.ok(result.data.completedAt)
  const completedAt = result.data.completedAt
  result = await call('/tasks/coffee', 'PATCH', { version: 3, notes: 'Two bags' })
  assert.equal(result.data.completedAt, completedAt)
  assert.equal((await call('/tasks/coffee', 'DELETE', { version: 1 })).status, 409)
  result = await call('/tasks/coffee', 'PATCH', { version: 4, status: 'To do' })
  assert.equal(result.data.completedAt, null)
  assert.equal(result.data.completedBy, null)
  assert.equal((await call('/tasks/coffee', 'DELETE', { version: 5 })).status, 204)
  assert.equal((await call('/tasks/coffee')).status, 404)
  sql.close()
})

test('unrelated edits coexist and a stale edit to the same item is rejected', async () => {
  const { call, sql } = setup({ version: 1, tasks: [task, { ...task, id: 'leaves', title: 'Rake leaves' }], articles: [article] })
  assert.equal((await call('/tasks/coffee', 'PATCH', { version: 1, status: 'Done' })).status, 200)
  assert.equal((await call('/tasks/leaves', 'PATCH', { version: 1, assignee: 'relative@example.com' })).status, 200)
  assert.equal((await call('/tasks/coffee', 'PATCH', { version: 1, title: 'Stale title' })).status, 409)
  assert.equal((await call('/pages/wifi', 'PUT', { ...article, version: 1, author: 'forged', solution: 'Restart router.' }, 'relative@example.com')).data.author, 'relative@example.com')
  assert.equal((await call('/pages/wifi', 'DELETE', { version: 1 })).status, 409)
  assert.equal((await call('/tasks/coffee')).data.status, 'Done')
  assert.equal((await call('/pages/wifi')).data.solution, 'Restart router.')
  sql.close()
})

test('invalid task/page data and unversioned writes are rejected without changes', async () => {
  const { call, sql } = setup({ version: 1, tasks: [task], articles: [] })
  assert.equal((await call('/tasks/coffee', 'PATCH', { status: 'Done' })).status, 400)
  assert.equal((await call('/tasks/coffee', 'PATCH', { version: 1, category: 'unknown' })).status, 400)
  assert.equal((await call('/tasks', 'POST', { ...task, id: 'other', title: ' ' })).status, 400)
  assert.equal((await call('/pages', 'POST', { ...article, solution: '' })).status, 400)
  assert.equal((await call('/tasks/coffee')).data.version, 1)
  assert.equal((await call('/pages', 'POST', article)).status, 201)
  assert.equal((await call('/pages/wifi', 'DELETE', { version: 1 })).status, 204)
  sql.close()
})

test('open stays may overlap; notes are host-only and do not change dates', async () => {
  const { call, sql } = setup()
  const input = { title: 'Family visit', start: '2099-10-01', end: '2099-10-03', guests: 2, names: 'Family', notes: 'Bring coffee', open: true }
  const created = await call('/bookings', 'POST', input)
  assert.equal(created.status, 201)
  const booking = created.data
  assert.equal(booking.gatheringId, null)
  const overlapping = await call('/bookings', 'POST', { ...input, guests: 15 }, 'relative@example.com')
  assert.equal(overlapping.status, 201)
  assert.equal((await call('/bookings', 'POST', { ...input, guests: 31 })).status, 400)
  assert.equal((await call('/bookings')).data.length, 2)
  const note = { notes: 'Firewood is low.', updatedAt: booking.updatedAt }
  assert.equal((await call(`/bookings/${booking.id}/note`, 'PATCH', note, 'relative@example.com')).status, 403)
  assert.equal((await call(`/bookings/${booking.id}`, 'DELETE', undefined, 'relative@example.com')).status, 403)
  const changed = await call(`/bookings/${booking.id}/note`, 'PATCH', { ...note, start: '2099-12-01' })
  assert.equal(changed.status, 200)
  assert.equal(changed.data.start, input.start)
  assert.equal(changed.data.names, input.names)
  assert.equal(changed.data.notes, note.notes)
  assert.equal((await call(`/bookings/${booking.id}/note`, 'PATCH', note)).status, 409)
  assert.equal((await call(`/bookings/${booking.id}`, 'DELETE')).status, 204)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM bookings').get()!.n, 1)
  sql.close()
})

test('reserved stays reject overlaps and crossing ranges, allowing adjacent checkout dates', async () => {
  const { call, sql } = setup()
  const input = { title: 'Reserved visit', start: '2099-10-02', end: '2099-10-05', guests: 2, names: '', notes: '', open: false }
  const closed = await call('/bookings', 'POST', input)
  assert.equal(closed.status, 201)
  for (const range of [input, { start: '2099-10-01', end: '2099-10-06' }, { start: '2099-10-04', end: '2099-10-06' }]) {
    const rejected = await call('/bookings', 'POST', { ...input, ...range, open: true }, 'relative@example.com')
    assert.equal(rejected.status, 409)
    assert.match(rejected.data.error, /without room for more/)
  }
  assert.equal((await call('/bookings', 'POST', { ...input, start: '2099-10-01', end: input.start })).status, 201)
  assert.equal((await call('/bookings', 'POST', { ...input, start: input.end, end: '2099-10-06' })).status, 201)
  assert.equal((await call(`/bookings/${closed.data.id}`, 'PUT', { ...input, notes: 'Same reserved dates' })).status, 200)
  assert.equal((await call('/bookings')).data.length, 3)
  sql.close()
})

test('edits cannot move into reserved nights; saved overlaps survive closing and shrinking stays', async () => {
  const { call, sql } = setup()
  const input = { title: 'Host visit', start: '2099-10-02', end: '2099-10-05', guests: 2, names: '', notes: '', open: true }
  const host = (await call('/bookings', 'POST', input)).data
  const relativeInput = { ...input, start: '2099-10-03', end: '2099-10-04' }
  const relative = (await call('/bookings', 'POST', relativeInput, 'relative@example.com')).data
  const other = (await call('/bookings', 'POST', { ...input, start: '2099-10-06', end: '2099-10-08' }, 'other@example.com')).data
  assert.equal((await call(`/bookings/${host.id}`, 'PUT', { ...input, open: false })).status, 200)
  assert.equal((await call(`/bookings/${relative.id}`, 'PUT', { ...relativeInput, notes: 'Already booked' }, 'relative@example.com')).status, 200)
  assert.equal((await call(`/bookings/${relative.id}`, 'PUT', { ...relativeInput, start: input.start }, 'relative@example.com')).status, 409)
  assert.equal((await call(`/bookings/${other.id}`, 'PUT', input, 'other@example.com')).status, 409)
  assert.equal((await call(`/bookings/${host.id}`, 'PUT', { ...input, open: false, end: '2099-10-04' })).status, 200)
  assert.equal((await call('/bookings', 'POST', relativeInput, 'new@example.com')).status, 409)
  assert.equal((await call(`/bookings/${host.id}`, 'PUT', input)).status, 200)
  assert.equal((await call('/bookings', 'POST', relativeInput, 'new@example.com')).status, 201)
  sql.close()
})

test('simultaneous closed bookings cannot both reserve the same nights', async () => {
  const { call, sql } = setup()
  const input = { title: 'Private visit', start: '2099-11-01', end: '2099-11-04', guests: 2, names: '', notes: '', open: false }
  const results = await Promise.all([
    call('/bookings', 'POST', input, 'first@example.com'),
    call('/bookings', 'POST', input, 'second@example.com')
  ])
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409])
  assert.equal((await call('/bookings')).data.length, 1)
  sql.close()
})

test('only immutable creators or the configured administrator can delete tasks and pages', async () => {
  const { call, sql, env } = setup({ version: 1, tasks: [task], articles: [article] })
  env.ADMIN_EMAIL = ' ADMIN@example.com '
  for (const [route, record, table] of [['tasks', task, 'tasks'], ['pages', article, 'book_pages']] as const) {
    const path = `/${route}/owned`
    const created = await call(`/${route}`, 'POST', { ...record, id: 'owned', createdBy: 'intruder@example.com', created_by: 'intruder@example.com' })
    assert.equal(created.status, 201)
    assert.equal(created.data.createdBy, 'host@example.com')
    const changed = await call(path, 'PATCH', { version: 1, title: 'Edited by someone else', createdBy: 'relative@example.com', created_by: 'relative@example.com' }, 'relative@example.com')
    assert.equal(changed.status, 200)
    assert.equal(changed.data.createdBy, 'host@example.com')
    assert.equal((await call(path, 'DELETE', { version: 2 }, 'relative@example.com')).status, 403)
    assert.equal((await call(path)).status, 200)
    assert.throws(() => sql.prepare(`UPDATE ${table} SET created_by = ? WHERE id = ?`).run('relative@example.com', 'owned'), /creator cannot be changed/)
    assert.equal((await call(path, 'DELETE', { version: 1 })).status, 409)
    assert.equal((await call(path, 'DELETE', { version: 2 })).status, 204)
    await call(`/${route}`, 'POST', { ...record, id: 'owned' })
    assert.equal((await call(path, 'DELETE', { version: 1 }, 'admin@example.com')).status, 204)
    const legacyPath = `/${route}/${record.id}`
    assert.equal((await call(legacyPath)).data.createdBy, null)
    assert.equal((await call(legacyPath, 'DELETE', { version: 1 })).status, 403)
    assert.equal((await call(legacyPath, 'DELETE', { version: 1 }, 'admin@example.com')).status, 204)
  }
  env.ADMIN_EMAIL = undefined
  await call('/tasks', 'POST', task)
  assert.equal((await call('/tasks/coffee', 'DELETE', { version: 1 }, 'admin@example.com')).status, 403)
  assert.equal((await call('/tasks/coffee', 'DELETE', { version: 1 })).status, 204)
  sql.close()
})

test('administrator can delete another host stay but cannot edit it', async () => {
  const { call, sql, env } = setup()
  env.ADMIN_EMAIL = 'admin@example.com'
  const input = { title: 'Family visit', start: '2099-10-01', end: '2099-10-03', guests: 2, names: '', notes: '', open: false }
  const { data: booking } = await call('/bookings', 'POST', input)
  const path = `/bookings/${booking.id}`
  assert.equal((await call(path, 'DELETE', undefined, 'relative@example.com')).status, 403)
  assert.equal((await call(path, 'PUT', input, 'admin@example.com')).status, 403)
  assert.equal((await call(`${path}/note`, 'PATCH', { notes: 'Admin note', updatedAt: booking.updatedAt }, 'admin@example.com')).status, 403)
  assert.equal((await call(path, 'DELETE', undefined, 'admin@example.com')).status, 204)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM bookings').get()!.n, 0)
  sql.close()
})
