import type { Env } from '../env.ts'
import { body, json } from '../http.ts'
import { validCare } from '../care.ts'
import { canDelete } from '../permissions.ts'

type Kind = 'tasks' | 'pages'
type RecordData = Record<string, unknown>
const tables = { tasks: 'tasks', pages: 'book_pages' } as const
const columns = {
  tasks: ['title', 'category', 'notes', 'assignee', 'status', 'priority'],
  pages: ['title', 'topic', 'problem', 'solution', 'tags']
} as const
const isObject = (value: unknown): value is RecordData => !!value && typeof value === 'object' && !Array.isArray(value)
const stale = () => json({ error: 'Someone changed this item. Reload to see their changes before saving.' }, 409)

function publicRecord(kind: Kind, row: RecordData): RecordData {
  const result: RecordData = { id: row.id, version: row.version, updatedAt: row.updated_at, createdBy: row.created_by ?? null }
  for (const key of columns[kind]) result[key] = row[key]
  if (kind === 'pages') {
    result.author = row.author
    result.verified = Boolean(row.verified)
  } else {
    result.updatedBy = row.updated_by
    result.completedAt = row.completed_at
    result.completedBy = row.completed_by
  }
  return result
}

export async function readCollection(db: D1Database, kind: Kind) {
  const rows = await db.prepare(`SELECT * FROM ${tables[kind]} ORDER BY updated_at DESC, id`).all<RecordData>()
  return rows.results.map(row => publicRecord(kind, row))
}

export async function careRoute(request: Request, env: Env, email: string): Promise<Response> {
  const match = /^\/api\/(tasks|pages)(?:\/([^/]+))?$/.exec(new URL(request.url).pathname)
  if (!match) return json({ error: 'Not found.' }, 404)
  const kind = match[1] as Kind
  const table = tables[kind]
  const id = match[2] ? decodeURIComponent(match[2]) : undefined
  if (request.method === 'GET' && !id) return json(await readCollection(env.DB, kind))
  if ((!id && request.method !== 'POST') || (id && !['GET', 'PUT', 'PATCH', 'DELETE'].includes(request.method))) {
    return json({ error: 'Method not allowed.' }, 405)
  }
  const old = id ? await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<RecordData>() : null
  if (id && !old) return json({ error: 'Item not found.' }, 404)
  if (request.method === 'GET') return json(publicRecord(kind, old!))
  const incoming = await body(request)
  if (!isObject(incoming)) return json({ error: 'Invalid request.' }, 400)
  if (id && (!Number.isSafeInteger(incoming.version) || (incoming.version as number) < 1)) {
    return json({ error: 'Include the item version when changing or deleting it.' }, 400)
  }
  if (old && incoming.version !== old.version) return stale()
  if (request.method === 'DELETE') {
    if (!canDelete(env, email, old!.created_by)) return json({ error: 'Only the creator or family administrator may delete this item.' }, 403)
    const removed = await env.DB.prepare(`DELETE FROM ${table} WHERE id = ? AND version = ?`).bind(id, incoming.version).run()
    return removed.meta.changes ? new Response(null, { status: 204 }) : stale()
  }
  const next = request.method === 'PATCH' ? { ...publicRecord(kind, old!), ...incoming } : incoming
  const recordId = id ?? next.id
  if (typeof recordId !== 'string' || !recordId || recordId.length > 100) return json({ error: 'Provide an item ID of 1–100 characters.' }, 400)
  const now = new Date().toISOString()
  const value: RecordData = { id: recordId }
  for (const key of columns[kind]) value[key] = next[key]
  if (typeof value.title === 'string') value.title = value.title.trim()
  if (kind === 'pages') Object.assign(value, { author: email, updatedAt: now, verified: next.verified })
  const data = { version: 1, tasks: kind === 'tasks' ? [value] : [], articles: kind === 'pages' ? [value] : [] }
  if (!validCare(data)) return json({ error: 'Check the title, category, and required details.' }, 400)
  const fields: string[] = [...columns[kind]]
  const values: unknown[] = fields.map(key => value[key])
  fields.push('updated_at')
  values.push(now)
  if (kind === 'pages') {
    fields.push('author', 'verified')
    values.push(email, Number(next.verified))
  } else {
    fields.push('updated_by', 'completed_at', 'completed_by')
    const done = value.status === 'Done'
    const wasDone = old?.status === 'Done'
    values.push(email, done ? (wasDone ? old.completed_at : now) : null, done ? (wasDone ? old.completed_by : email) : null)
  }
  if (!old) {
    fields.push('created_by')
    values.push(email)
  }
  try {
    const row = old
      ? await env.DB.prepare(`UPDATE ${table} SET ${fields.map(field => `${field} = ?`).join(', ')}, version = version + 1 WHERE id = ? AND version = ? RETURNING *`)
          .bind(...values, id, incoming.version).first<RecordData>()
      : await env.DB.prepare(`INSERT INTO ${table} (id, ${fields.join(', ')}) SELECT ${['?', ...fields.map(() => '?')].join(', ')} WHERE (SELECT COUNT(*) FROM ${table}) < 500 RETURNING *`)
          .bind(recordId, ...values).first<RecordData>()
    if (!row) return old ? stale() : json({ error: 'The 500-item limit has been reached.' }, 409)
    return json(publicRecord(kind, row), old ? 200 : 201)
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) return json({ error: 'That item already exists. Reload before saving.' }, 409)
    throw error
  }
}
