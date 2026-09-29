import { verifiedEmail } from './auth.ts'
import type { Env } from './env.ts'
import { json } from './http.ts'
import { api } from './api.ts'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return json({ error: 'Access is not configured.' }, 503)
    const email = await verifiedEmail(request, env)
    if (!email) return json({ error: 'Sign in required.' }, 401)
    if (new URL(request.url).pathname.startsWith('/api/')) {
      try { return await api(request, env, email) }
      catch (error) {
        if (error instanceof SyntaxError) return json({ error: 'Invalid JSON.' }, 400)
        if (error instanceof Error && error.message === 'Request too large.') return json({ error: error.message }, 413)
        console.error('Cabin API request failed', error)
        return json({ error: 'Could not complete the request.' }, 500)
      }
    }
    return env.ASSETS.fetch(request)
  }
} satisfies ExportedHandler<Env>
