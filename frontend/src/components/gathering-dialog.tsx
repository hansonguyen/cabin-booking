'use client'

import { type FormEvent, useState } from 'react'
import { Users } from 'lucide-react'
import { nights, prettyDate } from '../lib/bookings'
import { longDateRange, plural } from '../lib/calendar'
import { type Gathering, plansFor, validateGathering } from '../lib/gatherings'
import { nextYear } from '../lib/yearly'
import RangePicker from './range-picker'
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
  const next = gathering.repeats ? nextYear(gathering.start, gathering.end) : null

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
        {gathering.repeats ? ' · every year' : ''}
      </p>
      {!past && (
        <p className="modal-lede">
          Everyone’s welcome, no need to sign up. Add your plans only if you want people to know when you’re arriving
          or how many are coming.
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
              {past ? '' : '. Everyone else is still expected.'}
            </p>
          </>
        ) : (
          <p className="muted">
            {past ? 'Nobody added plans.' : 'Nobody has added plans yet. That’s fine, everyone’s still expected.'}
          </p>
        )}
      </section>
      {next && (
        <p className="fine-print">
          Repeats every year, {next.basis}. Next year: {longDateRange(next.start, next.end)}.
        </p>
      )}
      {confirming ? (
        <Confirm
          question={`Remove ${gathering.title}?${gathering.repeats ? ' It will stop repeating each year.' : ''} Plans people added stay on the calendar as their own stays.`}
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
          {!past && (
            <button className="button quiet" onClick={() => setMode({ kind: 'gathering-edit', gathering })}>
              Edit gathering
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
                onClick={() => setMode({ kind: 'new', start: gathering.start, gatheringId: gathering.id })}
              >
                Add your plans
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

export function GatheringForm({ original, start, state, setMode }: Shared & { original?: Gathering; start: string }) {
  const [draft, setDraft] = useState<Gathering>(
    () =>
      original ?? {
        id: crypto.randomUUID(),
        seriesId: '',
        year: 0,
        title: '',
        start,
        end: '',
        notes: '',
        repeats: false,
        createdBy: state.userId
      }
  )
  // New gatherings that span a holiday repeat by default, until the person decides.
  const [repeatsTouched, setRepeatsTouched] = useState(Boolean(original))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Gathering>) => setDraft((current) => ({ ...current, ...patch }))
  const next = draft.start && draft.end ? nextYear(draft.start, draft.end) : null
  const repeats = repeatsTouched ? draft.repeats : Boolean(next?.basis.startsWith('around'))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.start || !draft.end) return setError('Pick the first and last day.')
    const saved: Gathering = {
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      repeats,
      seriesId: draft.seriesId || draft.id,
      year: draft.year || Number(draft.start.slice(0, 4))
    }
    const earliest = original && original.start < state.today ? original.start : state.today
    const problem = validateGathering(saved, state.today, earliest)
    if (problem) return setError(problem)
    setSaving(true)
    const failure = await state.saveGathering(saved)
    setSaving(false)
    if (failure) return setError(failure)
    setMode(null)
    state.setNotice(original ? `${saved.title} was updated.` : `${saved.title} is on the calendar. Everyone’s welcome.`)
  }

  return (
    <>
      <h2 id="stay-title">{original ? 'Edit gathering' : 'Add a family gathering'}</h2>
      {!original && (
        <p className="modal-lede">
          For times everyone goes up, like Thanksgiving or the Fourth. Nobody needs to sign up. People can add their
          own plans if they want.
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>
            Name <span className="required-marker" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </span>
          <input
            maxLength={80}
            placeholder="Thanksgiving, Fourth of July…"
            value={draft.title}
            data-autofocus={!original}
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>
        <RangePicker
          start={draft.start}
          end={draft.end}
          today={state.today}
          others={state.bookings.filter((b) => b.gatheringId !== draft.id)}
          gatherings={state.gatherings.filter((g) => g.id !== draft.id)}
          onChange={(from, to) => {
            setError('')
            set({ start: from, end: to })
          }}
        />
        <p className="range-summary" aria-live="polite">
          {draft.start && draft.end
            ? `${longDateRange(draft.start, draft.end)} · ${plural(nights(draft.start, draft.end), 'night')}`
            : draft.start
              ? 'Now pick the last day.'
              : 'Pick the first day.'}
        </p>
        <label className="field">
          <span>
            Anything everyone should know? <span className="optional">(optional)</span>
          </span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="Meals, sleeping arrangements, what to bring…"
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => {
              setRepeatsTouched(true)
              set({ repeats: e.target.checked })
            }}
          />
          <span>
            Happens every year
            <small>
              {next
                ? `Next year it shows up ${next.basis}: ${longDateRange(next.start, next.end)}. Any year’s dates can be adjusted.`
                : 'Next year’s shows up on its own once this one ends.'}
            </small>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button quiet"
            onClick={() => setMode(original ? { kind: 'gathering', gathering: original } : null)}
          >
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? 'Saving…' : original ? 'Save gathering' : 'Add gathering'}
          </button>
        </div>
      </form>
    </>
  )
}
