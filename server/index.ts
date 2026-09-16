import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { existsSync } from 'node:fs'
import {
  deleteTripForUser,
  listTripsForUser,
  loginUser,
  logoutSession,
  registerUser,
  saveTripForUser,
  userFromToken,
} from './db/auth'
import { closeDb, dbConfigured, migrate } from './db/client'
import { getUserSettings, upsertUserSettings } from './db/settings'
import { generatePlan } from './generate'
import { llmConfigured } from './llm'
import { nearbyIndiaDestinations } from '../shared/india'
import type { GenerateRequest, LlmProvider, TravelMode, TripPlan } from '../shared/types'

const app = new Hono()
const port = Number(process.env.PORT || 8787)
const isProd = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = 'tp_session'

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
  }),
)

function publicUser(user: { id: string; email: string; name: string; created_at: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  }
}

app.get('/api/health', (c) =>
  c.json({
    ok: true as const,
    llm: llmConfigured(),
    routing: 'osrm' as const,
    places: 'overpass' as const,
    database: dbConfigured(),
    regionFocus: 'india' as const,
  }),
)

app.get('/api/nearby', (c) => {
  const lat = Number(c.req.query('lat'))
  const lon = Number(c.req.query('lon'))
  const mode = (c.req.query('mode') as TravelMode | undefined) || 'car'
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return c.json({ error: 'lat and lon are required' }, 400)
  }
  return c.json({
    destinations: nearbyIndiaDestinations(lat, lon, { mode, limit: 8 }),
  })
})

app.post('/api/generate', async (c) => {
  let body: GenerateRequest
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const notes = body.notes?.trim() ?? ''
  if (notes.length < 8) {
    return c.json({ error: 'Drop a few more trip details before generating.' }, 400)
  }

  try {
    let credentials = null
    if (dbConfigured()) {
      const token = getCookie(c, SESSION_COOKIE)
      const user = await userFromToken(token)
      if (user) {
        const settings = await getUserSettings(user.id)
        const provider = settings.public.preferredProvider
        const key = settings.keys[provider]
        if (key) {
          credentials = {
            provider,
            apiKey: key,
            model: settings.public.preferredModel,
          }
        }
      }
    }

    const plan = await generatePlan(
      {
        notes,
        mode: body.mode,
        location: body.location,
        destinationHint: body.destinationHint,
      },
      { credentials },
    )
    return c.json({ plan })
  } catch (err) {
    console.error('[api/generate]', err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Failed to generate itinerary' },
      500,
    )
  }
})

app.get('/api/settings', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  if (!user) return c.json({ error: 'Sign in required' }, 401)
  const settings = await getUserSettings(user.id)
  return c.json({ settings: settings.public })
})

app.put('/api/settings', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  if (!user) return c.json({ error: 'Sign in required' }, 401)
  try {
    const body = await c.req.json<{
      preferredProvider?: LlmProvider
      preferredModel?: string
      preferredMode?: TravelMode
      homeCity?: string | null
      keys?: Partial<Record<LlmProvider, string>>
    }>()
    const settings = await upsertUserSettings(user.id, body)
    return c.json({ settings })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Could not save settings' }, 400)
  }
})

app.post('/api/auth/register', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  try {
    const body = await c.req.json<{ email?: string; password?: string; name?: string }>()
    const { user, token } = await registerUser({
      email: body.email ?? '',
      password: body.password ?? '',
      name: body.name,
    })
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
    })
    return c.json({ user: publicUser(user) })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Registration failed' }, 400)
  }
})

app.post('/api/auth/login', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  try {
    const body = await c.req.json<{ email?: string; password?: string }>()
    const { user, token } = await loginUser({
      email: body.email ?? '',
      password: body.password ?? '',
    })
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
    })
    return c.json({ user: publicUser(user) })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Login failed' }, 401)
  }
})

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (dbConfigured()) await logoutSession(token)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  if (!dbConfigured()) return c.json({ user: null, database: false })
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  return c.json({ user: user ? publicUser(user) : null, database: true })
})

app.get('/api/trips', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  if (!user) return c.json({ error: 'Sign in to view saved trips' }, 401)
  const trips = await listTripsForUser(user.id)
  return c.json({
    trips: trips.map((t) => ({
      id: t.id,
      planId: t.plan_id,
      title: t.title,
      plan: t.plan,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  })
})

app.post('/api/trips', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  if (!user) return c.json({ error: 'Sign in to save trips' }, 401)
  try {
    const body = await c.req.json<{ plan?: TripPlan }>()
    if (!body.plan?.id || !body.plan?.title) {
      return c.json({ error: 'Missing plan payload' }, 400)
    }
    const row = await saveTripForUser(user.id, body.plan)
    return c.json({
      trip: {
        id: row.id,
        planId: row.plan_id,
        title: row.title,
        plan: row.plan,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Save failed' }, 500)
  }
})

app.delete('/api/trips/:planId', async (c) => {
  if (!dbConfigured()) return c.json({ error: 'DATABASE_URL is not configured' }, 503)
  const token = getCookie(c, SESSION_COOKIE)
  const user = await userFromToken(token)
  if (!user) return c.json({ error: 'Sign in required' }, 401)
  await deleteTripForUser(user.id, c.req.param('planId'))
  return c.json({ ok: true })
})

if (isProd && existsSync('dist')) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ root: './dist', path: 'index.html' }))
}

async function boot() {
  if (dbConfigured()) {
    try {
      await migrate()
      console.log('[tripplanner] PostgreSQL connected · migrations applied')
    } catch (err) {
      console.error('[tripplanner] PostgreSQL migrate failed:', err)
    }
  } else {
    console.warn('[tripplanner] DATABASE_URL missing · auth/cloud saves disabled until Postgres is linked')
  }

  console.log(
    `[tripplanner] API on http://127.0.0.1:${port} · llm=${llmConfigured() ? 'on' : 'off'} · routing=osrm · places=overpass · db=${dbConfigured() ? 'postgres' : 'off'}`,
  )

  serve({ fetch: app.fetch, port })
}

boot().catch(async (err) => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
