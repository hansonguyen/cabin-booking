'use client'

import { ArrowRight } from 'lucide-react'
import { type Member, firstName, nights, parseDate, prettyDate } from '../lib/bookings'
import { basicsTopic, categoryLabels } from '../lib/cabin-care'
import { dateRange, plural, upcoming as upcomingItems } from '../lib/calendar'
import { cabinStatus, partOfDay } from '../lib/greeting'
import { GatheringRow } from './gathering-row'
import type { StayMode } from './stay-dialog'
import { Avatar } from './ui'
import type { CabinState } from './use-cabin-state'

export type View = 'home' | 'calendar' | 'list' | 'book'

export default function HomeView({
  state,
  memberOf,
  openStay,
  go
}: {
  state: CabinState
  memberOf: (id: string) => Member
  openStay: (mode: StayMode) => void
  go: (view: View, page?: string) => void
}) {
  const { today, bookings, gatherings, userId, care } = state
  const me = memberOf(userId)
  const nameOf = (id: string) => firstName(memberOf(id).name)
  const sorted = [...bookings].sort((a, b) => a.start.localeCompare(b.start))
  const upcoming = upcomingItems(bookings, gatherings, today)
  const next = sorted.find((b) => b.end > today && b.userId === userId)
  const nextGathering = next && gatherings.find((g) => g.id === next.gatheringId)
  const lastNote = [...bookings].filter((b) => b.end <= today && b.notes).sort((a, b) => b.end.localeCompare(a.end))[0]
  const tasks = care.tasks
    .filter((t) => t.status !== 'Done')
    .sort(
      (a, b) =>
        Number(b.priority === 'High') - Number(a.priority === 'High') ||
        Number(b.assignee === userId) - Number(a.assignee === userId)
    )
  const bringCount = care.tasks.filter(
    (t) => t.status !== 'Done' && t.category === 'Bring up' && (!t.assignee || t.assignee === userId)
  ).length
  const basics = care.articles.filter((a) => a.topic === basicsTopic).slice(0, 4)
  const newest = [...care.articles]
    .filter((a) => a.topic !== basicsTopic)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const closing = care.articles.find((a) => /clos|leav/i.test(a.title))

  return (
    <div className="page home">
      <section className="greeting">
        <div className="greeting-copy">
          <p className="kicker">{parseDate(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>
            {partOfDay(new Date().getHours())}, {firstName(me.name)}.
          </h1>
          <p className="status">{cabinStatus(bookings, today, userId, nameOf, gatherings)}</p>
          <div className="button-row">
            <button className="button quiet" onClick={() => go('calendar')}>
              Open the calendar
            </button>
            {closing && (
              <button className="button quiet" onClick={() => go('book', closing.id)}>
                {closing.title}
              </button>
            )}
          </div>
        </div>
        <figure className="greeting-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export serves this file as-is */}
          <img src="/lake.jpg" alt="The lake below the cabin, ringed by pines" />
        </figure>
      </section>

      <div className="three-up">
        <section className="card padded" aria-labelledby="next-stay-title">
          <h2 id="next-stay-title" className="card-label">
            Your next stay
          </h2>
          {next ? (
            <>
              <p className="big-date">{dateRange(next.start, next.end)}</p>
              <p className="muted">
                {prettyDate(next.start, { weekday: 'long' })} to {prettyDate(next.end, { weekday: 'long' })} ·{' '}
                {plural(nights(next.start, next.end), 'night')} · {plural(next.guests, 'person', 'people')}
              </p>
              {nextGathering && (
                <p className="part-of">
                  Part of{' '}
                  <button className="link" onClick={() => openStay({ kind: 'gathering', gathering: nextGathering })}>
                    {nextGathering.title}
                  </button>
                </p>
              )}
              {(next.names || next.notes) && (
                <div className="next-stay-notes">
                  {next.names && (
                    <p>
                      <span className="muted">With</span> {next.names}
                    </p>
                  )}
                  {next.notes && <p className="quote">“{next.notes}”</p>}
                </div>
              )}
              <div className="card-foot">
                <button className="button quiet" onClick={() => openStay({ kind: 'view', booking: next })}>
                  {next.start <= today ? 'View stay' : 'Edit stay'}
                </button>
                {bringCount > 0 && (
                  <button className="more" onClick={() => go('list')}>
                    {plural(bringCount, 'thing')} to bring <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="empty-line">You don’t have anything on the calendar.</p>
              <div className="card-foot">
                <button className="button primary" onClick={() => openStay({ kind: 'new', start: '' })}>
                  Plan a stay
                </button>
              </div>
            </>
          )}
        </section>

        <section className="card padded" aria-labelledby="home-coming-title">
          <h2 id="home-coming-title" className="card-label">
            Coming up
          </h2>
          {upcoming.length ? (
            <ul className="rows">
              {upcoming.slice(0, 4).map((item) => {
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
                return (
                  <li key={b.id}>
                    <button className="row" onClick={() => openStay({ kind: 'view', booking: b })}>
                      <Avatar member={host} />
                      <span className="row-main">
                        <span className="row-title">{b.userId === userId ? 'You' : firstName(host.name)}</span>
                        <span className="row-meta">
                          {b.start <= today ? `There now, until ${prettyDate(b.end)}` : dateRange(b.start, b.end)} ·{' '}
                          {plural(b.guests, 'person', 'people')}
                        </span>
                      </span>
                      {b.open && <span className="tag tag-green">Room for more</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="empty-line">Nothing on the calendar yet.</p>
          )}
          <div className="card-foot">
            <button className="more" onClick={() => go('calendar')}>
              Open the calendar <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="card padded" aria-labelledby="home-list-title">
          <h2 id="home-list-title" className="card-label">
            On the list
          </h2>
          {tasks.length ? (
            <ul className="checklist">
              {tasks.slice(0, 4).map((t) => (
                <li className="check-row" key={t.id}>
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={!state.careEditable}
                    aria-label={`Done: ${t.title}`}
                    onChange={async () => {
                      const failure = await state.saveCare({
                        ...care,
                        tasks: care.tasks.map((item) => (item.id === t.id ? { ...item, status: 'Done' } : item))
                      })
                      if (failure) state.setNotice(failure)
                    }}
                  />
                  <span className="check-row-main">
                    <span className="row-title">{t.title}</span>
                    <span className="row-meta">
                      {categoryLabels[t.category]} ·{' '}
                      {t.assignee ? (t.assignee === userId ? 'you' : nameOf(t.assignee)) : 'anyone'}
                    </span>
                  </span>
                  {t.priority === 'High' && <span className="tag tag-ember">Soon</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">{state.careReady ? 'Nothing on the list. Nice.' : 'Opening the list…'}</p>
          )}
          <div className="card-foot">
            <button className="more" onClick={() => go('list')}>
              {tasks.length > 4 ? `See all ${tasks.length}` : 'Open the list'} <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <div className="two-up">
        <section className="card padded" aria-labelledby="home-book-title">
          <div className="card-head">
            <h2 id="home-book-title" className="card-label">
              From the cabin book
            </h2>
            <button className="more" onClick={() => go('book')}>
              Open it <ArrowRight size={14} />
            </button>
          </div>
          {basics.length || newest ? (
            <ul className="link-list">
              {basics.map((a) => (
                <li key={a.id}>
                  <button className="link" onClick={() => go('book', a.id)}>
                    {a.title}
                  </button>
                  <span className="muted"> {(a.problem || a.solution).split('\n')[0]}</span>
                </li>
              ))}
              {newest && (
                <li>
                  <span className="muted">Newest: </span>
                  <button className="link" onClick={() => go('book', newest.id)}>
                    {newest.title}
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <p className="empty-line">
              Nothing written yet. Getting there, getting in, and closing up are good first pages.
            </p>
          )}
        </section>

        <section className="card padded" aria-labelledby="home-guestbook-title">
          <div className="card-head">
            <h2 id="home-guestbook-title" className="card-label">
              Last in the guestbook
            </h2>
            <button className="more" onClick={() => go('calendar', 'guestbook')}>
              Read it <ArrowRight size={14} />
            </button>
          </div>
          {lastNote ? (
            <button className="guestbook-entry" onClick={() => openStay({ kind: 'view', booking: lastNote })}>
              <span className="quote large">“{lastNote.notes}”</span>
              <span className="byline">
                <Avatar member={memberOf(lastNote.userId)} size={26} />
                {lastNote.userId === userId ? 'You' : memberOf(lastNote.userId).name} ·{' '}
                {dateRange(lastNote.start, lastNote.end)}
              </span>
            </button>
          ) : (
            <p className="empty-line">When people leave a note after their stay, the latest one shows up here.</p>
          )}
        </section>
      </div>
    </div>
  )
}
