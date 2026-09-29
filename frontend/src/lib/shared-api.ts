export const sharedBackend = process.env.NEXT_PUBLIC_SHARED_BACKEND === '1'

export async function apiRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store'
  })
  if (response.status === 204) return undefined as T
  let payload: unknown
  try { payload = await response.json() } catch { throw new Error(`Server returned ${response.status}.`) }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error : `Server returned ${response.status}.`
    throw new Error(message)
  }
  return payload as T
}
