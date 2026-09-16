import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { getDb } from './client'

export type UserRow = {
  id: string
  email: string
  name: string
  created_at: Date
}

const SESSION_DAYS = 30

function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 64)
  const prev = Buffer.from(hash, 'hex')
  if (prev.length !== next.length) return false
  return timingSafeEqual(prev, next)
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function registerUser(input: {
  email: string
  password: string
  name?: string
}): Promise<{ user: UserRow; token: string }> {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  if (!email.includes('@') || password.length < 8) {
    throw new Error('Use a valid email and a password with at least 8 characters')
  }

  const db = getDb()
  const passwordHash = hashPassword(password)
  const name = input.name?.trim() || email.split('@')[0]

  let user: UserRow
  try {
    const rows = await db<UserRow[]>`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name, created_at
    `
    user = rows[0]
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('users_email_key') || message.includes('unique')) {
      throw new Error('An account with that email already exists')
    }
    throw err
  }

  const token = await createSession(user.id)
  return { user, token }
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<{ user: UserRow; token: string }> {
  const email = input.email.trim().toLowerCase()
  const db = getDb()
  const rows = await db<{ id: string; email: string; name: string; created_at: Date; password_hash: string }[]>`
    SELECT id, email, name, created_at, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `
  const row = rows[0]
  if (!row || !verifyPassword(input.password, row.password_hash)) {
    throw new Error('Invalid email or password')
  }
  const user: UserRow = {
    id: row.id,
    email: row.email,
    name: row.name,
    created_at: row.created_at,
  }
  const token = await createSession(user.id)
  return { user, token }
}

async function createSession(userId: string): Promise<string> {
  const db = getDb()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `
  return token
}

export async function logoutSession(token: string | undefined): Promise<void> {
  if (!token) return
  const db = getDb()
  await db`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`
}

export async function userFromToken(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null
  const db = getDb()
  const rows = await db<UserRow[]>`
    SELECT u.id, u.email, u.name, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.expires_at > now()
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function saveTripForUser(userId: string, plan: unknown & { id: string; title: string }) {
  const db = getDb()
  const rows = await db`
    INSERT INTO trips (user_id, plan_id, title, plan, updated_at)
    VALUES (${userId}, ${plan.id}, ${plan.title}, ${db.json(plan as never)}, now())
    ON CONFLICT (user_id, plan_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      plan = EXCLUDED.plan,
      updated_at = now()
    RETURNING id, plan_id, title, plan, created_at, updated_at
  `
  return rows[0]
}

export async function listTripsForUser(userId: string) {
  const db = getDb()
  return db`
    SELECT id, plan_id, title, plan, created_at, updated_at
    FROM trips
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT 50
  `
}

export async function deleteTripForUser(userId: string, planId: string) {
  const db = getDb()
  await db`
    DELETE FROM trips
    WHERE user_id = ${userId} AND plan_id = ${planId}
  `
}
