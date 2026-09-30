'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type Booking, dateKey, isBooking, members, seedBookings } from '../lib/bookings'
import { type Article, type CareTask, type CabinData, initialCabinData, isCabinData } from '../lib/cabin-care'
import { type Gathering, isGathering, seedGatherings, seedPlans, withNextYears } from '../lib/gatherings'
import { apiRequest, sharedBackend } from '../lib/shared-api'

const BOOKINGS_STORE = 'lake-mary-bookings-v1'
const GATHERINGS_STORE = 'lake-mary-gatherings-v1'
const CARE_STORE = 'lake-mary-care-v1'
const MEMBER_STORE = 'lake-mary-member'
const emptyCare: CabinData = { version: 1, tasks: [], articles: [] }
export type MemberProfile = { email: string; displayName: string; version: number; color?: string }

const message = (cause: unknown, fallback: string) => (cause instanceof Error ? cause.message : fallback)

/** Loads and saves everything the app shares: the signed-in member, stays, and cabin notes. */
export function useCabinState() {
  const [today, setToday] = useState('')
  const [userId, setUserIdState] = useState(sharedBackend ? '' : 'lawrence')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [gatherings, setGatherings] = useState<Gathering[]>([])
  const [care, setCare] = useState<CabinData>(sharedBackend ? emptyCare : initialCabinData)
  const [ready, setReady] = useState(false)
  const [careReady, setCareReady] = useState(false)
  const [careBlocked, setCareBlocked] = useState(false)
  const [notice, setNotice] = useState('')
  const [profiles, setProfiles] = useState<MemberProfile[]>([])
  const [canManageMembers, setCanManageMembers] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    const now = new Date()
    // Hydrate browser-owned storage and local dates after the static server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(dateKey(now))
    if (sharedBackend) {
      Promise.all([
        apiRequest<{ email: string; canManageMembers: boolean }>('/api/me'),
        apiRequest<Booking[]>('/api/bookings'),
        apiRequest<MemberProfile[]>('/api/members'),
        apiRequest<Gathering[]>('/api/gatherings')
      ])
        .then(([me, trips, directory, family]) => {
          if (!me.email || !Array.isArray(trips) || !Array.isArray(family)) throw new Error('The cabin server returned incomplete data.')
          setUserIdState(me.email)
          setBookings(trips)
          setGatherings(family)
          setProfiles(directory)
          setCanManageMembers(me.canManageMembers === true)
          setReady(true)
        })
        .catch((cause) => setNotice(`Could not load the calendar: ${message(cause, 'Try reloading.')}`))
      Promise.all([apiRequest<CareTask[]>('/api/tasks'), apiRequest<Article[]>('/api/pages')])
        .then(([tasks, articles]) => {
          const data = { version: 1, tasks, articles }
          if (!isCabinData(data)) throw new Error('The cabin server returned invalid notes.')
          setCare(data)
          setCareReady(true)
        })
        .catch((cause) => {
          setCareBlocked(true)
          setNotice(`Could not load the list and cabin book: ${message(cause, 'Try reloading.')}`)
        })
      return
    }
    try {
      const saved = localStorage.getItem(BOOKINGS_STORE)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!Array.isArray(parsed) || !parsed.every(isBooking)) throw new Error('Invalid saved data')
        setBookings(parsed)
      } else setBookings(seedBookings(now))
      const family = localStorage.getItem(GATHERINGS_STORE)
      const parsedFamily: unknown = family ? JSON.parse(family) : null
      if (family && (!Array.isArray(parsedFamily) || !parsedFamily.every(isGathering))) throw new Error('Invalid saved data')
      if (Array.isArray(parsedFamily)) {
        const current = withNextYears(parsedFamily, dateKey(now), () => crypto.randomUUID())
        if (current !== parsedFamily) localStorage.setItem(GATHERINGS_STORE, JSON.stringify(current))
        setGatherings(current)
      } else {
        // First visit to the preview, or saved stays from before gatherings existed.
        const sample = seedGatherings(now)
        setGatherings(sample)
        if (!saved) setBookings((current) => [...current, ...seedPlans(sample[0])])
      }
      const member = localStorage.getItem(MEMBER_STORE)
      if (members.some((m) => m.id === member)) setUserIdState(member!)
    } catch {
      setNotice('Saved stays couldn’t be read, so this preview is showing sample stays. Saving a stay will replace the unreadable data.')
      const sample = seedGatherings(now)
      setGatherings(sample)
      setBookings([...seedBookings(now), ...seedPlans(sample[0])])
    }
    setReady(true)
    try {
      const raw = localStorage.getItem(CARE_STORE)
      if (raw) {
        const saved: unknown = JSON.parse(raw)
        if (!isCabinData(saved)) throw new Error('Invalid stored records')
        setCare(saved)
      }
    } catch {
      setCareBlocked(true)
      setNotice('Saved list items and cabin book pages couldn’t be read. Editing is off so nothing gets overwritten.')
    }
    setCareReady(true)
  }, [])

  const setUserId = useCallback((id: string) => {
    setUserIdState(id)
    try {
      localStorage.setItem(MEMBER_STORE, id)
    } catch {
      setNotice('Your choice of member will last until you reload.')
    }
  }, [])

  function persistBookings(next: Booking[]) {
    localStorage.setItem(BOOKINGS_STORE, JSON.stringify(next))
    setBookings(next)
  }

  /** Saves a new or edited stay. Returns an error message, or null on success. */
  async function saveBooking(draft: Booking): Promise<string | null> {
    if (busy.current) return 'Still saving…'
    busy.current = true
    try {
      if (sharedBackend) {
        const existing = bookings.some((b) => b.id === draft.id)
        const saved = await apiRequest<Booking>(
          existing ? `/api/bookings/${draft.id}` : '/api/bookings',
          existing ? 'PUT' : 'POST',
          draft
        )
        setBookings((current) => [...current.filter((b) => b.id !== draft.id && b.id !== saved.id), saved])
      } else persistBookings([...bookings.filter((b) => b.id !== draft.id), draft])
      return null
    } catch (cause) {
      if (sharedBackend) {
        apiRequest<Booking[]>('/api/bookings').then(setBookings).catch(() => {})
        return message(cause, 'Could not save the stay.')
      }
      return 'Your browser couldn’t save this stay. Allow site storage and try again.'
    } finally {
      busy.current = false
    }
  }

  async function removeBooking(id: string): Promise<string | null> {
    if (busy.current) return 'Still saving…'
    busy.current = true
    try {
      if (sharedBackend) {
        await apiRequest(`/api/bookings/${id}`, 'DELETE')
        setBookings((current) => current.filter((b) => b.id !== id))
      } else persistBookings(bookings.filter((b) => b.id !== id))
      return null
    } catch (cause) {
      return sharedBackend ? message(cause, 'Could not remove the stay.') : 'Your browser couldn’t save this change.'
    } finally {
      busy.current = false
    }
  }

  function persistGatherings(next: Gathering[], nextBookings = bookings) {
    localStorage.setItem(GATHERINGS_STORE, JSON.stringify(next))
    localStorage.setItem(BOOKINGS_STORE, JSON.stringify(nextBookings))
    setGatherings(next)
    setBookings(nextBookings)
  }

  /** Saves a new or edited gathering. Plans that matched its old dates move with it. */
  async function saveGathering(draft: Gathering): Promise<string | null> {
    if (busy.current) return 'Still saving…'
    busy.current = true
    const old = gatherings.find((g) => g.id === draft.id)
    try {
      if (sharedBackend) {
        const saved = await apiRequest<Gathering>(old ? `/api/gatherings/${draft.id}` : '/api/gatherings', old ? 'PUT' : 'POST', draft)
        const [family, trips] = await Promise.all([apiRequest<Gathering[]>('/api/gatherings'), apiRequest<Booking[]>('/api/bookings')])
        setGatherings(family.some((g) => g.id === saved.id) ? family : [...family, saved])
        setBookings(trips)
      } else {
        const saved = { ...draft, version: (old?.version ?? 0) + 1, createdBy: old ? old.createdBy : userId }
        persistGatherings(
          [...gatherings.filter((g) => g.id !== draft.id).map((g) => (g.seriesId === draft.seriesId ? { ...g, repeats: draft.repeats } : g)), saved],
          bookings.map((b) =>
            old && b.gatheringId === old.id && b.start === old.start && b.end === old.end ? { ...b, start: draft.start, end: draft.end } : b
          )
        )
      }
      return null
    } catch (cause) {
      if (sharedBackend) {
        apiRequest<Gathering[]>('/api/gatherings').then(setGatherings).catch(() => {})
        return message(cause, 'Could not save the gathering.')
      }
      return 'Your browser couldn’t save this gathering. Allow site storage and try again.'
    } finally {
      busy.current = false
    }
  }

  /** Removes one gathering and stops it repeating. Plans stay on the calendar as stays. */
  async function removeGathering(gathering: Gathering): Promise<string | null> {
    if (busy.current) return 'Still saving…'
    busy.current = true
    try {
      if (sharedBackend) {
        await apiRequest(`/api/gatherings/${gathering.id}`, 'DELETE', { version: gathering.version })
        // Stopping a series also changes the versions of its other years.
        const [family, trips] = await Promise.all([apiRequest<Gathering[]>('/api/gatherings'), apiRequest<Booking[]>('/api/bookings')])
        setGatherings(family)
        setBookings(trips)
        return null
      }
      const next = gatherings
        .filter((g) => g.id !== gathering.id)
        .map((g) => (g.seriesId === gathering.seriesId ? { ...g, repeats: false } : g))
      const nextBookings = bookings.map((b) => (b.gatheringId === gathering.id ? { ...b, gatheringId: null } : b))
      persistGatherings(next, nextBookings)
      return null
    } catch (cause) {
      return sharedBackend ? message(cause, 'Could not remove the gathering.') : 'Your browser couldn’t save this change.'
    } finally {
      busy.current = false
    }
  }

  /** Persists only the changed item, so unrelated family edits cannot overwrite one another. */
  async function saveCare(next: CabinData): Promise<string | null> {
    if (busy.current) return 'Still saving…'
    if (careBlocked) return 'Editing is off until the page is reloaded.'
    if (!isCabinData(next)) return 'Please check the title and required details.'
    busy.current = true
    try {
      if (sharedBackend) {
        const changes = (['tasks', 'articles'] as const).flatMap((kind) => {
          const previous = new Map(care[kind].map((item) => [item.id, item]))
          const incoming = new Map(next[kind].map((item) => [item.id, item]))
          return [...new Set([...previous.keys(), ...incoming.keys()])]
            .filter((id) => JSON.stringify(previous.get(id)) !== JSON.stringify(incoming.get(id)))
            .map((id) => ({ kind, id, old: previous.get(id), item: incoming.get(id) }))
        })
        if (!changes.length) return null
        if (changes.length !== 1) return 'Please save one list item or cabin page at a time.'
        const { kind, id, old, item } = changes[0]
        const route = kind === 'tasks' ? '/api/tasks' : '/api/pages'
        const saved = await apiRequest<CareTask | Article>(
          old ? `${route}/${encodeURIComponent(id)}` : route,
          !item ? 'DELETE' : old ? 'PUT' : 'POST',
          item ?? { version: old?.version }
        )
        setCare((current) => kind === 'tasks'
          ? { ...current, tasks: [...current.tasks.filter((t) => t.id !== id), ...(item ? [saved as CareTask] : [])] }
          : { ...current, articles: [...current.articles.filter((a) => a.id !== id), ...(item ? [saved as Article] : [])] })
      } else {
        const saved: CabinData = { ...next,
          tasks: next.tasks.map(item => ({ ...item, createdBy: care.tasks.find(old => old.id === item.id)?.createdBy ?? (care.tasks.some(old => old.id === item.id) ? null : userId) })),
          articles: next.articles.map(item => ({ ...item, createdBy: care.articles.find(old => old.id === item.id)?.createdBy ?? (care.articles.some(old => old.id === item.id) ? null : userId) }))
        }
        localStorage.setItem(CARE_STORE, JSON.stringify(saved))
        setCare(saved)
      }
      return null
    } catch (cause) {
      if (!sharedBackend) return 'Your browser couldn’t save this. Allow site storage and try again.'
      const text = message(cause, 'Could not save.')
      if (text.includes('Reload')) setCareBlocked(true)
      return text
    } finally {
      busy.current = false
    }
  }

  async function saveGuestbookNote(booking: Booking, notes: string): Promise<Booking | string> {
    if (busy.current) return 'Still saving…'
    busy.current = true
    try {
      const saved = sharedBackend
        ? await apiRequest<Booking>(`/api/bookings/${booking.id}/note`, 'PATCH', { notes, updatedAt: booking.updatedAt })
        : { ...booking, notes }
      if (sharedBackend) setBookings((current) => current.map((b) => b.id === saved.id ? saved : b))
      else persistBookings(bookings.map((b) => b.id === saved.id ? saved : b))
      return saved
    } catch (cause) {
      return message(cause, 'Could not save the guestbook note.')
    } finally {
      busy.current = false
    }
  }

  return {
    profiles,
    canManageMembers,
    canDeleteItem: (creator?: string | null) => Boolean(userId && (creator === userId || (sharedBackend ? canManageMembers : userId === 'lawrence'))),
    async saveMemberName(profile: MemberProfile): Promise<string | null> {
      try {
        const saved = await apiRequest<MemberProfile>('/api/members', 'PUT', profile)
        setProfiles((current) => [...current.filter((p) => p.email !== saved.email), saved])
        return null
      } catch (cause) {
        return message(cause, 'Could not save the name.')
      }
    },
    today,
    userId,
    setUserId,
    bookings,
    gatherings,
    care,
    ready,
    careReady,
    careEditable: careReady && !careBlocked,
    notice,
    setNotice,
    saveBooking,
    removeBooking,
    saveGathering,
    removeGathering,
    saveGuestbookNote,
    saveCare
  }
}

export type CabinState = ReturnType<typeof useCabinState>
