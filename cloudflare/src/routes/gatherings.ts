import type { Env } from '../env.ts'
import { body, json } from '../http.ts'
import { canDelete } from '../permissions.ts'
import { parseGatheringInput } from '../bookings.ts'
import { nextYear } from '../../../frontend/src/lib/yearly.ts'

type GatheringRow = {
  id: string; series_id: string; year: number; title: string; start_date: string; end_date: string
  notes: string; repeats: number; created_by: string; updated_by: string; updated_at: string; version: number
}

function publicGathering(row: GatheringRow) {
  return { id: row.id, seriesId: row.series_id, year: row.year, title: row.title, start: row.start_date,
    end: row.end_date, notes: row.notes, repeats: Boolean(row.repeats), createdBy: row.created_by,
    version: row.version, updatedAt: row.updated_at }
}

const stale = () => json({ error: 'Someone changed this gathering. Reload to see their changes before saving.' }, 409)

/** Once a yearly gathering ends, add next year's so there is always one ahead. */
async function addNextYears(db: D1Database, today: string) {
  const { results: latest } = await db.prepare(`
    SELECT g.* FROM gatherings g
    WHERE g.repeats = 1 AND g.year = (SELECT MAX(year) FROM gatherings WHERE series_id = g.series_id) AND g.end_date <= ?
  `).bind(today).all<GatheringRow>()
  const inserts = latest.flatMap((row) => {
    const rows = []
    let { start_date: start, end_date: end, year } = row
    // Catch up at most a few missed years, ending at the first one still ahead.
    for (let i = 0; i < 5 && end <= today; i++) {
      ;({ start, end } = nextYear(start, end))
      year += 1
      rows.push(db.prepare(`INSERT OR IGNORE INTO gatherings (id, series_id, year, title, start_date, end_date, notes, repeats, created_by, updated_by, updated_at)
        SELECT ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM gatherings WHERE id = ? AND version = ? AND repeats = 1)`)
        .bind(crypto.randomUUID(), row.series_id, year, row.title, start, end, row.notes, row.created_by, row.created_by, new Date().toISOString(), row.id, row.version))
    }
    return rows
  })
  if (inserts.length) await db.batch(inserts)
}

export async function gatheringsRoute(request: Request, env: Env, email: string): Promise<Response> {
  const path = new URL(request.url).pathname
  const today = new Date().toISOString().slice(0, 10)
  if (path === '/api/gatherings' && request.method === 'GET') {
    await addNextYears(env.DB, today)
    const rows = await env.DB.prepare('SELECT * FROM gatherings ORDER BY start_date, id').all<GatheringRow>()
    return json(rows.results.map(publicGathering))
  }
  if (path === '/api/gatherings' && request.method === 'POST') {
    const input = parseGatheringInput(await body(request))
    if (typeof input === 'string') return json({ error: input }, 400)
    const id = crypto.randomUUID()
    const row = await env.DB.prepare(`INSERT INTO gatherings (id, series_id, year, title, start_date, end_date, notes, repeats, created_by, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
      .bind(id, id, Number(input.start.slice(0, 4)), input.title, input.start, input.end, input.notes, Number(input.repeats), email, email, new Date().toISOString())
      .first<GatheringRow>()
    return json(publicGathering(row!), 201)
  }
  const match = /^\/api\/gatherings\/([0-9a-f-]{36})$/.exec(path)
  if (!match || !['PUT', 'DELETE'].includes(request.method)) return json({ error: 'Not found.' }, 404)
  const id = match[1]
  const old = await env.DB.prepare('SELECT * FROM gatherings WHERE id = ?').bind(id).first<GatheringRow>()
  if (!old) return json({ error: 'Gathering not found.' }, 404)
  const incoming = await body(request)
  const version = incoming && typeof incoming === 'object' && 'version' in incoming ? incoming.version : undefined
  if (!Number.isSafeInteger(version) || (version as number) < 1) return json({ error: 'Include the gathering version.' }, 400)
  if (version !== old.version) return stale()

  if (request.method === 'DELETE') {
    if (!canDelete(env, email, old.created_by)) return json({ error: 'Only the person who added this gathering or the family administrator may remove it.' }, 403)
    // Removing one year also ends the tradition; otherwise it would come straight back.
    // Plans people added stay on the calendar as their own stays.
    const [, removed] = await env.DB.batch([
      env.DB.prepare('UPDATE gatherings SET repeats = 0, version = version + 1, updated_at = ?, updated_by = ? WHERE series_id = ? AND id != ? AND repeats != 0 AND EXISTS (SELECT 1 FROM gatherings WHERE id = ? AND version = ?)')
        .bind(new Date().toISOString(), email, old.series_id, id, id, version),
      env.DB.prepare('DELETE FROM gatherings WHERE id = ? AND version = ?').bind(id, version)
    ])
    return removed.meta.changes ? new Response(null, { status: 204 }) : stale()
  }

  // Anyone may adjust a gathering, like the shared list.
  const input = parseGatheringInput(incoming, old.start_date < today ? old.start_date : undefined)
  if (typeof input === 'string') return json({ error: input }, 400)
  const now = new Date(Math.max(Date.now(), Date.parse(old.updated_at) + 1)).toISOString()
  // Follow-up statements apply only if this request's versioned update did.
  const applied = 'EXISTS (SELECT 1 FROM gatherings WHERE id = ? AND version = ? AND updated_at = ? AND updated_by = ?)'
  const guard = [id, (version as number) + 1, now, email]
  const [updated] = await env.DB.batch([
    env.DB.prepare(`UPDATE gatherings SET title = ?, start_date = ?, end_date = ?, notes = ?, repeats = ?, updated_by = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND version = ?`)
      .bind(input.title, input.start, input.end, input.notes, Number(input.repeats), email, now, id, version),
    // Plans that simply followed the gathering's dates move with it; custom arrival days stay put.
    env.DB.prepare(`UPDATE bookings SET start_date = ?, end_date = ?, updated_at = ?
      WHERE gathering_id = ? AND start_date = ? AND end_date = ? AND ${applied}`)
      .bind(input.start, input.end, now, id, old.start_date, old.end_date, ...guard),
    env.DB.prepare(`UPDATE gatherings SET repeats = ?, version = version + 1, updated_at = ?, updated_by = ? WHERE series_id = ? AND id != ? AND repeats != ? AND ${applied}`)
      .bind(Number(input.repeats), now, email, old.series_id, id, Number(input.repeats), ...guard)
  ])
  if (!updated.meta.changes) return stale()
  const row = await env.DB.prepare('SELECT * FROM gatherings WHERE id = ?').bind(id).first<GatheringRow>()
  return json(publicGathering(row!))
}
