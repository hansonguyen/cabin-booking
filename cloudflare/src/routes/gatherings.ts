import type { Env } from '../env.ts'
import { body, json } from '../http.ts'
import { canDelete } from '../permissions.ts'

type GatheringRow = {
  id: string; series_id: string; year: number; title: string; start_date: string; end_date: string
  notes: string; repeats: number; created_by: string; updated_by: string; updated_at: string; version: number
}

function publicGathering(row: GatheringRow) {
  // Keep historical records intact, while retired recurrence is inactive in every client.
  return { id: row.id, seriesId: row.series_id, year: row.year, title: row.title, start: row.start_date,
    end: row.end_date, notes: row.notes, repeats: false, createdBy: row.created_by,
    version: row.version, updatedAt: row.updated_at }
}

const stale = () => json({ error: 'Someone changed this gathering. Reload to see their changes before saving.' }, 409)

export async function gatheringsRoute(request: Request, env: Env, email: string): Promise<Response> {
  const path = new URL(request.url).pathname
  if (path === '/api/gatherings' && request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM gatherings ORDER BY start_date, id').all<GatheringRow>()
    return json(rows.results.map(publicGathering))
  }
  if (path === '/api/gatherings' && request.method === 'POST') {
    return json({ error: 'Family gatherings can no longer be created. Plan an individual stay instead.' }, 410)
  }
  const match = /^\/api\/gatherings\/([0-9a-f-]{36})$/.exec(path)
  if (!match || !['PUT', 'DELETE'].includes(request.method)) return json({ error: 'Not found.' }, 404)
  if (request.method === 'PUT') return json({ error: 'Gathering editing has been retired. Edit individual stays instead.' }, 410)
  const id = match[1]
  const old = await env.DB.prepare('SELECT * FROM gatherings WHERE id = ?').bind(id).first<GatheringRow>()
  if (!old) return json({ error: 'Gathering not found.' }, 404)
  const incoming = await body(request)
  const version = incoming && typeof incoming === 'object' && 'version' in incoming ? incoming.version : undefined
  if (!Number.isSafeInteger(version) || (version as number) < 1) return json({ error: 'Include the gathering version.' }, 400)
  if (version !== old.version) return stale()

  if (request.method === 'DELETE') {
    if (!canDelete(env, email, old.created_by)) return json({ error: 'Only the person who added this gathering or the family administrator may remove it.' }, 403)
    // Clear dormant recurrence metadata when removing a saved series record.
    // Plans people added stay on the calendar as their own stays.
    const [, removed] = await env.DB.batch([
      env.DB.prepare('UPDATE gatherings SET repeats = 0, version = version + 1, updated_at = ?, updated_by = ? WHERE series_id = ? AND id != ? AND repeats != 0 AND EXISTS (SELECT 1 FROM gatherings WHERE id = ? AND version = ?)')
        .bind(new Date().toISOString(), email, old.series_id, id, id, version),
      env.DB.prepare('DELETE FROM gatherings WHERE id = ? AND version = ?').bind(id, version)
    ])
    return removed.meta.changes ? new Response(null, { status: 204 }) : stale()
  }

  return json({ error: 'Not found.' }, 404)
}
