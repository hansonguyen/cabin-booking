'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { nights, prettyDate } from '../lib/bookings'
import { longDateRange, plural } from '../lib/calendar'
import { type Gathering, plansFor } from '../lib/gatherings'
import type { Shared } from './stay-dialog'
import { Avatar, Confirm } from './ui'

/** "Fri" near the gathering, "Tue, Oct 27" when it's more than a few days away. */
const when = (day: string, near: string) =>
  prettyDate(day, Math.abs(nights(day, near)) < 7 ? { weekday: 'short' } : { weekday: 'short', month: 'short', day: 'numeric' })

export function GatheringDetail({ gathering, state, memberOf, setMode }: Shared & { gathering: Gathering }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const plans = plansFor(gathering, state.bookings)
  const mine = plans.find((b) => b.userId === state.userId)
  const past = gathering.end <= state.today
  const people = plans.reduce((sum, b) => sum + b.guests, 0)

  async function remove() {
    setBusy(true)
    const failure = await state.removeGathering(gathering)
    setBusy(false)
    if (failure) return setError(failure)
    setMode(null)
    state.setNotice(`${gathering.title} was removed from the calendar.`)
  }

  return (
    <>
      <p className="modal-kicker">{longDateRange(gathering.start, gathering.end)}</p>
      <h2 id="stay-title">{gathering.title}</h2>
      <p className="stay-host">
        <span className="gathering-mark" aria-hidden="true">
          <Users size={15} strokeWidth={1.8} />
        </span>
        Family gathering · {plural(nights(gathering.start, gathering.end), 'night')}
      </p>
      {!past && (
        <p className="modal-lede">
          This gathering was saved before individual stays became the main calendar flow. Plan your own stay for
          the dates you’ll be at the cabin.
        </p>
      )}
      {gathering.notes && (
        <section className="detail-block">
          <h3>Notes</h3>
          <p>{gathering.notes}</p>
        </section>
      )}
      <section className="detail-block">
        <h3>{past ? 'Who shared plans' : 'Plans so far'}</h3>
        {plans.length ? (
          <>
            <ul className="plan-list">
              {plans.map((b) => {
                const host = memberOf(b.userId)
                const custom = [
                  b.start !== gathering.start ? `arriving ${when(b.start, gathering.start)}` : '',
                  b.end !== gathering.end ? `leaving ${when(b.end, gathering.end)}` : ''
                ].filter(Boolean)
                return (
                  <li key={b.id}>
                    <button className="row" onClick={() => setMode({ kind: 'view', booking: b })}>
                      <Avatar member={host} size={28} />
                      <span className="row-main">
                        <span className="row-title">{b.userId === state.userId ? 'You' : host.name}</span>
                        <span className="row-meta">
                          {custom.length ? custom.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'The whole time'} ·{' '}
                          {b.names || plural(b.guests, 'person', 'people')}
                          {b.notes ? ` · “${b.notes}”` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="muted small">
              {plural(people, 'person', 'people')} from {plural(plans.length, 'family', 'families')} so far
              {past ? '' : '.'}
            </p>
          </>
        ) : (
          <p className="muted">
            {past ? 'Nobody added plans.' : 'No saved plans for this gathering.'}
          </p>
        )}
      </section>
      {confirming ? (
        <Confirm
          question={`Remove ${gathering.title}? Plans people added stay on the calendar as their own stays.`}
          yes="Yes, remove it"
          no="Keep it"
          busy={busy}
          onYes={remove}
          onNo={() => setConfirming(false)}
        />
      ) : (
        <div className="modal-actions">
          {state.canDeleteItem(gathering.createdBy) && (
            <button className="button text danger-text" onClick={() => setConfirming(true)}>
              Remove gathering
            </button>
          )}
          {!past &&
            (mine ? (
              <button className="button primary" onClick={() => setMode({ kind: 'view', booking: mine })}>
                Your plans
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => setMode({ kind: 'new', start: gathering.start })}
              >
                Plan a stay
              </button>
            ))}
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
