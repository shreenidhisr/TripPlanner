import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync } from 'node:fs'
import { generatePlan } from './generate'
import { llmConfigured } from './llm'

const app = new Hono()
const port = Number(process.env.PORT || 8787)
const isProd = process.env.NODE_ENV === 'production'

app.use('/api/*', cors())

app.get('/api/health', (c) =>
  c.json({
    ok: true as const,
    llm: llmConfigured(),
    routing: 'osrm' as const,
  }),
)

app.post('/api/generate', async (c) => {
  let body: { notes?: string }
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
    const plan = await generatePlan(notes)
    return c.json({ plan })
  } catch (err) {
    console.error('[api/generate]', err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Failed to generate itinerary' },
      500,
    )
  }
})

if (isProd && existsSync('dist')) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ root: './dist', path: 'index.html' }))
}

console.log(
  `[tripplanner] API on http://127.0.0.1:${port} · llm=${llmConfigured() ? 'on' : 'off'} · routing=osrm`,
)

serve({ fetch: app.fetch, port })
