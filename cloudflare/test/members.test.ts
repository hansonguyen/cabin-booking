import assert from 'node:assert/strict'
import test from 'node:test'
import { setup } from './helpers/database.ts'

test('only the configured administrator can assign names; email remains the identity', async () => {
  const { call, env, sql } = setup()
  const profile = { email: ' Relative@Example.com ', displayName: ' Aunt Jane ', version: 0 }
  assert.equal((await call('/members', 'PUT', profile)).status, 403)
  env.ADMIN_EMAIL = 'host@example.com'
  assert.equal((await call('/me')).data.canManageMembers, true)
  assert.equal((await call('/me', 'GET', undefined, 'relative@example.com')).data.canManageMembers, false)
  assert.equal((await call('/members', 'PUT', { ...profile, admin: true }, 'relative@example.com')).status, 403)
  const created = await call('/members', 'PUT', profile)
  assert.deepEqual(created.data, { email: 'relative@example.com', displayName: 'Aunt Jane', version: 1 })
  assert.equal((await call('/members', 'PUT', profile)).status, 409)
  const renamed = await call('/members', 'PUT', { ...profile, displayName: 'Jane Smith', version: 1 })
  assert.equal(renamed.data.version, 2)
  const directory = (await call('/members', 'GET', undefined, 'relative@example.com')).data
  assert.equal(directory.find((p: { email: string }) => p.email === 'relative@example.com').displayName, 'Jane Smith')
  assert.equal((await call('/me', 'GET', undefined, 'relative@example.com')).data.email, 'relative@example.com')
  assert.equal(sql.prepare('SELECT updated_by FROM member_profiles').get()!.updated_by, 'host@example.com')
  sql.close()
})

test('member directory includes unnamed people from existing records without assigning names', async () => {
  const { call, sql, env } = setup({ version: 1, tasks: [{ id: 'one', title: 'Rake leaves', category: 'Chores', notes: '', assignee: 'relative@example.com', status: 'To do', priority: 'Normal' }], articles: [] })
  const directory = (await call('/members')).data
  assert.deepEqual(directory, [
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
