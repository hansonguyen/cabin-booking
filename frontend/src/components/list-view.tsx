'use client'

import { type FormEvent, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Member } from '../lib/bookings'
import { type CareTask, categoryLabels, listOrder } from '../lib/cabin-care'
import { sharedBackend } from '../lib/shared-api'
import { Avatar, Confirm, Modal } from './ui'
import type { CabinState } from './use-cabin-state'

type Props = {
  state: CabinState
  members: Member[]
  memberOf: (id: string) => Member
}

export default function ListView({ state, members, memberOf }: Props) {
  const { care, careEditable, userId } = state
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CareTask | null>(null)
  const needle = query.toLowerCase().trim()
  const matches = (t: CareTask) =>
    `${t.title} ${t.notes} ${t.assignee ? memberOf(t.assignee).name : ''}`.toLowerCase().includes(needle)
  const open = care.tasks.filter((t) => t.status !== 'Done' && matches(t))
  const done = care.tasks.filter((t) => t.status === 'Done' && matches(t))

  async function update(tasks: CareTask[]) {
    const failure = await state.saveCare({ ...care, tasks })
    if (failure) state.setNotice(failure)
    return !failure
  }
  const patch = (task: CareTask, change: Partial<CareTask>) =>
    update(care.tasks.map((t) => (t.id === task.id ? { ...t, ...change } : t)))

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>The list</h1>
          <p className="lede">What the cabin needs. Claim something with “I’ll do it,” and check it off when it’s done.</p>
        </div>
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search the list"
            placeholder="Search the list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {!state.careReady ? (
        <p className="empty-line">Opening the list…</p>
      ) : (
        <>
          <div className="list-groups">
            {listOrder.map((category) => {
              const label = categoryLabels[category]
              const headingId = `group-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`
              const items = open
                .filter((t) => t.category === category)
                .sort((a, b) => Number(b.priority === 'High') - Number(a.priority === 'High'))
              return (
                <section className="card list-group" key={category} aria-labelledby={headingId}>
                  <div className="card-head">
                    <h2 id={headingId}>{label}</h2>
                    <span className="muted small">{items.length ? `${items.length} to do` : 'All clear'}</span>
                  </div>
                  <ul className="checklist">
                    {items.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        userId={userId}
                        disabled={!careEditable}
                        memberOf={memberOf}
                        onToggle={() => patch(t, { status: 'Done' })}
                        onClaim={() => patch(t, { assignee: userId })}
                        onOpen={() => setEditing(t)}
                      />
                    ))}
                  </ul>
                  {needle && !items.length && <p className="empty-line">Nothing here matches.</p>}
                  <QuickAdd
                    label={label}
                    disabled={!careEditable}
                    onAdd={(title) =>
                      update([
                        ...care.tasks,
                        {
                          id: crypto.randomUUID(),
                          title,
                          category,
                          notes: '',
                          assignee: '',
                          status: 'To do',
                          priority: 'Normal'
                        }
                      ])
                    }
                  />
                </section>
              )
            })}
          </div>
          {done.length > 0 && (
            <details className="card padded done-list">
              <summary>
                <span>
                  {done.length} done{' '}
                  <span className="muted">
                    — {done
                      .slice(0, 2)
                      .map((t) => t.title)
                      .join(', ')}
                    {done.length > 2 ? `, and ${done.length - 2} more` : ''}
                  </span>
                </span>
                <span className="summary-toggle">Show</span>
              </summary>
              <ul className="checklist">
                {done.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    userId={userId}
                    disabled={!careEditable}
                    memberOf={memberOf}
                    onToggle={() => patch(t, { status: 'To do' })}
                    onClaim={() => {}}
                    onOpen={() => setEditing(t)}
                  />
                ))}
              </ul>
            </details>
          )}
          {!sharedBackend && (
            <p className="fine-print">Items marked “Example” are sample data. Edits stay in this browser.</p>
          )}
        </>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} labelledBy="task-title">
        {editing && (
          <TaskEditor
            key={editing.id}
            task={editing}
            state={state}
            members={members}
            memberOf={memberOf}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function TaskRow({
  task,
  userId,
  disabled,
  memberOf,
  onToggle,
  onClaim,
  onOpen
}: {
  task: CareTask
  userId: string
  disabled: boolean
  memberOf: (id: string) => Member
  onToggle: () => void
  onClaim: () => void
  onOpen: () => void
}) {
  const complete = task.status === 'Done'
  const who = task.assignee ? memberOf(task.assignee) : null
  const meta = [
    task.notes.split('\n')[0],
    who ? (task.assignee === userId ? 'You’re on it' : `${who.name.split(' ')[0]} is on it`) : '',
    task.id.startsWith('example-') ? 'Example' : ''
  ].filter(Boolean)
  return (
    <li className={`check-row${complete ? ' complete' : ''}`}>
      <input
        type="checkbox"
        checked={complete}
        disabled={disabled}
        aria-label={`${complete ? 'Not done' : 'Done'}: ${task.title}`}
        onChange={onToggle}
      />
      <button className="check-row-main" onClick={onOpen}>
        <span className="row-title">{task.title}</span>
        {meta.length > 0 && <span className="row-meta">{meta.join(' · ')}</span>}
      </button>
      {task.priority === 'High' && !complete && <span className="tag tag-ember">Soon</span>}
      {!complete &&
        (who ? (
          <span title={who.name}>
            <Avatar member={who} size={26} />
          </span>
        ) : (
          <button className="claim" disabled={disabled} onClick={onClaim} aria-label={`I’ll do it: ${task.title}`}>
            I’ll do it
          </button>
        ))}
    </li>
  )
}

function QuickAdd({ label, disabled, onAdd }: { label: string; disabled: boolean; onAdd: (title: string) => Promise<boolean> }) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean || adding) return
    setAdding(true)
    if (await onAdd(clean.slice(0, 100))) setTitle('')
    setAdding(false)
  }
  return (
    <form className="quick-add" onSubmit={submit}>
      <Plus size={16} aria-hidden="true" />
      <input
        aria-label={`Add to ${label}`}
        placeholder={`Add to ${label.toLowerCase()}`}
        maxLength={100}
        disabled={disabled}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {title.trim() && (
        <button className="button text small" disabled={adding}>
          Add
        </button>
      )}
    </form>
  )
}

function TaskEditor({
  task,
  state,
  members,
  memberOf,
  onDone
}: {
  task: CareTask
  state: CabinState
  members: Member[]
  memberOf: (id: string) => Member
  onDone: () => void
}) {
  const [draft, setDraft] = useState(task)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const set = (change: Partial<CareTask>) => setDraft((current) => ({ ...current, ...change }))
  const people = members.some((m) => m.id === draft.assignee) || !draft.assignee ? members : [...members, memberOf(draft.assignee)]

  async function save(tasks: CareTask[]) {
    setSaving(true)
    const failure = await state.saveCare({ ...state.care, tasks })
    setSaving(false)
    if (failure) return setError(failure)
    onDone()
  }

  return (
    <>
      <h2 id="task-title">Edit list item</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(state.care.tasks.map((t) => (t.id === task.id ? { ...draft, title: draft.title.trim() } : t)))
        }}
      >
        <label className="field">
          What needs doing
          <input required maxLength={100} value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <div className="form-row">
          <label className="field">
            List
            <select value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {listOrder.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Who’s doing it
            <select value={draft.assignee} onChange={(e) => set({ assignee: e.target.value })}>
              <option value="">Nobody yet</option>
              {people.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === state.userId ? `${m.name} (you)` : m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Details
          <textarea
            rows={4}
            maxLength={4000}
            placeholder="How much, where it is, what to bring…"
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.priority === 'High'}
            onChange={(e) => set({ priority: e.target.checked ? 'High' : 'Normal' })}
          />
          <span>
            Needs doing soon
            <small>Moves it to the top and marks it “Soon.”</small>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {confirming ? (
          <Confirm
            question="Take this off the list for good?"
            yes="Yes, delete it"
            no="Keep it"
            busy={saving}
            onYes={() => save(state.care.tasks.filter((t) => t.id !== task.id))}
            onNo={() => setConfirming(false)}
          />
        ) : (
          <div className="modal-actions">
            {state.canDeleteItem(task.createdBy) && (
              <button type="button" className="button text danger-text" disabled={!state.careEditable} onClick={() => setConfirming(true)}>
                Delete
              </button>
            )}
            <button className="button primary" disabled={saving || !state.careEditable}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </form>
    </>
  )
}
