import type { Env } from './env.ts'
import { json } from './http.ts'
import { bookingsRoute } from './routes/bookings.ts'
import { careRoute, readCollection } from './routes/care.ts'
import { gatheringsRoute } from './routes/gatherings.ts'
import { canManageMembers, membersRoute } from './routes/members.ts'

/** Called only after the Worker verifies Cloudflare Access identity. */
export async function api(request: Request, env: Env, email: string): Promise<Response> {
  const path = new URL(request.url).pathname
  if (path === '/api/me' && request.method === 'GET') return json({ email, canManageMembers: canManageMembers(env, email) })
  if (path === '/api/members') return membersRoute(request, env, email)
  if (path === '/api/care') {
    // Older tabs may still read the combined document. Never accept a stale bulk overwrite.
    if (request.method === 'GET') {
      const [tasks, articles] = await Promise.all([
        readCollection(env.DB, 'tasks'), readCollection(env.DB, 'pages')
      ])
      return json({ revision: 0, data: { version: 1, tasks, articles } })
    }
    return json({ error: 'The cabin app has been updated. Reload before saving.' }, 409)
  }
  if (path === '/api/bookings' || path.startsWith('/api/bookings/')) return bookingsRoute(request, env, email)
  if (path === '/api/gatherings' || path.startsWith('/api/gatherings/')) return gatheringsRoute(request, env, email)
  if (/^\/api\/(tasks|pages)(\/|$)/.test(path)) return careRoute(request, env, email)
  return json({ error: 'Not found.' }, 404)
}
