export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
})


export async function body(request: Request): Promise<unknown> {
  const text = await request.text()
  if (text.length > 500_000) throw new Error('Request too large.')
  return JSON.parse(text)
}
