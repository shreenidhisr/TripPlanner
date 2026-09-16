import type { GenerateResponse, HealthResponse, TripPlan } from '../../shared/types'
import { generateHeuristicPlan } from '../../shared/heuristicPlan'

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}

export async function generatePlanFromApi(notes: string): Promise<TripPlan> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })

  if (!res.ok) {
    let message = 'Could not generate itinerary'
    try {
      const err = (await res.json()) as { error?: string }
      if (err.error) message = err.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = (await res.json()) as GenerateResponse
  return data.plan
}

/** Prefer API (live OSRM + optional LLM). Fall back to local heuristic offline. */
export async function generatePlan(notes: string): Promise<TripPlan> {
  try {
    return await generatePlanFromApi(notes)
  } catch (err) {
    console.warn('API generate failed, using local heuristic', err)
    return generateHeuristicPlan(notes)
  }
}
