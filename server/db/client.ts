import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))

let sql: ReturnType<typeof postgres> | null = null

export function databaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null
}

export function dbConfigured(): boolean {
  return Boolean(databaseUrl())
}

export function getDb() {
  const url = databaseUrl()
  if (!url) {
    throw new Error('DATABASE_URL is required for auth and cloud trip storage')
  }
  if (!sql) {
    sql = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
      ssl:
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('railway.internal') ||
      process.env.PGSSLMODE === 'disable'
        ? false
        : 'require',
    })
  }
  return sql
}

export async function migrate(): Promise<void> {
  const db = getDb()
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  await db.unsafe(schema)
}

export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 })
    sql = null
  }
}
