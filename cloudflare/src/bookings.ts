export type BookingInput = {
  title: string
  start: string
  end: string
  guests: number
  names: string
  notes: string
  open: boolean
  gatheringId: string | null
}

export function parseBookingInput(value: unknown, today = new Date().toISOString().slice(0, 10)): BookingInput | string {
  if (!value || typeof value !== 'object') return 'Invalid booking.'
  const b = value as Record<string, unknown>
  if (typeof b.title !== 'string' || !b.title.trim() || b.title.length > 80) return 'Use a trip title of 1–80 characters.'
  if (typeof b.start !== 'string' || typeof b.end !== 'string' || !validDate(b.start) || !validDate(b.end)) return 'Choose valid dates.'
  if (b.start < today) return 'Arrival must be today or later.'
  if (b.end <= b.start) return 'Departure must be after arrival.'
  if (nightsBetween(b.start, b.end) > 60) return 'A stay cannot exceed 60 nights.'
  if (typeof b.guests !== 'number' || !Number.isInteger(b.guests) || b.guests < 1 || b.guests > 30) return 'Choose 1–30 people.'
  if (typeof b.names !== 'string' || b.names.length > 300 || typeof b.notes !== 'string' || b.notes.length > 2000 || typeof b.open !== 'boolean') return 'Check guest names and notes.'
  const gatheringId = b.gatheringId ?? null
  if (gatheringId !== null && (typeof gatheringId !== 'string' || !/^[0-9a-f-]{36}$/.test(gatheringId))) return 'Choose a valid gathering.'
  return { title: b.title.trim(), start: b.start, end: b.end, guests: b.guests, names: b.names, notes: b.notes, open: b.open, gatheringId }
}

export type GatheringInput = { title: string; start: string; end: string; notes: string; repeats: boolean }

export function parseGatheringInput(value: unknown, today = new Date().toISOString().slice(0, 10)): GatheringInput | string {
  if (!value || typeof value !== 'object') return 'Invalid gathering.'
  const g = value as Record<string, unknown>
  if (typeof g.title !== 'string' || !g.title.trim() || g.title.trim().length > 80) return 'Give the gathering a name of 1–80 characters.'
  if (typeof g.start !== 'string' || typeof g.end !== 'string' || !validDate(g.start) || !validDate(g.end)) return 'Choose valid dates.'
  if (g.start < today) return 'A gathering must start today or later.'
  if (g.end <= g.start) return 'The last day must be after the first.'
  if (nightsBetween(g.start, g.end) > 21) return 'A gathering cannot exceed 21 nights.'
  if (typeof g.notes !== 'string' || g.notes.length > 2000 || typeof g.repeats !== 'boolean') return 'Check the notes.'
  return { title: g.title.trim(), start: g.start, end: g.end, notes: g.notes.trim(), repeats: g.repeats }
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function nightsBetween(start: string, end: string): number {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000
}
