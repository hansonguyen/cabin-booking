import { createRemoteJWKSet, jwtVerify } from 'jose'

export type AccessConfig = { ACCESS_TEAM_DOMAIN: string; ACCESS_AUD: string }
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export async function verifiedEmail(request: Request, config: AccessConfig): Promise<string | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token || !config.ACCESS_AUD || !config.ACCESS_TEAM_DOMAIN) return null
  const team = config.ACCESS_TEAM_DOMAIN.replace(/^https:\/\//, '').replace(/\/$/, '')
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team)) return null
  let keys = keySets.get(team)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`))
    keySets.set(team, keys)
  }
  return emailFromToken(token, config.ACCESS_AUD, team, keys)
}

export async function emailFromToken(token: string, audience: string, team: string, keys: Parameters<typeof jwtVerify>[1]): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://${team}`,
      audience,
      algorithms: ['RS256']
    })
    if (payload.type !== 'app' || typeof payload.email !== 'string') return null
    const email = payload.email.trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
  } catch {
    return null
  }
}
