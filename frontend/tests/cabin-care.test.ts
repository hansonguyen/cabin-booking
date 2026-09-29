import test from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync, strFromU8 } from 'fflate'
import {
  type Article,
  exportKnowledge,
  initialCabinData,
  isCabinData
} from '../src/lib/cabin-care.ts'
const note: Article = {
  id: 'one',
  title: '../Where are the supplies?',
  topic: 'General',
  problem: 'Cannot find towels.',
  solution: 'Look in the labeled closet.\nSecond shelf.',
  tags: 'towels, storage',
  author: 'Lawrence Smith',
  updatedAt: '2026-09-06T12:00:00Z',
  verified: false
}
test('ZIP is readable and preserves notes and metadata without bookings or tasks', () => {
  const files = unzipSync(exportKnowledge([note, { ...note, id: 'two' }]))
  assert.equal(Object.keys(files).length, 5)
  assert.ok(Object.keys(files).every((path) => !path.includes('..')))
  const data = JSON.parse(strFromU8(files['knowledge.json']))
  assert.deepEqual(data.articles, [note, { ...note, id: 'two' }])
  assert.equal(data.tasks, undefined)
  assert.equal(data.bookings, undefined)
  assert.match(strFromU8(files['KNOWLEDGE.md']), /Unverified note/)
  assert.ok(strFromU8(files['KNOWLEDGE.md']).includes(note.solution))
})
test('protects stored data from malformed tasks and articles', () => {
  assert.ok(isCabinData(initialCabinData))
  assert.ok(isCabinData({ ...initialCabinData, articles: [note] }))
  for (const bad of [
    null,
    {},
    { ...initialCabinData, version: 2 },
    {
      ...initialCabinData,
      tasks: [{ ...initialCabinData.tasks[0], status: 'invalid' }]
    },
    { ...initialCabinData, articles: [{ ...note, solution: ' ' }] },
    { ...initialCabinData, articles: [{ ...note, updatedAt: 'not a date' }] }
  ])
    assert.equal(isCabinData(bad), false)
})
