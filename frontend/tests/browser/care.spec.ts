import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { unzipSync, strFromU8 } from 'fflate'

test('the list: quick add, claim, check off, reopen, and edit', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#list')
  await page.getByLabel('Add to Running low').fill('Bring olive oil')
  await page.getByLabel('Add to Running low').press('Enter')
  const group = page.getByRole('region', { name: 'Running low' })
  await expect(group.getByText('Bring olive oil', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'I’ll do it: Bring olive oil' }).click()
  await expect(group.getByText('You’re on it')).toBeVisible()

  await group.getByRole('button', { name: /Bring olive oil/ }).click()
  await page.getByLabel('Details', { exact: true }).fill('One bottle, for the kitchen.')
  await page.getByLabel('Needs doing soon').check()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(group.getByText('Soon', { exact: true }).first()).toBeVisible()

  await page.getByRole('checkbox', { name: 'Done: Bring olive oil' }).click()
  await expect(group.getByText('Bring olive oil', { exact: true })).not.toBeVisible()
  await page.reload()
  await page.getByText(/1 done/).click()
  await page.getByRole('checkbox', { name: 'Not done: Bring olive oil' }).click()
  await expect(group.getByText('Bring olive oil', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/list-desktop.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/list-mobile.png', fullPage: true })
  expect(errors).toEqual([])
})

test('cabin book pages: write, search, edit, export, and delete', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#book')
  await expect(page.getByRole('heading', { name: 'Closing up', level: 2 })).toBeVisible()
  await page.getByRole('button', { name: 'Write a page' }).click()
  await page.getByLabel('Title').fill('Finding spare towels')
  await page.getByLabel('Section').selectOption({ label: 'Everything else' })
  await page.getByLabel('When you’d need this').fill('The bathroom towels are missing.')
  await page.getByLabel('The page').fill('Check the labeled storage bin.')
  await page.getByLabel('Other words people might search for').fill('linen, towels')
  await page.getByLabel('I’ve checked this on a real visit').check()
  await page.getByRole('button', { name: 'Save page' }).click()
  await expect(page.getByRole('heading', { name: 'Finding spare towels', level: 2 })).toBeVisible()
  await expect(page.getByText('Checked on a real visit')).toBeVisible()

  await page.reload()
  await page.getByLabel('Search the cabin book').fill('linen')
  await page.getByRole('button', { name: /Finding spare towels/ }).click()
  await expect(page.getByText('Check the labeled storage bin.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('The page').fill('Check the labeled storage bin on the second shelf.')
  await page.getByRole('button', { name: 'Save page' }).click()

  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download everything (for an AI assistant)' }).click()
  const download = await downloading
  const files = unzipSync(await readFile((await download.path())!))
  expect(strFromU8(files['KNOWLEDGE.md'])).toContain('second shelf')
  expect(JSON.parse(strFromU8(files['knowledge.json'])).articles).toHaveLength(2)
  await page.screenshot({ path: 'test-results/book-desktop.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/book-mobile.png', fullPage: true })

  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Delete page' }).click()
  await page.getByRole('button', { name: 'Keep it' }).click()
  await page.getByRole('button', { name: 'Delete page' }).click()
  await page.getByRole('button', { name: 'Yes, delete page' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Finding spare towels' })).not.toBeVisible()
  expect(errors).toEqual([])
})
