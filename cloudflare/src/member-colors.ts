import { memberPalette, preferredMemberColor, type MemberColor } from '../../frontend/src/lib/member-colors.ts'

/** Allocation is one SQL statement: simultaneous first visits see the latest color counts. */
export async function savedMemberColor(db: D1Database, email: string): Promise<MemberColor> {
  const existing = await db.prepare('SELECT color FROM member_colors WHERE email = ?').bind(email).first<{ color: MemberColor }>()
  if (existing) return existing.color
  const palette = memberPalette.map((color, i) => `('${color}', ${i})`).join(', ')
  const assigned = await db.prepare(`
    WITH palette(color, position) AS (VALUES ${palette})
    INSERT OR IGNORE INTO member_colors (email, color)
    SELECT ?, color FROM palette
    ORDER BY (SELECT COUNT(*) FROM member_colors WHERE member_colors.color = palette.color),
      (position - ? + ${memberPalette.length}) % ${memberPalette.length}
    LIMIT 1 RETURNING color
  `).bind(email, memberPalette.indexOf(preferredMemberColor(email))).first<{ color: MemberColor }>()
  // A concurrent request for the same email may have inserted first. Always use its saved choice.
  const row = assigned ?? await db.prepare('SELECT color FROM member_colors WHERE email = ?').bind(email).first<{ color: MemberColor }>()
  if (!row) throw new Error('Could not assign a member color.')
  return row.color
}
