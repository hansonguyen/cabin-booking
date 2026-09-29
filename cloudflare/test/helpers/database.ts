import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { api } from '../../src/api.ts'
import type { Env } from '../../src/env.ts'

// Run the real route SQL on SQLite with transactional D1 batch semantics.
export function setup(legacy = { version: 1, tasks: [] as object[], articles: [] as object[] }) {
  const sql = new DatabaseSync(':memory:')
  sql.exec('PRAGMA foreign_keys = ON')
  for (const file of ['0001_initial.sql', '0002_care.sql']) sql.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), 'utf8'))
  sql.prepare('UPDATE cabin_care SET data = ? WHERE id = 1').run(JSON.stringify(legacy))
  sql.exec(readFileSync(new URL('../../migrations/0003_list_and_book.sql', import.meta.url), 'utf8'))
  sql.exec(readFileSync(new URL('../../migrations/0004_member_names.sql', import.meta.url), 'utf8'))
  sql.exec(readFileSync(new URL('../../migrations/0005_item_creators.sql', import.meta.url), 'utf8'))
  sql.exec(readFileSync(new URL('../../migrations/0006_gatherings.sql', import.meta.url), 'utf8'))
  function prepare(query: string) {
    let args: any[] = []
    return {
      bind(...values: any[]) { args = values; return this },
      async first() { return sql.prepare(query).get(...args) ?? null },
      async all() { return { results: sql.prepare(query).all(...args) } },
      async run() { return { meta: { changes: Number(sql.prepare(query).run(...args).changes) } } }
    }
  }
  const env = { DB: {
    prepare,
    async batch(statements: ReturnType<typeof prepare>[]) {
      sql.exec('BEGIN')
      try {
        const results = []
        for (const statement of statements) results.push(await statement.run())
        sql.exec('COMMIT')
        return results
      } catch (error) { sql.exec('ROLLBACK'); throw error }
    }
  } } as unknown as Env
  async function call(path: string, method = 'GET', data?: unknown, email = 'host@example.com') {
    const response = await api(new Request(`https://cabin.test/api${path}`, {
      method, body: data === undefined ? undefined : JSON.stringify(data)
    }), env, email)
    return { status: response.status, data: response.status === 204 ? null : await response.json() as any }
  }
  return { sql, call, env }
}
