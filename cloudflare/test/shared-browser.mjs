import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium, expect } from '../../frontend/node_modules/@playwright/test/index.mjs'
import { setup } from './helpers/database.ts'
import { api } from '../src/api.ts'

// Isolated browser integration: production static build + real API SQL + in-memory DB.
// Only this test supplies an identity directly; the deployed Worker always verifies Access.
const { sql, env, call } = setup()
const email = 'family@example.com'
let signedInEmail = email
env.ADMIN_EMAIL = email
const pastId = '00000000-0000-0000-0000-000000000001'
sql.prepare('INSERT INTO bookings (id, owner_email, title, start_date, end_date, guests, guest_names, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  .run(pastId, email, 'Last visit', '2025-01-01', '2025-01-03', 2, 'Family', '', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(10000)
  page.setDefaultNavigationTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://cabin.test/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname === '/cdn-cgi/access/logout') {
      return route.fulfill({ contentType: 'text/html', body: '<h1>Signed out</h1>' })
    }
    if (url.pathname.startsWith('/api/')) {
      const result = await api(new Request(url, { method: request.method(), body: request.postData() ?? undefined }), env, signedInEmail)
      return route.fulfill({ status: result.status, headers: Object.fromEntries(result.headers), body: await result.text() })
    }
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    const types = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2', jpg: 'image/jpeg' }
    try {
      return route.fulfill({ body: await readFile(new URL(`../../frontend/out/${file}`, import.meta.url)), contentType: types[file.split('.').pop()] ?? 'application/octet-stream' })
    } catch { return route.fulfill({ status: 404 }) }
  })
  await page.goto('https://cabin.test/#list')
  const signOut = page.getByRole('link', { name: 'Sign out', exact: true })
  await expect(signOut).toBeVisible()
  await expect(signOut).toHaveAttribute('href', '/cdn-cgi/access/logout')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(signOut).toBeInViewport()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}px`)
    const brand = await page.locator('.brand').boundingBox()
    const actions = await page.locator('.header-actions').boundingBox()
    assert.ok(brand.height < 44 && brand.x + brand.width <= actions.x, `Header fits at ${width}px: ${JSON.stringify({ brand, actions })}`)
  }
  await page.screenshot({ path: '/private/tmp/cabin-sign-out-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/private/tmp/cabin-sign-out-mobile.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Family names', exact: true }).click()
  await page.getByRole('button', { name: `Edit name for ${email}` }).click()
  await page.getByLabel('Display name', { exact: true }).fill('Lawrence Smith')
  await page.getByRole('button', { name: 'Save name', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Saved Lawrence Smith')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/private/tmp/cabin-family-names-mobile.png' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto('https://cabin.test/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lawrence.')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('https://cabin.test/#list')
  console.log('Checking the shared list…')
  await page.getByLabel('Add to Running low').fill('Coffee beans')
  await page.getByLabel('Add to Running low').press('Enter')
  const group = page.getByRole('region', { name: 'Running low' })
  await expect(group.getByText('Coffee beans', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'I’ll do it: Coffee beans' }).click()
  await expect(group.getByText('You’re on it')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Done: Coffee beans' }).click()
  await expect(group.getByText('Coffee beans', { exact: true })).not.toBeVisible()
  await page.reload()
  await page.getByText(/1 done/).click()
  await page.getByRole('checkbox', { name: 'Not done: Coffee beans' }).click()
  await expect(group.getByText('Coffee beans', { exact: true })).toBeVisible()
  assert.equal((await call('/tasks')).data[0].assignee, email)

  await page.goto('https://cabin.test/#book')
  console.log('Checking the shared cabin book…')
  await page.getByRole('button', { name: 'Write a page' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Getting in')
  await page.getByLabel('The page').fill('Ask the family before arriving.')
  await page.getByRole('button', { name: 'Save page' }).click()
  await expect(page.getByRole('heading', { name: 'Getting in', level: 2 })).toBeVisible()
  assert.equal((await call('/pages')).data[0].author, email)
  await page.reload()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('The page').fill('Call before arriving.')
  await page.getByRole('button', { name: 'Save page' }).click()
  await expect(page.getByText('Call before arriving.', { exact: true })).toBeVisible()
  assert.equal((await call('/pages')).data[0].version, 2)

  await page.goto('https://cabin.test/#calendar')
  console.log('Checking the shared guestbook…')
  const guestbook = page.getByRole('region', { name: 'Guestbook' })
  await guestbook.getByRole('listitem').first().getByRole('button').click()
  await page.getByRole('button', { name: 'Leave a guestbook note' }).click()
  await page.getByLabel('Your note').fill('The firewood is low.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('dialog')).toContainText('The firewood is low.')
  await page.getByRole('button', { name: 'Edit guestbook note' }).click()
  await page.getByLabel('Your note').fill('Firewood restocked.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('dialog')).toContainText('Firewood restocked.')
  await page.reload()
  await expect(guestbook).toContainText('Firewood restocked.')
  const saved = (await call('/bookings')).data[0]
  assert.equal(saved.start, '2025-01-01')
  assert.equal(saved.end, '2025-01-03')
  signedInEmail = 'relative@example.com'
  await page.reload()
  await expect(page.getByRole('button', { name: 'Family names', exact: true })).toHaveCount(0)
  await expect(guestbook).toContainText('Lawrence Smith')
  console.log('Checking creator-only deletion and admin controls…')
  await guestbook.getByRole('listitem').first().getByRole('button').click()
  await expect(page.getByRole('button', { name: 'Remove stay', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto('https://cabin.test/#list')
  await page.getByRole('button', { name: /^Coffee beans/ }).click()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0)
  await page.getByLabel('Details', { exact: true }).fill('Edited by a relative')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: /^Coffee beans/ }).click()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByLabel('Add to Chores').fill('My own chore')
  await page.getByLabel('Add to Chores').press('Enter')
  await page.getByRole('button', { name: 'My own chore', exact: true }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, delete it', exact: true }).click()
  await expect(page.getByText('My own chore', { exact: true })).toHaveCount(0)
  await page.goto('https://cabin.test/#book')
  await expect(page.getByRole('button', { name: /Wi-Fi & TV/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete page', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Write a page' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Relative page')
  await page.getByLabel('The page').fill('Created by a relative')
  await page.getByRole('button', { name: 'Save page' }).click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete page', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  const relativeBooking = await call('/bookings', 'POST', { title: 'Relative stay', start: '2099-01-01', end: '2099-01-03', guests: 2, names: '', notes: 'Relative stay note', open: false }, signedInEmail)
  sql.prepare('UPDATE bookings SET start_date = ?, end_date = ? WHERE id = ?').run('2025-02-01', '2025-02-03', relativeBooking.data.id)
  signedInEmail = email
  await page.reload()
  await expect(page.getByRole('button', { name: 'Family names', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Relative page/ }).first().click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Delete page', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, delete page', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Relative page' })).toHaveCount(0)
  await page.goto('https://cabin.test/#calendar')
  await guestbook.getByRole('listitem').filter({ hasText: 'Relative stay' }).getByRole('button').click()
  await expect(page.getByRole('button', { name: 'Leave a guestbook note' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Remove stay', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, remove it', exact: true }).click()
  await expect(guestbook.getByText('Relative stay')).toHaveCount(0)
  console.log('Checking gatherings…')
  const day = offset => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
  const reunion = await call('/gatherings', 'POST', { title: 'Reunion', start: day(10), end: day(13), notes: 'Potluck.', repeats: false }, email)
  assert.equal(reunion.status, 201)
  signedInEmail = 'relative@example.com'
  await page.reload()
  const comingUp = page.getByRole('region', { name: 'Coming up' })
  const dialog = page.getByRole('dialog')
  await comingUp.getByRole('button').filter({ hasText: 'Reunion' }).click()
  await expect(dialog.getByRole('button', { name: 'Remove gathering' })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Add your plans' }).click()
  await dialog.getByRole('button', { name: 'Save plans' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(comingUp.getByRole('button').filter({ hasText: 'Reunion' })).toContainText('You added plans')
  const plans = (await call('/bookings')).data.find(b => b.gatheringId === reunion.data.id)
  assert.equal(plans.userId, 'relative@example.com')
  await comingUp.getByRole('button').filter({ hasText: 'Reunion' }).click()
  await dialog.getByRole('button', { name: 'Edit gathering' }).click()
  await page.getByLabel('Name').fill('Family reunion')
  await dialog.getByRole('button', { name: 'Save gathering' }).click()
  await expect(comingUp.getByRole('button').filter({ hasText: 'Family reunion' })).toBeVisible()
  assert.equal((await call('/gatherings')).data.find(g => g.id === reunion.data.id).title, 'Family reunion')
  signedInEmail = email
  await page.reload()
  await comingUp.getByRole('button').filter({ hasText: 'Family reunion' }).click()
  await dialog.getByRole('button', { name: 'Remove gathering' }).click()
  await dialog.getByRole('button', { name: 'Yes, remove it' }).click()
  await expect(comingUp.getByRole('button').filter({ hasText: 'Family reunion' })).toHaveCount(0)
  await expect(comingUp).toContainText('Relative')
  assert.equal((await call('/bookings')).data.find(b => b.id === plans.id).gatheringId, null)
  console.log('Checking distinct, persistent calendar colors…')
  const nextMonth = new Date()
  nextMonth.setDate(1)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const monthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
  const hosts = [
    [email, 'Lawrence Smith'], ['alex@example.com', 'Alex Smith'],
    ['emma@example.com', 'Emma Smith'], ['hanson@example.com', 'Hanson Nguyen']
  ]
  for (const [address, name] of hosts) {
    if (address !== email) assert.equal((await call('/members', 'PUT', { email: address, displayName: name, version: 0 }, email)).status, 200)
    assert.equal((await call('/bookings', 'POST', {
      title: `${name}’s stay`, start: `${monthKey}-08`, end: `${monthKey}-12`, guests: 2, names: '', notes: '', open: false
    }, address)).status, 201)
  }
  assert.equal((await call('/gatherings', 'POST', {
    title: 'Family weekend', start: `${monthKey}-09`, end: `${monthKey}-13`, notes: '', repeats: false
  }, email)).status, 201)
  signedInEmail = email
  await page.goto('https://cabin.test/#calendar')
  await page.reload()
  await page.getByRole('button', { name: 'Next month', exact: true }).click()
  const readColors = async () => {
    const colors = []
    for (const [, name] of hosts) {
      const bar = page.locator('.stay-bar').and(page.getByRole('button', { name: `${name},`, exact: false })).first()
      await expect(bar).toBeVisible()
      await expect(page.getByRole('list', { name: 'Calendar colors' })).toContainText(name)
      colors.push(await bar.evaluate((el) => getComputedStyle(el).backgroundColor))
    }
    return colors
  }
  const calendarColors = await readColors()
  assert.equal(new Set(calendarColors).size, hosts.length)
  await expect(page.getByRole('list', { name: 'Calendar colors' })).toContainText('Family gatherings')
  await page.screenshot({ path: '/private/tmp/cabin-calendar-colors-desktop.png' })
  signedInEmail = 'emma@example.com'
  await page.reload()
  await page.getByRole('button', { name: 'Next month', exact: true }).click()
  assert.deepEqual(await readColors(), calendarColors)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/private/tmp/cabin-calendar-colors-mobile.png', fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await signOut.click()
  await page.waitForURL('https://cabin.test/cdn-cgi/access/logout')
  await expect(page.getByRole('heading', { name: 'Signed out' })).toBeVisible()
  assert.deepEqual(errors, [])
  console.log('Shared browser integration passed: add/claim/complete/reopen, page create/edit, guestbook edits twice and reload persistence, gathering plans, edits, and removal.')
} finally {
  await browser.close()
  sql.close()
}
