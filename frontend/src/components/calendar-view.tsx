'use client'

import { type CSSProperties, useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { type Booking, type Member, dateKey, firstName, parseDate, prettyDate } from '../lib/bookings'
import { dateRange, monthWeeks, plural, upcoming as upcomingItems } from '../lib/calendar'
import { plansFor } from '../lib/gatherings'
import { GatheringRow } from './gathering-row'
import type { StayMode } from './stay-dialog'
import { Avatar } from './ui'
import type { CabinState } from './use-cabin-state'

const GUESTBOOK_PAGE = 6

export default function CalendarView({
  state,
  memberOf,
  openStay
}: {
  state: CabinState
  memberOf: (id: string) => Member
  openStay: (mode: StayMode) => void
}) {
  const { today, bookings, gatherings, userId } = state
  const [month, setMonth] = useState(() => {
    const d = today ? parseDate(today) : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [onlyMine, setOnlyMine] = useState(false)
  const [guestbookShown, setGuestbookShown] = useState(GUESTBOOK_PAGE)
  // Plans for a gathering show inside its band, unless they run past it and need their own bar.
  const standalone = bookings.filter((b) => {
    const g = gatherings.find((x) => x.id === b.gatheringId)
    return !g || b.start < g.start || b.end > g.end
  })
  const weeks = monthWeeks(month.getFullYear(), month.getMonth(), standalone, gatherings)
  const visibleHosts = [...new Set(weeks.flatMap((week) => [
    ...week.stays.map(({ item }) => item.userId),
    ...week.gatherings.flatMap(({ item }) => plansFor(item, bookings).map((plan) => plan.userId))
  ]))]
    .map(memberOf)
    .sort((a, b) => a.name.localeCompare(b.name))
  const hasGatherings = weeks.some((week) => week.gatherings.length > 0)
  const shownMonth = dateKey(month).slice(0, 7)
  const upcoming = onlyMine
    ? bookings
        .filter((b) => b.end > today && b.userId === userId)
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((booking) => ({ kind: 'stay' as const, booking }))
    : upcomingItems(bookings, gatherings, today)
  const place = (from: number, to: number, lane: number) =>
    ({ left: `calc(${(from / 7) * 100}% + 2px)`, width: `calc(${((to - from) / 7) * 100}% - 4px)`, '--lane': lane }) as CSSProperties
  const guestbook = bookings.filter((b) => b.end <= today).sort((a, b) => b.end.localeCompare(a.end))
  const view = (booking: Booking) => openStay({ kind: 'view', booking })

  return (
    <div className="page calendar-page">
      <div className="page-head">
        <div className="month-nav">
          <h1 aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>
          <div className="month-buttons">
            <button
              className="button quiet icon-only"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="button quiet icon-only"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
            {shownMonth !== today.slice(0, 7) && (
              <button
                className="button quiet"
                onClick={() => setMonth(new Date(parseDate(today).getFullYear(), parseDate(today).getMonth(), 1))}
              >
                This month
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="card month" aria-label="Cabin calendar">
        <div className="month-weekdays" aria-hidden="true">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        {weeks.map((week) => (
          <div className="month-week" key={week.days[0]} style={{ '--lanes': Math.max(1, week.lanes) } as CSSProperties}>
            {week.days.map((day, i) => {
              const outside = day.slice(0, 7) !== shownMonth
              const label = prettyDate(day, { weekday: 'long', month: 'long', day: 'numeric' })
              return (
                <button
                  key={day}
                  className={`month-day${i > 4 ? ' weekend' : ''}${outside ? ' outside' : ''}${day === today ? ' today' : ''}`}
                  disabled={day < today}
                  aria-label={`${label}: plan a stay`}
                  onClick={() => openStay({ kind: 'new', start: day })}
                >
                  <span className="month-date">{parseDate(day).getDate()}</span>
                </button>
              )
            })}
            {week.gatherings.map(({ item: gathering, from, to, clippedStart, clippedEnd, lane }) => {
              const plans = plansFor(gathering, bookings)
              return (
                <button
                  key={gathering.id}
                  className={`gathering-bar${clippedStart ? ' clip-start' : ''}${clippedEnd ? ' clip-end' : ''}${to - from < 1.5 ? ' narrow' : ''}${gathering.end <= today ? ' past' : ''}`}
                  style={place(from, to, lane)}
                  onClick={() => openStay({ kind: 'gathering', gathering })}
                  aria-label={`${gathering.title}, family gathering, ${dateRange(gathering.start, gathering.end)}${plans.length ? `, ${plural(plans.length, 'family', 'families')} added plans` : ''}`}
                >
                  <Users size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span className="stay-bar-label">{gathering.title}</span>
                  {plans.length > 0 && (
                    <span className="bar-avatars" aria-hidden="true">
                      {plans.slice(0, 4).map((b) => (
                        <Avatar key={b.id} member={memberOf(b.userId)} size={20} />
                      ))}
                      {plans.length > 4 && <span className="bar-more">+{plans.length - 4}</span>}
                    </span>
                  )}
                </button>
              )
            })}
            {week.stays.map(({ item: booking, from, to, clippedStart, clippedEnd, lane }) => {
              const host = memberOf(booking.userId)
              const who = booking.userId === userId ? 'You' : firstName(host.name)
              return (
                <button
                  key={booking.id}
                  className={`stay-bar m-${host.color}${clippedStart ? ' clip-start' : ''}${clippedEnd ? ' clip-end' : ''}${to - from < 1.5 ? ' narrow' : ''}${booking.end <= today ? ' past' : ''}`}
                  style={place(from, to, lane)}
                  onClick={() => view(booking)}
                  aria-label={`${host.name}, ${dateRange(booking.start, booking.end)}`}
                  title={`${host.name} · ${dateRange(booking.start, booking.end)}`}
                >
                  <Avatar member={host} size={24} />
                  <span className="stay-bar-label">
                    {who} · {plural(booking.guests, 'person', 'people')}
                    {booking.open && booking.end > today ? ' · room for more' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </section>
      {(visibleHosts.length > 0 || hasGatherings) && (
        <ul className="calendar-key" aria-label="Calendar colors">
          {visibleHosts.map((host) => (
            <li key={host.id}>
              <Avatar member={host} size={24} />
              <span>{host.name}{host.id === userId ? ' (you)' : ''}</span>
            </li>
          ))}
          {hasGatherings && (
            <li>
              <span className="gathering-swatch" aria-hidden="true"><Users size={15} /></span>
              <span>Family gatherings</span>
            </li>
          )}
        </ul>
      )}
      <p className="fine-print">
        You can book overlapping dates when existing stays have room for more. Otherwise, their nights are reserved. Tap a day
        to plan your own stay.
      </p>

      <div className="two-up">
        <section className="card padded" aria-labelledby="coming-up-title">
          <div className="card-head">
            <h2 id="coming-up-title">Coming up</h2>
            <div className="toggle" role="group" aria-label="Whose stays">
              <button aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>
                Everyone
              </button>
              <button aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>
                Just mine
              </button>
            </div>
          </div>
          {upcoming.length ? (
            <ul className="rows">
              {upcoming.map((item) => {
                if (item.kind === 'gathering')
                  return (
                    <li key={item.gathering.id}>
                      <GatheringRow
                        gathering={item.gathering}
                        plans={item.plans}
                        today={today}
                        userId={userId}
                        memberOf={memberOf}
                        onOpen={() => openStay({ kind: 'gathering', gathering: item.gathering })}
                      />
                    </li>
                  )
                const b = item.booking
                const host = memberOf(b.userId)
                const gathering = gatherings.find((g) => g.id === b.gatheringId)
                return (
                  <li key={b.id}>
                    <button className="row" onClick={() => view(b)}>
                      <Avatar member={host} />
                      <span className="row-main">
                        <span className="row-title">
                          {b.userId === userId ? 'You' : firstName(host.name)}{' '}
                          <span className="muted">· {dateRange(b.start, b.end)}</span>
                        </span>
                        <span className="row-meta">
                          {b.start <= today ? 'There now · ' : ''}
                          {gathering ? `${gathering.title} · ` : ''}
                          {b.names || plural(b.guests, 'person', 'people')}
                          {b.notes ? ` · “${b.notes}”` : ''}
                        </span>
                      </span>
                      {b.open && !gathering && <span className="tag tag-green">Room for more</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="empty-line">
              {onlyMine ? 'You don’t have anything on the calendar.' : 'Nothing on the calendar yet.'}{' '}
              <button className="button text" onClick={() => openStay({ kind: 'new', start: '' })}>
                Plan a stay
              </button>
            </p>
          )}
        </section>

        <section id="guestbook" className="card padded" aria-labelledby="guestbook-title">
          <div className="card-head">
            <h2 id="guestbook-title">Guestbook</h2>
            <span className="muted small">Notes left after each stay</span>
          </div>
          {guestbook.length ? (
            <ul className="guestbook">
              {guestbook.slice(0, guestbookShown).map((b) => {
                const host = memberOf(b.userId)
                const mine = b.userId === userId
                return (
                  <li key={b.id}>
                    <button className="guestbook-entry" onClick={() => view(b)}>
                      {b.notes ? (
                        <span className="quote">“{b.notes}”</span>
                      ) : (
                        <span className="muted">{mine ? 'You haven’t left a note for this stay.' : 'No note left.'}</span>
                      )}
                      <span className="byline">
                        <Avatar member={host} size={24} />
                        {mine ? 'You' : host.name} · {dateRange(b.start, b.end)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="empty-line">After a stay, the notes people leave will show up here.</p>
          )}
          {guestbook.length > guestbookShown && (
            <button className="button text" onClick={() => setGuestbookShown(guestbookShown + GUESTBOOK_PAGE)}>
              Show older stays
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
