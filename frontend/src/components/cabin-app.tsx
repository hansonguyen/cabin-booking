'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, CalendarDays, House, ListChecks, Plus, X } from 'lucide-react'
import { type Member, members } from '../lib/bookings'
import { sharedBackend } from '../lib/shared-api'
import BookView from './book-view'
import CalendarView from './calendar-view'
import HomeView, { type View } from './home-view'
import ListView from './list-view'
import StayDialog, { type StayMode } from './stay-dialog'
import { Avatar } from './ui'
import { useCabinState } from './use-cabin-state'
import MemberNames from './member-names'

const tabs: { id: View; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'list', label: 'The list', icon: ListChecks },
  { id: 'book', label: 'Cabin book', icon: BookOpen }
]
const colors = ['green', 'clay', 'blue', 'gold']

function readHash(): { view: View; arg: string } {
  const [view, ...rest] = window.location.hash.replace(/^#/, '').split('/')
  return tabs.some((t) => t.id === view) ? { view: view as View, arg: decodeURIComponent(rest.join('/')) } : { view: 'home', arg: '' }
}

/** Assigned names follow the email identity; color stays stable when a name changes. */
function memberFromEmail(id: string, displayName?: string): Member {
  const name = displayName || id
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hash = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return { id, name, initials, color: colors[hash % colors.length] }
}

export default function CabinApp() {
  const state = useCabinState()
  const { userId, bookings, care, ready, notice, setNotice } = state
  const [route, setRoute] = useState<{ view: View; arg: string }>({ view: 'home', arg: '' })
  const [stay, setStay] = useState<StayMode>(null)
  const [managingNames, setManagingNames] = useState(false)

  useEffect(() => {
    const sync = () => {
      setRoute(readHash())
      window.scrollTo({ top: 0 })
    }
    // Read the initial tab from the address after the static render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoute(readHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])
  useEffect(() => {
    if (ready && route.view === 'calendar' && route.arg === 'guestbook')
      document.getElementById('guestbook')?.scrollIntoView({ behavior: 'smooth' })
  }, [ready, route])

  const go = useCallback((view: View, arg = '') => {
    const hash = view === 'home' && !arg ? '' : `#${view}${arg ? `/${encodeURIComponent(arg)}` : ''}`
    if (hash !== window.location.hash) history.pushState(null, '', hash || window.location.pathname + window.location.search)
    setRoute({ view, arg })
    setNotice('')
    window.scrollTo({ top: 0 })
  }, [setNotice])

  const knownMembers: Member[] = sharedBackend
    ? Array.from(new Set([userId, ...state.profiles.map((p) => p.email), ...bookings.map((b) => b.userId), ...care.tasks.map((t) => t.assignee)]))
        .filter(Boolean)
        .map((id) => memberFromEmail(id, state.profiles.find((p) => p.email === id)?.displayName))
    : members
  const memberOf = (id: string) =>
    knownMembers.find((m) => m.id === id) ?? (sharedBackend ? memberFromEmail(id) : { id, name: id, initials: id.slice(0, 2).toUpperCase(), color: 'green' })
  const user = memberOf(userId)
  const shared = { state, members: knownMembers, memberOf }

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('home')
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11 12 4l9 7" />
              <path d="M5 9.5V20h14V9.5" />
              <path d="M10 20v-5h4v5" />
              <path d="M16 6V3.5h2V8" />
            </svg>
            Lake Mary
          </a>
          <nav className="tabs" aria-label="Main">
            {tabs.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={id === 'home' ? '#' : `#${id}`}
                aria-current={route.view === id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  go(id)
                }}
              >
                <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button className="button primary plan-button" aria-label="Plan a stay" disabled={!ready} onClick={() => setStay({ kind: 'new', start: '' })}>
              <Plus size={17} aria-hidden="true" />
              <span>Plan a stay</span>
            </button>
            {sharedBackend ? (
              userId && (
                <>
                  <span className="who" title={`Signed in as ${userId}`}>
                    <Avatar member={user} size={38} />
                  </span>
                  <a className="button quiet sign-out-button" href="/cdn-cgi/access/logout">
                    Sign out
                  </a>
                </>
              )
            ) : (
              <label className="who preview-who">
                <Avatar member={user} size={38} />
                <span className="sr-only">Demo member</span>
                <select aria-label="Demo member" value={userId} onChange={(e) => state.setUserId(e.target.value)}>
                  {knownMembers.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}
        {!ready ? (
          <div className="page">
            <p className="empty-line">Opening the cabin…</p>
          </div>
        ) : route.view === 'calendar' ? (
          <CalendarView state={state} memberOf={memberOf} openStay={setStay} />
        ) : route.view === 'list' ? (
          <ListView {...shared} />
        ) : route.view === 'book' ? (
          <BookView key={route.arg} state={state} memberOf={memberOf} initialPage={route.arg || undefined} />
        ) : (
          <HomeView state={state} memberOf={memberOf} openStay={setStay} go={go} />
        )}
      </main>

      <footer className="site-footer">
        <span>Lake Mary · for family use</span>
        {state.canManageMembers && <button className="link" onClick={() => setManagingNames(true)}>Family names</button>}
        <span>
          {sharedBackend
            ? `Signed in as ${userId}`
            : 'Preview with sample people and stays. Changes stay in this browser.'}
        </span>
      </footer>

      <StayDialog mode={stay} setMode={setStay} {...shared} />
      {state.canManageMembers && managingNames && <MemberNames state={state} onClose={() => setManagingNames(false)} />}
    </div>
  )
}
