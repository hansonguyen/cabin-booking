import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { emailFromToken } from '../src/auth.ts'
import { parseBookingInput, parseGatheringInput } from '../src/bookings.ts'
import { validCare } from '../src/care.ts'

test('booking inputs reject invalid dates, past dates, and oversized stays', () => {
  const good = { title: 'Weekend', start: '2026-10-01', end: '2026-10-03', guests: 2, names: 'A', notes: '', open: false }
  assert.equal(typeof parseBookingInput(good, '2026-09-24'), 'object')
  assert.equal(typeof parseBookingInput({ ...good, start: '2026-02-30' }, '2026-01-01'), 'string')
  assert.equal(typeof parseBookingInput({ ...good, start: '2026-09-01' }, '2026-09-24'), 'string')
  assert.equal(typeof parseBookingInput({ ...good, end: good.start }, '2026-09-24'), 'string')
  assert.equal(typeof parseBookingInput({ ...good, end: '2027-01-01' }, '2026-09-24'), 'string')
  assert.equal(typeof parseBookingInput({ ...good, guests: 30 }, '2026-09-24'), 'object')
  assert.equal(typeof parseBookingInput({ ...good, guests: 31 }, '2026-09-24'), 'string')
  assert.equal(typeof parseBookingInput({ ...good, gatheringId: 'not-an-id' }, '2026-09-24'), 'string')
  const gathering = { title: ' Thanksgiving ', start: '2026-11-25', end: '2026-11-29', notes: '', repeats: true }
  assert.deepEqual(parseGatheringInput(gathering, '2026-09-24'), { ...gathering, title: 'Thanksgiving' })
  assert.equal(typeof parseGatheringInput({ ...gathering, end: '2026-12-20' }, '2026-09-24'), 'string')
  assert.equal(typeof parseGatheringInput({ ...gathering, repeats: 'yes' }, '2026-09-24'), 'string')
})

test('care data validates categories, unique IDs, and a fix before saving', () => {
  const task = { id: 'one', title: 'Bring coffee', category: 'Bring up', notes: '', assignee: '', status: 'To do', priority: 'Normal' }
  const article = { id: 'two', title: 'Door', topic: 'Maintenance', problem: '', solution: 'Lift gently.', tags: '', author: '', updatedAt: new Date().toISOString(), verified: false }
  const data = { version: 1, tasks: [task], articles: [article] }
  assert.equal(validCare(data), true)
  assert.equal(validCare({ ...data, tasks: [task, task] }), false)
  assert.equal(validCare({ ...data, articles: [{ ...article, solution: '' }] }), false)
})

test('only an app token for the exact Access audience and issuer supplies identity', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] })
  const sign = (claims: Record<string, unknown>, audience = 'cabin-app', issuer = 'https://family.cloudflareaccess.com') =>
    new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(issuer).setAudience(audience).setExpirationTime('1h').sign(privateKey)
  assert.equal(await emailFromToken(await sign({ type: 'app', email: ' Family@Example.com ' }), 'cabin-app', 'family.cloudflareaccess.com', keys), 'family@example.com')
  assert.equal(await emailFromToken(await sign({ type: 'app', email: 'family@example.com' }, 'other-app'), 'cabin-app', 'family.cloudflareaccess.com', keys), null)
  assert.equal(await emailFromToken(await sign({ type: 'app', email: 'family@example.com' }, 'cabin-app', 'https://other.cloudflareaccess.com'), 'cabin-app', 'family.cloudflareaccess.com', keys), null)
  assert.equal(await emailFromToken(await sign({ type: 'org', email: 'family@example.com' }), 'cabin-app', 'family.cloudflareaccess.com', keys), null)
})
