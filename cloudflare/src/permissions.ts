import type { Env } from './env.ts'

export const isAdmin = (env: Env, email: string) =>
  Boolean(env.ADMIN_EMAIL && email === env.ADMIN_EMAIL.trim().toLowerCase())

export const canDelete = (env: Env, email: string, creator: unknown) =>
  isAdmin(env, email) || Boolean(email && creator === email)
