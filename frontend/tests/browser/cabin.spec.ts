import { test, expect, type Page } from '@playwright/test'
import { dateKey, addDays, prettyDate } from '../../src/lib/bookings'
import { seedGatherings } from '../../src/lib/gatherings'

const dayLabel = (key: string) => prettyDate(key, { weekday: 'long', month: 'long', day: 'numeric' })

async function pickDay(page: Page, key: string) {
  const dialog = page.getByRole('dialog')
  // Picker days may add ", Thanksgiving" or ", someone there" after the date.
  const day = dialog.getByRole('button', { name: new RegExp(`^${dayLabel(key)}(,|$)`) })
  for (let i = 0; i < 3 && !(await day.isVisible()); i++)
    await dialog.getByRole('button', { name: 'Next month' }).click()
  await day.click()
}

test('guestbook shows everyone’s past stays and hosts can add a note or remove their own', async ({ page }) => {
  const today = dateKey(new Date())
  const base = { userId: 'lawrence', guests: 2, names: '', notes: '', open: false }
  await page.addInitScript((bookings) => {
    if (!localStorage.getItem('lake-mary-bookings-v1')) {
      localStorage.setItem('lake-mary-bookings-v1', JSON.stringify(bookings))
    }
  }, [
    { ...base, id: 'old', title: 'Last winter', start: addDays(today, -60), end: addDays(today, -58), notes: 'Snowed in.' },
    { ...base, id: 'recent', title: 'Just back', start: addDays(today, -2), end: today },
    { ...base, id: 'other', userId: 'emma', title: 'Another host', start: addDays(today, -10), end: addDays(today, -8), notes: 'Faucet drips.' },
    { ...base, id: 'future', title: 'Next getaway', start: addDays(today, 5), end: addDays(today, 7) }
  ])
  await page.goto('/#calendar')
  const guestbook = page.getByRole('region', { name: 'Guestbook' })
  await expect(guestbook.getByRole('listitem')).toHaveCount(3)
  await expect(guestbook.getByRole('listitem').first()).toContainText('You haven’t left a note')
  await expect(guestbook.getByRole('listitem').nth(1)).toContainText('Faucet drips.')
  await expect(guestbook.getByRole('listitem').nth(2)).toContainText('Snowed in.')

  await guestbook.getByRole('listitem').first().getByRole('button').click()
  await page.getByRole('button', { name: 'Leave a guestbook note' }).click()
  await page.getByLabel('Your note').fill('Firewood is low.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('dialog')).toContainText('Firewood is low.')
  await page.getByRole('button', { name: 'Remove stay' }).click()
  await page.getByRole('button', { name: 'Keep it' }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(guestbook.getByRole('listitem').first()).toContainText('Firewood is low.')

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/calendar-mobile.png', fullPage: true })

  // Lawrence is the preview's family administrator: he may remove another host's stay but not write its note.
  await guestbook.getByRole('listitem').nth(1).getByRole('button').click()
  await expect(page.getByRole('button', { name: 'Remove stay' })).toBeVisible()
  await expect(page.getByRole('button', { name: /guestbook note/ })).not.toBeVisible()
  await page.keyboard.press('Escape')
  await guestbook.getByRole('listitem').first().getByRole('button').click()
  await page.getByRole('button', { name: 'Remove stay' }).click()
  await page.getByRole('button', { name: 'Yes, remove it' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.reload()
  await expect(guestbook.getByRole('listitem')).toHaveCount(2)
})

test('plan, edit, protect, and cancel a stay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lawrence.')
  await expect(page.getByText('Nobody’s at the cabin right now.')).toBeVisible()
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true })

  const start = addDays(dateKey(new Date()), 40)
  await page.getByRole('banner').getByRole('button', { name: 'Plan a stay' }).click()
  await pickDay(page, start)
  await pickDay(page, addDays(start, 3))
  await expect(page.getByRole('dialog')).toContainText('3 nights')
  await page.getByRole('button', { name: 'One more person' }).click()
  await page.getByLabel('Who’s coming').fill('Lawrence and friends')
  await page.getByLabel('Anything the family should know?').fill('Bring coffee.')
  await page.getByLabel('Others are welcome to join').check()
  await page.getByRole('button', { name: 'Save stay' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  await page.reload()
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Calendar' }).click()
  const comingUp = page.getByRole('region', { name: 'Coming up' })
  await comingUp.getByRole('button').filter({ hasText: 'Lawrence and friends' }).click()
  await expect(page.getByRole('heading', { name: 'Lawrence’s stay' })).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('3 people')
  await page.getByRole('button', { name: 'Edit stay' }).click()
  await page.getByLabel('Name this stay').fill('Edited getaway')
  await page.getByRole('button', { name: 'Save stay' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Days someone is there are marked, never blocked; overlapping stays get a heads-up.
  await page.getByRole('banner').getByRole('button', { name: 'Plan a stay' }).click()
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 3 && !(await dialog.getByRole('button', { name: `${dayLabel(start)}, someone there` }).isVisible()); i++)
    await dialog.getByRole('button', { name: 'Next month' }).click()
  await expect(dialog.getByRole('button', { name: `${dayLabel(addDays(start, 1))}, someone there` })).toBeEnabled()
  await expect(dialog.getByRole('button', { name: dayLabel(addDays(start, 3)), exact: true })).toBeEnabled()
  await pickDay(page, addDays(start, 1))
  await pickDay(page, addDays(start, 2))
  await expect(dialog.getByText('Heads up, others will be there too:')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByLabel('Demo member').selectOption('emma')
  await comingUp.getByRole('button').filter({ hasText: 'Lawrence and friends' }).click()
  await expect(page.getByRole('heading', { name: 'Edited getaway' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit stay' })).not.toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByLabel('Demo member').selectOption('lawrence')
  await comingUp.getByRole('button').filter({ hasText: 'Lawrence and friends' }).click()
  await page.getByRole('button', { name: 'Cancel stay', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, cancel stay' }).click()
  await page.reload()
  await expect(comingUp.getByText('Lawrence and friends')).not.toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('banner').getByRole('button', { name: 'Plan a stay' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: 'test-results/mobile-form.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click()
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true })
  expect(errors).toEqual([])
})

test('families add plans to a gathering instead of separate stays', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const [thanksgiving] = seedGatherings(new Date())
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/#calendar')
  const comingUp = page.getByRole('region', { name: 'Coming up' })
  const dialog = page.getByRole('dialog')
  await comingUp.getByRole('button').filter({ hasText: 'Thanksgiving' }).click()
  await expect(dialog).toContainText('Everyone’s welcome, no need to sign up.')
  await expect(dialog).toContainText('7 people from 2 families so far')
  await expect(dialog).toContainText('Repeats every year, around Thanksgiving.')
  await dialog.getByRole('button', { name: 'Add your plans' }).click()
  await expect(dialog.getByRole('heading', { name: 'Your plans for Thanksgiving' })).toBeVisible()
  await expect(dialog).toContainText('Also coming:')
  await page.getByLabel('Anything the family should know?').fill('Bringing pie.')
  await dialog.getByRole('button', { name: 'Save plans' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(comingUp.getByRole('button').filter({ hasText: 'Thanksgiving' })).toContainText('You, Emma and Hanson added plans')

  // Someone planning a separate stay over the same days is offered the gathering instead.
  await page.getByLabel('Demo member').selectOption('alex')
  await page.getByRole('banner').getByRole('button', { name: 'Plan a stay' }).click()
  await pickDay(page, thanksgiving.start)
  await pickDay(page, thanksgiving.end)
  await dialog.getByRole('button', { name: 'Make these your plans for Thanksgiving' }).click()
  await expect(dialog.getByRole('heading', { name: 'Your plans for Thanksgiving' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Save plans' }).click()
  await expect(dialog).not.toBeVisible()
  await page.reload()
  await comingUp.getByRole('button').filter({ hasText: 'Thanksgiving' }).click()
  await expect(dialog).toContainText('from 4 families so far')
  await expect(dialog.getByRole('button', { name: 'Remove gathering' })).not.toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Add a gathering' }).click()
  await page.getByLabel('Name').fill('Fourth of July')
  await expect(dialog.getByRole('checkbox', { name: /Happens every year/ })).not.toBeChecked()
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
