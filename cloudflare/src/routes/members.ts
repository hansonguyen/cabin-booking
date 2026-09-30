import type { Env } from '../env.ts'
import { body, json } from '../http.ts'

import { isAdmin } from '../permissions.ts'
import { savedMemberColor } from '../member-colors.ts'

export const canManageMembers = isAdmin

export async function membersRoute(request: Request, env: Env, email: string): Promise<Response> {
  if (request.method === 'GET') {
    const rows = await env.DB.prepare(`
      WITH emails AS (
        SELECT email FROM member_profiles
        UNION SELECT email FROM member_colors
        UNION SELECT owner_email FROM bookings
        UNION SELECT lower(assignee) FROM tasks WHERE instr(assignee, '@') > 0
        UNION SELECT lower(author) FROM book_pages WHERE instr(author, '@') > 0
        UNION SELECT lower(created_by) FROM gatherings WHERE instr(created_by, '@') > 0
        UNION SELECT ?
      )
      SELECT emails.email, COALESCE(p.display_name, '') AS displayName,
        COALESCE(p.version, 0) AS version, c.color
      FROM emails LEFT JOIN member_profiles p ON p.email = emails.email
      LEFT JOIN member_colors c ON c.email = emails.email
      ORDER BY COALESCE(NULLIF(p.display_name, ''), emails.email) COLLATE NOCASE
    `).bind(email).all<{ email: string; displayName: string; version: number; color: string | null }>()
    const directory = []
    for (const row of rows.results) directory.push({ ...row, color: row.color ?? await savedMemberColor(env.DB, row.email) })
    return json(directory)
  }
  if (request.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405)
  if (!canManageMembers(env, email)) return json({ error: 'Only the family administrator can assign names.' }, 403)
  const input = await body(request)
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Invalid request.' }, 400)
  const value = input as Record<string, unknown>
  const address = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  const name = typeof value.displayName === 'string' ? value.displayName.trim() : ''
  if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return json({ error: 'Enter a valid email address.' }, 400)
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) return json({ error: 'Enter a name of 1–80 characters.' }, 400)
  if (!Number.isSafeInteger(value.version) || (value.version as number) < 0) return json({ error: 'Include the current name version.' }, 400)
  const now = new Date().toISOString()
  const row = value.version === 0
    ? await env.DB.prepare(`INSERT INTO member_profiles (email, display_name, updated_at, updated_by)
        VALUES (?, ?, ?, ?) ON CONFLICT(email) DO NOTHING
        RETURNING email, display_name AS displayName, version`).bind(address, name, now, email).first()
    : await env.DB.prepare(`UPDATE member_profiles SET display_name = ?, updated_at = ?, updated_by = ?, version = version + 1
        WHERE email = ? AND version = ? RETURNING email, display_name AS displayName, version`)
        .bind(name, now, email, address, value.version).first()
  return row ? json({ ...row, color: await savedMemberColor(env.DB, address) }) : json({ error: 'This name changed in another tab. Reload before saving.' }, 409)
}
