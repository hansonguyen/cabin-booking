/** Saved shared colors use this palette; preview/fallback identities use a stable hash. */
export const memberPalette = ['green', 'blue', 'plum', 'gold', 'teal', 'rose', 'indigo', 'olive', 'slate', 'cocoa'] as const
export type MemberColor = typeof memberPalette[number]

export function preferredMemberColor(id: string): MemberColor {
  let hash = 2166136261
  for (const ch of id.trim().toLowerCase()) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619)
  return memberPalette[(hash >>> 0) % memberPalette.length]
}
