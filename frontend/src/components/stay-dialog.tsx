'use client'

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  type Booking,
  type Member,
  MAX_GUESTS,
  defaultTitle,
  firstName,
  nights,
  overlaps,
  prettyDate,
  validateBooking
} from '../lib/bookings'
import { dateRange, longDateRange, plural } from '../lib/calendar'
import type { Gathering } from '../lib/gatherings'
import { sharedBackend } from '../lib/shared-api'
import { GatheringDetail, GatheringForm } from './gathering-dialog'
import RangePicker from './range-picker'
import { Avatar, Confirm, Modal } from './ui'
import type { CabinState } from './use-cabin-state'

export type StayMode =
  | { kind: 'new'; start: string; gatheringId?: string }
  | { kind: 'view'; booking: Booking }
  | { kind: 'edit'; booking: Booking }
  | { kind: 'note'; booking: Booking }
  | { kind: 'gathering'; gathering: Gathering }
  | { kind: 'gathering-new'; start: string }
  | { kind: 'gathering-edit'; gathering: Gathering }
  | null

export type Shared = {
  state: CabinState
  members: Member[]
  memberOf: (id: string) => Member
  setMode: (mode: StayMode) => void
}

export default function StayDialog({ mode, ...shared }: Shared & { mode: StayMode }) {
  const key = !mode
    ? 'closed'
    : mode.kind === 'new'
      ? `new-${mode.start}-${mode.gatheringId ?? ''}`
      : mode.kind === 'gathering-new'
        ? `gathering-new-${mode.start}`
        : `${mode.kind}-${'booking' in mode ? mode.booking.id : mode.gathering.id}`
  return (
    <Modal open={!!mode} onClose={() => shared.setMode(null)} labelledBy="stay-title">
      {mode?.kind === 'view' && <StayDetail key={key} booking={mode.booking} {...shared} />}
      {mode?.kind === 'new' && <StayForm key={key} start={mode.start} gatheringId={mode.gatheringId} {...shared} />}
      {mode?.kind === 'edit' && <StayForm key={key} original={mode.booking} start={mode.booking.start} {...shared} />}
      {mode?.kind === 'note' && <NoteForm key={key} booking={mode.booking} {...shared} />}
      {mode?.kind === 'gathering' && <GatheringDetail key={key} gathering={mode.gathering} {...shared} />}
      {mode?.kind === 'gathering-new' && <GatheringForm key={key} start={mode.start} {...shared} />}
      {mode?.kind === 'gathering-edit' && <GatheringForm key={key} original={mode.gathering} start={mode.gathering.start} {...shared} />}
    </Modal>
  )
}

function StayDetail({ booking, state, memberOf, setMode }: Shared & { booking: Booking }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const host = memberOf(booking.userId)
  const mine = booking.userId === state.userId
  const past = booking.end <= state.today
  const started = booking.start < state.today
  const gathering = state.gatherings.find((g) => g.id === booking.gatheringId)
  const alsoThere = state.bookings
    .filter((b) => b.id !== booking.id && overlaps(b, booking))
    .sort((a, b) => a.start.localeCompare(b.start))
  async function remove() {
    setBusy(true)
    const failure = await state.removeBooking(booking.id)
    setBusy(false)
    if (failure) return setError(failure)
    setMode(null)
    state.setNotice(started ? 'Stay removed.' : gathering ? `Your plans for ${gathering.title} were removed.` : 'Stay canceled.')
  }
  return (
    <>
      <p className="modal-kicker">{longDateRange(booking.start, booking.end)}</p>
      <h2 id="stay-title">{booking.title}</h2>
      <p className="stay-host">
        <Avatar member={host} size={28} />
        {mine ? 'Your stay' : `${host.name}’s stay`} · {plural(nights(booking.start, booking.end), 'night')} ·{' '}
        {plural(booking.guests, 'person', 'people')}
      </p>
      {gathering && (
        <p className="part-of">
          Part of{' '}
          <button className="link" onClick={() => setMode({ kind: 'gathering', gathering })}>
            {gathering.title}
          </button>{' '}
          · {dateRange(gathering.start, gathering.end)}
        </p>
      )}
      {booking.names && (
        <section className="detail-block">
          <h3>{past ? 'Who came' : 'Who’s coming'}</h3>
          <p>{booking.names}</p>
        </section>
      )}
      <section className="detail-block">
        <h3>{past ? 'Guestbook note' : 'Notes'}</h3>
        <p className={booking.notes ? (past ? 'quote' : '') : 'muted'}>
          {booking.notes || (past ? 'No note left yet.' : 'No notes yet.')}
        </p>
      </section>
      {!past && alsoThere.length > 0 && (
        <section className="detail-block">
          <h3>Also at the cabin</h3>
          <OthersList stays={alsoThere} state={state} memberOf={memberOf} />
        </section>
      )}
      {booking.open && !past && !gathering && (
        <p className="tag tag-green">Room for more — check with {firstName(host.name)} first</p>
      )}
      {state.canDeleteItem(booking.userId) &&
        (confirming ? (
          <Confirm
            question={
              started
                ? 'Remove this stay from the calendar and guestbook?'
                : gathering
                  ? `Remove your plans for ${gathering.title}? You’re still welcome to come.`
                  : 'Cancel this stay?'
            }
            yes={started ? 'Yes, remove it' : gathering ? 'Yes, remove plans' : 'Yes, cancel stay'}
            no="Keep it"
            busy={busy}
            onYes={remove}
            onNo={() => setConfirming(false)}
          />
        ) : (
          <div className="modal-actions">
            <button className="button text danger-text" onClick={() => setConfirming(true)}>
              {started ? 'Remove stay' : gathering ? 'Remove plans' : 'Cancel stay'}
            </button>
            {mine && (started ? (
              <button className="button primary" onClick={() => setMode({ kind: 'note', booking })}>
                {booking.notes ? 'Edit guestbook note' : 'Leave a guestbook note'}
              </button>
            ) : (
              <button className="button primary" onClick={() => setMode({ kind: 'edit', booking })}>
                {gathering ? 'Edit plans' : 'Edit stay'}
              </button>
            ))}
          </div>
        ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

function StayForm({
  original,
  start,
  gatheringId,
  state,
  members,
  memberOf,
  setMode
}: Shared & { original?: Booking; start: string; gatheringId?: string }) {
  const user = memberOf(state.userId)
  const [draft, setDraft] = useState<Booking>(() => {
    if (original) return original
    const joining = state.gatherings.find((g) => g.id === gatheringId)
    return {
      id: crypto.randomUUID(),
      userId: state.userId,
      title: '',
      start: joining ? joining.start : start,
      end: joining ? joining.end : '',
      guests: 2,
      names: '',
      notes: '',
      open: true,
      gatheringId: joining?.id ?? null
    }
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const others = useMemo(() => state.bookings.filter((b) => b.id !== draft.id), [state.bookings, draft.id])
  const set = (patch: Partial<Booking>) => setDraft((current) => ({ ...current, ...patch }))
  const gathering = state.gatherings.find((g) => g.id === draft.gatheringId)
  const chosen = Boolean(draft.start && draft.end)
  const alsoThere = chosen ? others.filter((b) => overlaps(b, draft)).sort((a, b) => a.start.localeCompare(b.start)) : []
  const gatheringsNearby = chosen && !gathering ? state.gatherings.filter((g) => overlaps(g, draft)) : []
  const myPlans = (g: Gathering) => others.find((b) => b.gatheringId === g.id && b.userId === state.userId)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.start || !draft.end) return setError('Pick an arrival day and a departure day.')
    const next = { ...draft, title: draft.title.trim() || defaultTitle(user.name) }
    if (gathering && !overlaps(gathering, next))
      return setError(`Plans for ${gathering.title} need to overlap ${dateRange(gathering.start, gathering.end)}.`)
    const problem = validateBooking(next, state.bookings, state.today, members)
    if (problem) return setError(problem)
    setSaving(true)
    const failure = await state.saveBooking(next)
    setSaving(false)
    if (failure) return setError(failure)
    setMode(null)
    state.setNotice(
      gathering
        ? `Your plans for ${gathering.title} are saved.`
        : sharedBackend
          ? 'Stay saved. It’s on the family calendar.'
          : 'Stay saved in this browser.'
    )
  }

  const summary =
    draft.start && draft.end
      ? `${longDateRange(draft.start, draft.end)} · ${plural(nights(draft.start, draft.end), 'night')}`
      : draft.start
        ? `Arriving ${prettyDate(draft.start, { weekday: 'long', month: 'short', day: 'numeric' })}. Now pick your departure day.`
        : 'Pick your arrival day.'

  return (
    <>
      <h2 id="stay-title">
        {gathering ? (original?.gatheringId ? 'Edit your plans' : `Your plans for ${gathering.title}`) : original ? 'Edit your stay' : 'Plan a stay'}
      </h2>
      {gathering && (
        <p className="modal-lede">
          {gathering.title} is {longDateRange(gathering.start, gathering.end)}. Change the days if you’re arriving later or
          leaving earlier.{' '}
          <button type="button" className="link" onClick={() => set({ gatheringId: null })}>
            Make this a separate stay
          </button>
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <RangePicker
          start={draft.start}
          end={draft.end}
          today={state.today}
          others={others}
          gatherings={state.gatherings}
          blockClosedStays
          original={original}
          onChange={(from, to) => {
            setError('')
            set({ start: from, end: to })
          }}
        />
        <p className="range-summary" aria-live="polite">
          {summary}
        </p>
        {(gatheringsNearby.length > 0 || alsoThere.length > 0) && (
          <div className="heads-up" aria-live="polite">
            {gatheringsNearby.map((g) => {
              const existing = myPlans(g)
              return (
                <p key={g.id} className="heads-up-gathering">
                  These days overlap <strong>{g.title}</strong> ({dateRange(g.start, g.end)}), when everyone goes up.{' '}
                  {existing ? (
                    <button type="button" className="link" onClick={() => setMode({ kind: 'edit', booking: existing })}>
                      Edit your plans for it instead
                    </button>
                  ) : (
                    <button type="button" className="link" onClick={() => set({ gatheringId: g.id })}>
                      Make these your plans for {g.title}
                    </button>
                  )}
                </p>
              )
            })}
            {alsoThere.length > 0 && (
              <>
                <p>{gathering ? 'Also coming:' : 'Heads up, others will be there too:'}</p>
                <OthersList stays={alsoThere} state={state} memberOf={memberOf} />
              </>
            )}
          </div>
        )}
        <div className="form-row">
          <div className="field">
            <span id="people-label">
              People, including you <span className="required-marker" aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </span>
            <div className="stepper" role="group" aria-labelledby="people-label">
              <button
                type="button"
                aria-label="One fewer person"
                disabled={draft.guests <= 1}
                onClick={() => set({ guests: draft.guests - 1 })}
              >
                <Minus size={16} />
              </button>
              <output aria-live="polite">{draft.guests}</output>
              <button
                type="button"
                aria-label="One more person"
                disabled={draft.guests >= MAX_GUESTS}
                onClick={() => set({ guests: draft.guests + 1 })}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <label className="field">
            <span>Who’s coming <span className="optional">(optional)</span></span>
            <input
              maxLength={300}
              placeholder="Names, if you know them"
              value={draft.names}
              onChange={(e) => set({ names: e.target.value })}
            />
          </label>
        </div>
        <label className="field">
          <span>Anything the family should know? <span className="optional">(optional)</span></span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder={gathering ? 'Arrival time, what you’re bringing…' : 'Arrival time, plans, what you’re bringing…'}
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>
        {!gathering && (
          <>
            <label className="check">
              <input type="checkbox" checked={draft.open} onChange={(e) => set({ open: e.target.checked })} />
              <span>
                Others are welcome to join
                <small>Allows other family members to book overlapping dates. Uncheck to block new overlapping bookings.</small>
              </span>
            </label>
            <label className="field">
              <span>
                Name this stay <span className="optional">(optional)</span>
              </span>
              <input
                maxLength={80}
                placeholder={defaultTitle(user.name)}
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </label>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={() => setMode(null)}>
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? 'Saving…' : gathering ? 'Save plans' : 'Save stay'}
          </button>
        </div>
      </form>
    </>
  )
}

/** Other people's stays, for a heads-up. Never blocks anyone from going. */
export function OthersList({ stays, state, memberOf }: { stays: Booking[]; state: CabinState; memberOf: (id: string) => Member }) {
  return (
    <ul className="others-list">
      {stays.map((b) => {
        const host = memberOf(b.userId)
        return (
          <li key={b.id}>
            <Avatar member={host} size={22} />
            <span>
              {b.userId === state.userId ? 'You' : host.name} · {dateRange(b.start, b.end)} ·{' '}
              {plural(b.guests, 'person', 'people')}
              {b.open && !b.gatheringId ? ' · room for more' : ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function NoteForm({ booking, state, members, setMode }: Shared & { booking: Booking }) {
  const [notes, setNotes] = useState(booking.notes)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  // This form replaces the stay details inside an already-open dialog, so focus it directly.
  useEffect(() => field.current?.focus(), [])
  async function submit(e: FormEvent) {
    e.preventDefault()
    const next = { ...booking, notes: notes.trim() }
    const earliest = booking.start < state.today ? booking.start : state.today
    const problem = validateBooking(next, state.bookings, state.today, members, earliest)
    if (problem) return setError(problem)
    setSaving(true)
    const result = await state.saveGuestbookNote(booking, next.notes)
    setSaving(false)
    if (typeof result === 'string') return setError(result)
    setMode({ kind: 'view', booking: result })
  }
  return (
    <>
      <p className="modal-kicker">{longDateRange(booking.start, booking.end)}</p>
      <h2 id="stay-title">Guestbook note</h2>
      <p className="modal-lede">What should the next people know? What ran out, what broke, what was lovely.</p>
      <form onSubmit={submit}>
        <label className="field">
          Your note
          <textarea ref={field} rows={5} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={() => setMode({ kind: 'view', booking })}>
            Back
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </form>
    </>
  )
}
