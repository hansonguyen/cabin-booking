import { type Booking, nights } from './bookings.ts'
import { relativeDay } from './calendar.ts'
import type { Gathering } from './gatherings.ts'

const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']

export function partOfDay(hour: number): string {
  return hour < 5 ? 'Evening' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
}

function party(name: string, guests: number): { who: string; plural: boolean } {
  const others = guests - 1
  if (others < 1) return { who: name, plural: false }
  return { who: `${name} and ${words[others] ?? others} other${others === 1 ? '' : 's'}`, plural: true }
}

/** A plain-language summary of what is happening at the cabin, from the viewer's side. */
export function cabinStatus(
  bookings: Booking[],
  today: string,
  userId: string,
  nameOf: (id: string) => string,
  gatherings: Gathering[] = []
): string {
  const sorted = [...bookings].sort((a, b) => a.start.localeCompare(b.start))
  const here = sorted.filter((b) => b.start <= today && today < b.end)
  const mine = here.find((b) => b.userId === userId)
  const others = here.filter((b) => b.userId !== userId)
  const gatheringNow = gatherings.find((g) => g.start <= today && today < g.end)
  const nextGathering = gatherings.filter((g) => g.start > today).sort((a, b) => a.start.localeCompare(b.start))[0]
  const nextOther = sorted.find((b) => b.start > today && b.userId !== userId && !b.gatheringId)
  const nextMine = sorted.find((b) => b.start >= today && b.userId === userId && b !== mine)
  const parts: string[] = []
  if (gatheringNow) parts.push(`${gatheringNow.title} at the cabin runs until ${relativeDay(today, gatheringNow.end)}.`)
  if (mine) parts.push(`You’re at the cabin until ${relativeDay(today, mine.end)}.`)
  if (others.length === 1) {
    const p = party(nameOf(others[0].userId), others[0].guests)
    parts.push(`${p.who} ${p.plural ? 'are' : 'is'} ${mine ? 'there too' : `at the cabin until ${relativeDay(today, others[0].end)}`}.`)
  } else if (others.length > 1) {
    const names = others.map((b) => nameOf(b.userId))
    parts.push(`${names.slice(0, -1).join(', ')} and ${names.at(-1)} are ${mine ? 'there too' : 'at the cabin'}.`)
  }
  if (!here.length && !gatheringNow) parts.push('Nobody’s at the cabin right now.')
  if (nextGathering && (!nextOther || nextGathering.start <= nextOther.start)) {
    parts.push(`${nextGathering.title} at the cabin starts ${relativeDay(today, nextGathering.start)}.`)
  } else if (nextOther && (!nextMine || nextOther.start <= nextMine.start)) {
    const p = party(nameOf(nextOther.userId), nextOther.guests)
    parts.push(`${p.who} head${p.plural ? '' : 's'} up ${relativeDay(today, nextOther.start)}.`)
  }
  if (nextMine) {
    const gap = nights(today, nextMine.start)
    parts.push(
      gap === 0 ? 'You head up today.' : gap === 1 ? 'You head up tomorrow.' : `Your next stay is ${gap} days out.`
    )
  } else if (!here.length && !gatheringNow && !nextOther && !nextGathering) parts.push('Nothing’s on the calendar yet.')
  return parts.join(' ')
}
