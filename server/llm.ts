import type { FoodPreference, LlmProvider, RouteRegion, TravelMode, TripIntent } from '../shared/types'

export type LlmDraft = {
  title: string
  subtitle: string
  intent: {
    days: number
    startCity: string
    endCity: string | null
    themes: string[]
    food: FoodPreference
    region: RouteRegion
    mode?: TravelMode
  }
  waypoints: Array<{
    name: string
    vibe: string
    activity: string
  }>
  tips: string[]
}

export type LlmCredentials = {
  provider: LlmProvider
  apiKey: string
  model?: string
}

const INDIA_SYSTEM = `You are TripPlanner, an expert India trip designer for car, bike, bus, and train travel.
Turn messy trip notes into a practical multi-day itinerary focused on India.
Return ONLY valid JSON matching the schema. No markdown.
Rules:
- Prefer real Indian cities, hill stations, and heritage towns
- days between 1 and 14
- waypoints length MUST equal days + 1
- respect travel mode:
  - car: scenic highway legs, usually under 6 hours/day
  - bike: shorter days, under 4-5 hours, avoid extreme highways when possible
  - bus: city-to-city legs with depot-friendly overnight bases
  - train: overnight or day trains between major junctions when sensible
- region must be one of: north_india, west_india, south_india, east_india, himalayas, generic
- food must be one of: vegetarian, vegan, seafood, local, any
- include booking-aware tips for IRCTC / redBus when mode is train/bus`

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return JSON.parse(trimmed)
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in model response')
  return JSON.parse(match[0])
}

function defaultModel(provider: LlmProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-5-sonnet-latest'
    case 'gemini':
      return 'gemini-2.0-flash'
    case 'groq':
      return 'llama-3.3-70b-versatile'
    case 'openrouter':
      return 'openai/gpt-4o-mini'
    default:
      return 'gpt-4o-mini'
  }
}

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function userPrompt(notes: string, mode: TravelMode, locationLabel?: string) {
  return `Travel mode: ${mode}
${locationLabel ? `User location context: ${locationLabel}\n` : ''}Trip notes:
"""${notes}"""

JSON schema:
${JSON.stringify(
  {
    title: 'string',
    subtitle: 'string',
    intent: {
      days: 'number',
      startCity: 'City, ST',
      endCity: 'City, ST|null',
      themes: ['string'],
      food: 'vegetarian|vegan|seafood|local|any',
      region: 'north_india|west_india|south_india|east_india|himalayas|generic',
      mode: 'car|bike|bus|train',
    },
    waypoints: [{ name: 'City, ST', vibe: 'string', activity: 'string' }],
    tips: ['string'],
  },
  null,
  2,
)}`
}

async function callOpenAiCompatible(opts: {
  url: string
  apiKey: string
  model: string
  notes: string
  mode: TravelMode
  locationLabel?: string
  extraHeaders?: Record<string, string>
}): Promise<string> {
  const res = await fetch(opts.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      ...opts.extraHeaders,
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INDIA_SYSTEM },
        { role: 'user', content: userPrompt(opts.notes, opts.mode, opts.locationLabel) },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    throw new Error(`LLM error ${res.status}: ${(await res.text()).slice(0, 240)}`)
  }
  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty LLM response')
  return content
}

async function callAnthropic(opts: {
  apiKey: string
  model: string
  notes: string
  mode: TravelMode
  locationLabel?: string
}): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2500,
      temperature: 0.4,
      system: INDIA_SYSTEM,
      messages: [{ role: 'user', content: userPrompt(opts.notes, opts.mode, opts.locationLabel) }],
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    throw new Error(`Anthropic error ${res.status}: ${(await res.text()).slice(0, 240)}`)
  }
  const payload = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const text = payload.content?.find((c) => c.type === 'text')?.text
  if (!text) throw new Error('Empty Anthropic response')
  return text
}

async function callGemini(opts: {
  apiKey: string
  model: string
  notes: string
  mode: TravelMode
  locationLabel?: string
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${encodeURIComponent(opts.apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${INDIA_SYSTEM}\n\n${userPrompt(opts.notes, opts.mode, opts.locationLabel)}` }],
        },
      ],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 240)}`)
  }
  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text
}

export async function draftWithLlm(
  notes: string,
  opts: {
    mode: TravelMode
    locationLabel?: string
    credentials?: LlmCredentials | null
  },
): Promise<{ draft: LlmDraft; model: string; provider: LlmProvider } | null> {
  const credentials =
    opts.credentials ??
    (process.env.OPENAI_API_KEY?.trim()
      ? {
          provider: 'openai' as const,
          apiKey: process.env.OPENAI_API_KEY.trim(),
          model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        }
      : null)
  if (!credentials?.apiKey) return null

  const provider = credentials.provider
  const model = credentials.model?.trim() || defaultModel(provider)
  let content = ''

  if (provider === 'anthropic') {
    content = await callAnthropic({
      apiKey: credentials.apiKey,
      model,
      notes,
      mode: opts.mode,
      locationLabel: opts.locationLabel,
    })
  } else if (provider === 'gemini') {
    content = await callGemini({
      apiKey: credentials.apiKey,
      model,
      notes,
      mode: opts.mode,
      locationLabel: opts.locationLabel,
    })
  } else if (provider === 'groq') {
    content = await callOpenAiCompatible({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: credentials.apiKey,
      model,
      notes,
      mode: opts.mode,
      locationLabel: opts.locationLabel,
    })
  } else if (provider === 'openrouter') {
    content = await callOpenAiCompatible({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: credentials.apiKey,
      model,
      notes,
      mode: opts.mode,
      locationLabel: opts.locationLabel,
      extraHeaders: {
        'HTTP-Referer': 'https://tripplanner.app',
        'X-Title': 'TripPlanner',
      },
    })
  } else {
    content = await callOpenAiCompatible({
      url: 'https://api.openai.com/v1/chat/completions',
      apiKey: credentials.apiKey,
      model,
      notes,
      mode: opts.mode,
      locationLabel: opts.locationLabel,
    })
  }

  const draft = extractJson(content) as LlmDraft
  if (!draft?.intent?.days || !Array.isArray(draft.waypoints)) {
    throw new Error('Invalid LLM draft shape')
  }
  return { draft, model, provider }
}

export function llmDraftToIntent(notes: string, draft: LlmDraft, mode: TravelMode): TripIntent {
  return {
    days: Math.min(14, Math.max(1, Number(draft.intent.days) || 5)),
    startCity: draft.intent.startCity || draft.waypoints[0]?.name || 'Mumbai, MH',
    endCity: draft.intent.endCity,
    themes: draft.intent.themes?.length ? draft.intent.themes : ['scenic'],
    food: draft.intent.food || 'any',
    raw: notes,
    region: draft.intent.region || 'west_india',
    mode: draft.intent.mode || mode,
  }
}
