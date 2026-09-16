import type { Waypoint } from '../shared/corridors'
import {
  buildDay,
  buildDraftPlan,
  finalizePlan,
  formatDrive,
  sampleRoute,
} from '../shared/heuristicPlan'
import type { ItineraryDay, TripPlan } from '../shared/types'
import { draftWithLlm, llmConfigured, llmDraftToIntent } from './llm'
import { enrichFoodStops } from './places'
import { enrichWaypoints, routeDrive } from './routing'

function patchDrive(day: ItineraryDay, minutes: number, miles: number): ItineraryDay {
  const stops = day.stops.map((stop) => {
    if (stop.type !== 'drive' || !stop.durationMinutes) return stop
    const share = stop.id.endsWith('depart') ? 0.45 : 0.55
    return { ...stop, durationMinutes: Math.max(10, Math.round(minutes * share)) }
  })
  return {
    ...day,
    driveMinutes: minutes,
    driveMiles: miles,
    driveLabel: formatDrive(minutes),
    stops,
  }
}

async function applyOsrmTimes(
  days: ItineraryDay[],
  waypoints: Waypoint[],
): Promise<{ days: ItineraryDay[]; routing: 'osrm' | 'estimated' }> {
  let usedOsrm = false
  const next = [...days]

  for (let i = 0; i < next.length; i++) {
    const from = waypoints[i]
    const to = waypoints[i + 1]
    if (!from || !to) continue
    try {
      const leg = await routeDrive(
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      )
      if (!leg) continue
      usedOsrm = true
      next[i] = patchDrive(next[i], leg.minutes, Math.round(leg.miles))
    } catch {
      // keep estimate
    }
  }

  return { days: next, routing: usedOsrm ? 'osrm' : 'estimated' }
}

async function finishPlan(input: {
  draft: ReturnType<typeof buildDraftPlan> | {
    intent: TripPlan['intent']
    waypoints: Waypoint[]
    days: ItineraryDay[]
    title: string
    subtitle: string
  }
  engine: TripPlan['meta']['engine']
  routing: TripPlan['meta']['routing']
  model?: string
  tips?: string[]
}): Promise<TripPlan> {
  const { days, placesFound } = await enrichFoodStops(
    input.draft.days,
    input.draft.waypoints,
    input.draft.intent.food,
  )

  const tips = [...(input.tips ?? [])]
  if (placesFound > 0) {
    tips.unshift(`Found real OpenStreetMap food stops for ${placesFound} day${placesFound === 1 ? '' : 's'}.`)
  }

  return finalizePlan(
    { ...input.draft, days },
    {
      engine: input.engine,
      routing: input.routing,
      places: placesFound > 0 ? 'overpass' : 'none',
      generatedAt: new Date().toISOString(),
      model: input.model,
    },
    tips.length ? { tips: tips.slice(0, 5) } : undefined,
  )
}

export async function generatePlan(notes: string): Promise<TripPlan> {
  const text = notes.trim()
  if (text.length < 8) {
    throw new Error('Notes too short')
  }

  if (llmConfigured()) {
    try {
      const llm = await draftWithLlm(text)
      if (llm) {
        const intent = llmDraftToIntent(text, llm.draft)
        let waypoints: Waypoint[] = llm.draft.waypoints.map((w) => ({
          name: w.name,
          vibe: w.vibe,
          activity: w.activity,
          lat: 0,
          lon: 0,
        }))
        if (waypoints.length !== intent.days + 1) {
          waypoints = sampleRoute(
            waypoints.length ? waypoints : buildDraftPlan(text).waypoints,
            intent.days,
          )
        }
        waypoints = await enrichWaypoints(waypoints)

        const draftDays = []
        for (let i = 0; i < intent.days; i++) {
          draftDays.push(buildDay(i + 1, waypoints[i], waypoints[i + 1], intent, 150))
        }

        const { days, routing } = await applyOsrmTimes(draftDays, waypoints)
        return finishPlan({
          draft: {
            intent,
            waypoints,
            days,
            title: llm.draft.title || `${intent.days}-day road trip`,
            subtitle:
              llm.draft.subtitle ||
              `From ${intent.startCity.split(',')[0]} · AI-structured from your notes`,
          },
          engine: 'llm',
          routing,
          model: llm.model,
          tips: llm.draft.tips?.length ? llm.draft.tips.slice(0, 4) : undefined,
        })
      }
    } catch (err) {
      console.warn('[generate] LLM failed, falling back to heuristic:', err)
    }
  }

  const draft = buildDraftPlan(text)
  const waypoints = await enrichWaypoints(draft.waypoints)
  const { days, routing } = await applyOsrmTimes(draft.days, waypoints)

  return finishPlan({
    draft: { ...draft, waypoints, days },
    engine: 'heuristic',
    routing,
  })
}
