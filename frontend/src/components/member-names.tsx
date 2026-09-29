'use client'

import { useState } from 'react'
import { Modal } from './ui'
import type { CabinState, MemberProfile } from './use-cabin-state'

export default function MemberNames({ state, onClose }: { state: CabinState; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const profiles = [...state.profiles].sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email))
  function select(profile: MemberProfile) {
    setEmail(profile.email)
    setName(profile.displayName)
    setVersion(profile.version)
    setEditing(true)
    setError('')
    setMessage('')
  }
  function reset() {
    setEmail('')
    setName('')
    setVersion(0)
    setEditing(false)
  }
  return (
    <Modal open={true} onClose={onClose} labelledBy="member-names-title">
      <h2 id="member-names-title">Family names</h2>
      <p className="modal-lede">Give each email a familiar name for the calendar, guestbook, list, and cabin book.</p>
      <p className="fine-print">Only you can edit these names. Adding a name doesn’t grant sign-in access; approved emails are still managed in Cloudflare.</p>
      <form onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError('')
        setMessage('')
        const address = email.trim().toLowerCase()
        const failure = await state.saveMemberName({ email: address, displayName: name.trim(), version })
        setBusy(false)
        if (failure) return setError(failure)
        setMessage(`Saved ${name.trim()} for ${address}.`)
        reset()
      }}>
        <label className="field">
          Email address
          <input type="email" required maxLength={254} value={email} readOnly={editing} disabled={busy}
            placeholder="family@example.com" onChange={(event) => {
              const address = event.target.value
              setEmail(address)
              const existing = state.profiles.find((p) => p.email === address.trim().toLowerCase())
              setVersion(existing?.version ?? 0)
            }} />
        </label>
        <label className="field">
          Display name
          <input required maxLength={80} value={name} disabled={busy} placeholder="First and last name"
            onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="button-row">
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save name'}</button>
          {editing && <button type="button" className="button quiet" disabled={busy} onClick={reset}>Add another person</button>}
        </div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="fine-print" role="status">{message}</p>}
      <ul className="rows member-directory" aria-label="Family email names">
        {profiles.map((profile) => (
          <li key={profile.email}>
            <button className="row" disabled={busy} onClick={() => select(profile)} aria-label={`Edit name for ${profile.email}`}>
              <span className="row-main">
                <span className="row-title">{profile.displayName || 'Name not assigned'}</span>
                <span className="row-meta">{profile.email}</span>
              </span>
              <span className="link small">Edit</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
