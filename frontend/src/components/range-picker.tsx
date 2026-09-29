'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type Booking, dateKey, parseDate, prettyDate } from '../lib/bookings'
import { monthWeeks, stayNights } from '../lib/calendar'
import type { Gathering } from '../lib/gatherings'

/** Picks a date range. Days someone is there, or a gathering is on, are marked but never blocked. */
export default function RangePicker({
  start,
  end,
  today,
  others,
  gatherings,
  onChange
}: {
  start: string
  end: string
  today: string
  others: Booking[]
  gatherings: Gathering[]
  onChange: (start: string, end: string) => void
}) {
  const [month, setMonth] = useState(() => {
    const d = parseDate(start || today)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const busy = useMemo(() => new Set(others.flatMap((b) => stayNights(b.start, b.end))), [others])
  const gatheringOn = (day: string) => gatherings.find((g) => g.start <= day && day < g.end)
  const choosingEnd = Boolean(start && !end)
  const weeks = monthWeeks(month.getFullYear(), month.getMonth(), [])
  const thisMonth = today.slice(0, 7)
  const shownMonth = dateKey(month).slice(0, 7)
  return (
    <div className="range-picker">
      <div className="range-picker-head">
        <strong aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            disabled={shownMonth <= thisMonth}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="range-grid" aria-hidden="true">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="range-weekday">
            {d}
          </span>
        ))}
      </div>
      <div className="range-grid">
        {weeks.flatMap((week) =>
          week.days.map((day) => {
            if (day.slice(0, 7) !== shownMonth) return <span key={day} />
            const isEnd = day === end
            const isStart = day === start
            const inRange = Boolean(start && end && day > start && day < end)
            const gathering = day >= today ? gatheringOn(day) : undefined
            const othersThere = day >= today && busy.has(day)
            return (
              <button
                type="button"
                key={day}
                className={[
                  'range-day',
                  isStart || isEnd ? 'selected' : '',
                  inRange ? 'in-range' : '',
                  othersThere ? 'busy' : '',
                  gathering ? 'gathering' : '',
                  day === today ? 'today' : ''
                ].join(' ')}
                aria-label={`${prettyDate(day, { weekday: 'long', month: 'long', day: 'numeric' })}${gathering ? `, ${gathering.title}` : ''}${othersThere ? ', someone there' : ''}`}
                aria-pressed={isStart || isEnd}
                disabled={day < today}
                onClick={() => (choosingEnd && day > start ? onChange(start, day) : onChange(day, ''))}
              >
                {parseDate(day).getDate()}
              </button>
            )
          })
        )}
      </div>
      <p className="range-key" aria-hidden="true">
        <span className="range-key-busy">Someone there</span>
        <span className="range-key-gathering">Family gathering</span>
      </p>
      {start && end && (
        <button type="button" className="button text small" onClick={() => onChange('', '')}>
          Clear dates
        </button>
      )}
    </div>
  )
}
