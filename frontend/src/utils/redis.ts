/**
 * REDIS NOTES
 * Cache syntax
 * - Comments: "comments-{bookingID}"
 * - Events: "events-{bookingID}"
 * - Users: "users-{userId}"
 */

import { Redis } from 'ioredis'

const getRedisURL = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  throw new Error('Redis URL is not defined.')
}

export const redis = new Redis(getRedisURL())