'use client'

import { Users } from 'lucide-react'
import { type Booking, type Member, firstName } from '../lib/bookings'
import { dateRange } from '../lib/calendar'
import type { Gathering } from '../lib/gatherings'

/** "You, Emma and Hanson added plans" — you first, then others by arrival. */
export function planSummary(plans: Booking[], userId: string, memberOf: (id: string) => Member): string {
  if (!plans.length) return 'Everyone’s welcome'
  const names = [...plans]
    .sort((a, b) => Number(b.userId === userId) - Number(a.userId === userId))
    .map((b) => (b.userId === userId ? 'You' : firstName(memberOf(b.userId).name)))
  const list = names.length > 3 ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more` : names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
  return `${list} added plans`
}

export function GatheringRow({
  gathering,
  plans,
  today,
  userId,
  memberOf,
  onOpen
}: {
  gathering: Gathering
  plans: Booking[]
  today: string
  userId: string
  memberOf: (id: string) => Member
  onOpen: () => void
}) {
  return (
    <button className="row" onClick={onOpen}>
      <span className="gathering-mark large" aria-hidden="true">
        <Users size={17} strokeWidth={1.8} />
      </span>
      <span className="row-main">
        <span className="row-title">
          {gathering.title} <span className="muted">· {dateRange(gathering.start, gathering.end)}</span>
        </span>
        <span className="row-meta">
          {gathering.start <= today ? 'Happening now · ' : 'Family gathering · '}
          {planSummary(plans, userId, memberOf)}
        </span>
      </span>
      {gathering.repeats && <span className="tag tag-ember">Every year</span>}
    </button>
  )
}
