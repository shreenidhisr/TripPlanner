import type { FoodPreference, TripIntent, RouteRegion } from '../shared/types'

type LlmDraft = {
  title: string
  subtitle: string
  intent: {
    days: number
    startCity: string
    endCity: string | null
    themes: string[]
    food: FoodPreference
    region: RouteRegion
  }
  waypoints: Array<{
    name: string
    vibe: string
    activity: string
  }>
  tips: string[]
}

const SYSTEM = `You are TripPlanner, an expert US road-trip designer.
Turn messy trip notes into a practical multi-day driving itinerary.
Return ONLY valid JSON matching the schema. No markdown.
Rules:
- days between 1 and 14
- waypoints length MUST equal days + 1 (start through end, one overnight base progression)
- keep daily driving realistic (usually under 5 hours)
- honor food preferences in tips
- region must be one of: pacific_coast, southwest, rockies, northeast, southeast, midwest, generic
- food must be one of: vegetarian, vegan, seafood, local, any
- use real place names in the United States`

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return JSON.parse(trimmed)
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in model response')
  return JSON.parse(match[0])
}

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export async function draftWithLlm(notes: string): Promise<{
  draft: LlmDraft
  model: string
} | null> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Trip notes:\n"""${notes}"""\n\nJSON schema:\n${JSON.stringify(
            {
              title: 'string',
              subtitle: 'string',
              intent: {
                days: 'number',
                startCity: 'string',
                endCity: 'string|null',
                themes: ['string'],
                food: 'vegetarian|vegan|seafood|local|any',
                region:
                  'pacific_coast|southwest|rockies|northeast|southeast|midwest|generic',
              },
              waypoints: [{ name: 'City, ST', vibe: 'string', activity: 'string' }],
              tips: ['string'],
            },
            null,
            2,
          )}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${body.slice(0, 240)}`)
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty OpenAI response')
  const draft = extractJson(content) as LlmDraft
  validateDraft(draft)
  return { draft, model }
}

function validateDraft(draft: LlmDraft) {
  if (!draft?.intent?.days || !Array.isArray(draft.waypoints)) {
    throw new Error('Invalid LLM draft shape')
  }
  if (draft.waypoints.length !== draft.intent.days + 1) {
    // Soft-fix by trimming/padding later in generate.ts
  }
}

export function llmDraftToIntent(notes: string, draft: LlmDraft): TripIntent {
  return {
    days: Math.min(14, Math.max(1, Number(draft.intent.days) || 5)),
    startCity: draft.intent.startCity || draft.waypoints[0]?.name || 'Denver, CO',
    endCity: draft.intent.endCity,
    themes: draft.intent.themes?.length ? draft.intent.themes : ['scenic'],
    food: draft.intent.food || 'any',
    raw: notes,
    region: draft.intent.region || 'generic',
  }
}
