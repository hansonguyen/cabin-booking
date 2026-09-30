import assert from 'node:assert/strict'
import test from 'node:test'
import { setup } from './helpers/database.ts'
import { memberPalette } from '../../frontend/src/lib/member-colors.ts'
import { readFileSync } from 'node:fs'

test('only the configured administrator can assign names; email remains the identity', async () => {
  const { call, env, sql } = setup()
  const profile = { email: ' Relative@Example.com ', displayName: ' Aunt Jane ', version: 0 }
  assert.equal((await call('/members', 'PUT', profile)).status, 403)
  env.ADMIN_EMAIL = 'host@example.com'
  assert.equal((await call('/me')).data.canManageMembers, true)
  assert.equal((await call('/me', 'GET', undefined, 'relative@example.com')).data.canManageMembers, false)
  assert.equal((await call('/members', 'PUT', { ...profile, admin: true }, 'relative@example.com')).status, 403)
  const created = await call('/members', 'PUT', profile)
  assert.deepEqual(created.data, { email: 'relative@example.com', displayName: 'Aunt Jane', version: 1, color: created.data.color })
  assert.ok(memberPalette.includes(created.data.color))
  assert.equal((await call('/members', 'PUT', profile)).status, 409)
  const renamed = await call('/members', 'PUT', { ...profile, displayName: 'Jane Smith', version: 1 })
  assert.equal(renamed.data.version, 2)
  assert.equal(renamed.data.color, created.data.color)
  const directory = (await call('/members', 'GET', undefined, 'relative@example.com')).data
  assert.equal(directory.find((p: { email: string }) => p.email === 'relative@example.com').displayName, 'Jane Smith')
  assert.equal((await call('/me', 'GET', undefined, 'relative@example.com')).data.email, 'relative@example.com')
  assert.equal(sql.prepare('SELECT updated_by FROM member_profiles').get()!.updated_by, 'host@example.com')
  sql.close()
})

test('member directory includes unnamed people from existing records without assigning names', async () => {
  const { call, sql, env } = setup({ version: 1, tasks: [{ id: 'one', title: 'Rake leaves', category: 'Chores', notes: '', assignee: 'relative@example.com', status: 'To do', priority: 'Normal' }], articles: [] })
  const directory = (await call('/members')).data
  assert.deepEqual(directory.map(({ color, ...profile }: { color: string }) => profile), [
    { email: 'host@example.com', displayName: '', version: 0 },
    { email: 'relative@example.com', displayName: '', version: 0 }
  ])
  env.ADMIN_EMAIL = 'host@example.com'
  for (const profile of [
    { email: 'not-an-email', displayName: 'Jane', version: 0 },
    { email: 'relative@example.com', displayName: ' ', version: 0 },
    { email: 'relative@example.com', displayName: 'x'.repeat(81), version: 0 },
    { email: 'relative@example.com', displayName: 'Jane\nSmith', version: 0 },
    { email: 'relative@example.com', displayName: 'Jane', version: -1 }
  ]) assert.equal((await call('/members', 'PUT', profile)).status, 400)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM member_profiles').get()!.n, 0)
  sql.close()
})

test('member colors stay fixed across viewers, name edits, and new members; unused colors come first', async () => {
  const { call, sql, env } = setup()
  const colors = new Map<string, string>()
  for (let i = 0; i < memberPalette.length; i++) {
    const email = `person${i}@example.com`
    const directory = (await call('/members', 'GET', undefined, email)).data
    const color = directory.find((p: { email: string }) => p.email === email).color
    assert.ok(memberPalette.includes(color))
    colors.set(email, color)
  }
  assert.equal(new Set(colors.values()).size, memberPalette.length)
  await call('/members', 'GET', undefined, 'new-person@example.com')
  env.ADMIN_EMAIL = 'person0@example.com'
  const renamed = await call('/members', 'PUT', {
    email: 'person0@example.com', displayName: 'A new name', version: 0, color: 'clay'
  }, 'person0@example.com')
  assert.equal(renamed.data.color, colors.get('person0@example.com'))
  const directory = (await call('/members', 'GET', undefined, 'person9@example.com')).data
  for (const [email, color] of colors) assert.equal(directory.find((p: { email: string }) => p.email === email).color, color)
  const counts = sql.prepare('SELECT COUNT(*) AS n FROM member_colors GROUP BY color').all().map((r) => Number(r.n))
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1)
  const concurrent = await Promise.all([
    call('/members', 'GET', undefined, 'same-person@example.com'),
    call('/members', 'GET', undefined, 'same-person@example.com')
  ])
  assert.equal(concurrent[0].data.find((p: { email: string }) => p.email === 'same-person@example.com').color,
    concurrent[1].data.find((p: { email: string }) => p.email === 'same-person@example.com').color)
  sql.close()
})

test('color migration gives existing people distinct colors while preserving their records', async () => {
  const { call, sql, env } = setup({ version: 1, tasks: [
    { id: 'one', title: 'Rake leaves', category: 'Chores', notes: '', assignee: 'relative@example.com', status: 'To do', priority: 'Normal' }
  ], articles: [] })
  env.ADMIN_EMAIL = 'host@example.com'
  await call('/members', 'PUT', { email: 'named@example.com', displayName: 'Aunt Jane', version: 0 })
  await call('/bookings', 'POST', { title: 'Weekend', start: '2099-01-01', end: '2099-01-03', guests: 2, names: '', notes: '', open: false })
  const tables = ['member_profiles', 'bookings', 'tasks', 'book_pages', 'gatherings']
  const before = tables.map((table) => sql.prepare(`SELECT * FROM ${table}`).all())
  sql.exec('DROP TABLE member_colors')
  sql.exec(readFileSync(new URL('../migrations/0007_member_colors.sql', import.meta.url), 'utf8'))
  assert.deepEqual(tables.map((table) => sql.prepare(`SELECT * FROM ${table}`).all()), before)
  const colors = sql.prepare('SELECT color FROM member_colors').all()
  assert.equal(colors.length, 3)
  assert.equal(new Set(colors.map((r) => r.color)).size, 3)
  sql.close()
})
