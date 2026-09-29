import type { Env } from '../env.ts'
import { body, json } from '../http.ts'
import { canDelete } from '../permissions.ts'
import { type BookingInput, parseBookingInput } from '../bookings.ts'

type BookingRow = {
  id: string; owner_email: string; title: string; start_date: string; end_date: string
  guests: number; guest_names: string; notes: string; open_to_company: number
  gathering_id: string | null; created_at: string; updated_at: string
}

function publicBooking(row: BookingRow) {
  return { id: row.id, userId: row.owner_email, title: row.title, start: row.start_date,
    end: row.end_date, guests: row.guests, names: row.guest_names, notes: row.notes,
    open: Boolean(row.open_to_company), gatheringId: row.gathering_id,
    createdAt: row.created_at, updatedAt: row.updated_at }
}

/** Plans for a gathering must overlap it. Returns an error response, or null when valid. */
async function checkGathering(env: Env, input: BookingInput): Promise<Response | null> {
  if (!input.gatheringId) return null
  const gathering = await env.DB.prepare('SELECT start_date, end_date FROM gatherings WHERE id = ?')
    .bind(input.gatheringId).first<{ start_date: string; end_date: string }>()
  if (!gathering) return json({ error: 'That gathering was removed. Reload to see the calendar.' }, 409)
  if (input.start >= gathering.end_date || input.end <= gathering.start_date) {
    return json({ error: 'Plans for a gathering need to overlap its dates.' }, 400)
  }
  return null
}

function constraintError(error: unknown): Response | null {
  if (!(error instanceof Error)) return null
  if (/UNIQUE constraint failed: bookings\.gathering_id/.test(error.message)) return json({ error: 'You already have plans for this gathering. Edit those instead.' }, 409)
  if (/FOREIGN KEY constraint failed/.test(error.message)) return json({ error: 'That gathering was removed. Reload to see the calendar.' }, 409)
  return null
}

export async function bookingsRoute(request: Request, env: Env, email: string): Promise<Response> {
  const path = new URL(request.url).pathname
  if (path === '/api/bookings' && request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM bookings ORDER BY start_date, id').all<BookingRow>()
    return json(rows.results.map(publicBooking))
  }
  if (path === '/api/bookings' && request.method === 'POST') {
    const input = parseBookingInput(await body(request))
    if (typeof input === 'string') return json({ error: input }, 400)
    const invalid = await checkGathering(env, input)
    if (invalid) return invalid
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    try {
      const row = await env.DB.prepare('INSERT INTO bookings (id, owner_email, title, start_date, end_date, guests, guest_names, notes, open_to_company, gathering_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *')
        .bind(id, email, input.title, input.start, input.end, input.guests, input.names, input.notes, Number(input.open), input.gatheringId, now, now).first<BookingRow>()
      return json(publicBooking(row!), 201)
    } catch (error) {
      const response = constraintError(error)
      if (response) return response
      throw error
    }
  }
  const match = /^\/api\/bookings\/([0-9a-f-]{36})(\/note)?$/.exec(path)
  if (match && (match[2] ? request.method === 'PATCH' : request.method === 'PUT' || request.method === 'DELETE')) {
    const id = match[1]
    const old = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<BookingRow>()
    if (!old) return json({ error: 'Stay not found.' }, 404)
    if (request.method === 'DELETE') {
      if (!canDelete(env, email, old.owner_email)) return json({ error: 'Only the trip host or family administrator may delete this stay.' }, 403)
      await env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run()
      return new Response(null, { status: 204 })
    }
    if (old.owner_email !== email) return json({ error: 'Only the trip host may change this stay.' }, 403)
    if (match[2]) {
      const value = await body(request)
      if (!value || typeof value !== 'object' || !('notes' in value) || typeof value.notes !== 'string' || value.notes.length > 2000) {
        return json({ error: 'Use a guestbook note of at most 2,000 characters.' }, 400)
      }
      if (!('updatedAt' in value) || typeof value.updatedAt !== 'string') return json({ error: 'Include the stay update time.' }, 400)
      const row = await env.DB.prepare('UPDATE bookings SET notes = ?, updated_at = ? WHERE id = ? AND owner_email = ? AND updated_at = ? RETURNING *')
        .bind(value.notes.trim(), new Date(Math.max(Date.now(), Date.parse(old.updated_at) + 1)).toISOString(), id, email, value.updatedAt).first<BookingRow>()
      return row ? json(publicBooking(row)) : json({ error: 'This stay changed. Reload before editing its note.' }, 409)
    }
    const input = parseBookingInput(await body(request), old.start_date < new Date().toISOString().slice(0, 10) ? old.start_date : undefined)
    if (typeof input === 'string') return json({ error: input }, 400)
    const invalid = await checkGathering(env, input)
    if (invalid) return invalid
    const now = new Date(Math.max(Date.now(), Date.parse(old.updated_at) + 1)).toISOString()
    try {
      const row = await env.DB.prepare('UPDATE bookings SET title = ?, start_date = ?, end_date = ?, guests = ?, guest_names = ?, notes = ?, open_to_company = ?, gathering_id = ?, updated_at = ? WHERE id = ? AND owner_email = ? RETURNING *')
        .bind(input.title, input.start, input.end, input.guests, input.names, input.notes, Number(input.open), input.gatheringId, now, id, email).first<BookingRow>()
      return json(publicBooking(row!))
    } catch (error) {
      const response = constraintError(error)
      if (response) return response
      throw error
    }
  }
  return json({ error: 'Not found.' }, 404)
}
