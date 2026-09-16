import type { Waypoint } from '../shared/corridors'
import {
  nearbyIndiaDestinations,
  nearestIndiaPlace,
} from '../shared/india'
import {
  buildDay,
  buildDraftPlan,
  finalizePlan,
  formatDrive,
  sampleRoute,
} from '../shared/heuristicPlan'
import type {
  GenerateRequest,
  ItineraryDay,
  LlmProvider,
  NearbyDestination,
  TravelMode,
  TripPlan,
} from '../shared/types'
import type { LlmCredentials } from './llm'
import { draftWithLlm, llmDraftToIntent } from './llm'
import { enrichFoodStops } from './places'
import { enrichWaypoints, routeDrive } from './routing'
import { enrichTransitStops } from './transit'

function patchDrive(day: ItineraryDay, minutes: number, miles: number): ItineraryDay {
  const stops = day.stops.map((stop) => {
    if ((stop.type !== 'drive' && stop.type !== 'transit') || !stop.durationMinutes) return stop
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
  mode: TravelMode,
): Promise<{ days: ItineraryDay[]; routing: 'osrm' | 'estimated' }> {
  if (mode === 'train' || mode === 'bus') {
    return { days, routing: 'estimated' }
  }

  let usedOsrm = false
  const next = [...days]
  const profileFactor = mode === 'bike' ? 1.35 : 1

  const legs = await Promise.all(
    next.map(async (_day, i) => {
      const from = waypoints[i]
      const to = waypoints[i + 1]
      if (!from || !to) return null
      try {
        return await routeDrive(
          { lat: from.lat, lon: from.lon },
          { lat: to.lat, lon: to.lon },
        )
      } catch {
        return null
      }
    }),
  )

  for (let i = 0; i < next.length; i++) {
    const leg = legs[i]
    if (!leg) continue
    usedOsrm = true
    const minutes = Math.round(leg.minutes * profileFactor)
    next[i] = patchDrive(next[i], minutes, Math.round(leg.miles))
  }

  return { days: next, routing: usedOsrm ? 'osrm' : 'estimated' }
}

async function finishPlan(input: {
  draft: {
    intent: TripPlan['intent']
    waypoints: Waypoint[]
    days: ItineraryDay[]
    title: string
    subtitle: string
  }
  engine: TripPlan['meta']['engine']
  routing: TripPlan['meta']['routing']
  model?: string
  provider?: LlmProvider
  tips?: string[]
  nearby?: NearbyDestination[]
}): Promise<TripPlan> {
  const transit = enrichTransitStops(
    input.draft.days,
    input.draft.waypoints,
    input.draft.intent.mode,
  )
  const withTransitDays = transit.days
  const routing = transit.routing ?? input.routing

  const { days, placesFound } = await enrichFoodStops(
    withTransitDays,
    input.draft.waypoints,
    input.draft.intent.food,
  )

  const tips = [...(input.tips ?? [])]
  if (placesFound > 0) {
    tips.unshift(
      `Found real OpenStreetMap food stops for ${placesFound} day${placesFound === 1 ? '' : 's'}.`,
    )
  }

  const plan = finalizePlan(
    { ...input.draft, days },
    {
      engine: input.engine,
      routing,
      places: placesFound > 0 ? 'overpass' : 'none',
      generatedAt: new Date().toISOString(),
      model: input.model,
      provider: input.provider,
      mode: input.draft.intent.mode,
    },
    tips.length ? { tips: tips.slice(0, 5) } : undefined,
  )
  return { ...plan, nearbySuggestions: input.nearby }
}

export async function generatePlan(
  input: GenerateRequest,
  opts?: { credentials?: LlmCredentials | null },
): Promise<TripPlan> {
  const text = input.notes.trim()
  if (text.length < 8) throw new Error('Notes too short')

  const mode: TravelMode = input.mode || 'car'
  let startOverride: string | undefined
  let locationLabel: string | undefined
  let nearby: NearbyDestination[] | undefined

  if (input.location?.lat != null && input.location?.lon != null) {
    const nearest = nearestIndiaPlace(input.location.lat, input.location.lon)
    startOverride = input.location.label || (nearest ? `${nearest.name}, ${nearest.state}` : undefined)
    locationLabel =
      input.location.label ||
      (nearest
        ? `Near ${nearest.name}, ${nearest.state} (${input.location.lat.toFixed(3)}, ${input.location.lon.toFixed(3)})`
        : `${input.location.lat.toFixed(3)}, ${input.location.lon.toFixed(3)}`)
    nearby = nearbyIndiaDestinations(input.location.lat, input.location.lon, {
      mode,
      limit: 8,
    })
  }

  if (input.destinationHint) {
    // nudge notes so parser/LLM see the chosen destination
  }

  const notesForEngine = input.destinationHint
    ? `${text}\nAlso want to include ${input.destinationHint}.`
    : text

  if (opts?.credentials?.apiKey || process.env.OPENAI_API_KEY?.trim()) {
    try {
      const llm = await draftWithLlm(notesForEngine, {
        mode,
        locationLabel,
        credentials: opts?.credentials,
      })
      if (llm) {
        const intent = llmDraftToIntent(notesForEngine, llm.draft, mode)
        if (startOverride) intent.startCity = startOverride
        let waypoints: Waypoint[] = llm.draft.waypoints.map((w) => ({
          name: w.name,
          vibe: w.vibe,
          activity: w.activity,
          lat: 0,
          lon: 0,
        }))
        if (waypoints.length !== intent.days + 1) {
          waypoints = sampleRoute(
            waypoints.length
              ? waypoints
              : buildDraftPlan(notesForEngine, { mode, startOverride }).waypoints,
            intent.days,
          )
        }
        waypoints = await enrichWaypoints(waypoints)
        const draftDays = []
        for (let i = 0; i < intent.days; i++) {
          draftDays.push(buildDay(i + 1, waypoints[i], waypoints[i + 1], intent, 150))
        }
        const { days, routing } = await applyOsrmTimes(draftDays, waypoints, mode)
        return finishPlan({
          draft: {
            intent,
            waypoints,
            days,
            title: llm.draft.title || `${intent.days}-day ${mode} trip`,
            subtitle:
              llm.draft.subtitle ||
              `From ${intent.startCity.split(',')[0]} · ${mode} · AI-structured`,
          },
          engine: 'llm',
          routing,
          model: llm.model,
          provider: llm.provider,
          tips: llm.draft.tips?.length ? llm.draft.tips.slice(0, 4) : undefined,
          nearby,
        })
      }
    } catch (err) {
      console.warn('[generate] LLM failed, falling back to heuristic:', err)
    }
  }

  const draft = buildDraftPlan(notesForEngine, { mode, startOverride })
  const waypoints = await enrichWaypoints(draft.waypoints)
  const { days, routing } = await applyOsrmTimes(draft.days, waypoints, mode)

  return finishPlan({
    draft: { ...draft, waypoints, days },
    engine: 'heuristic',
    routing,
    nearby,
  })
}
