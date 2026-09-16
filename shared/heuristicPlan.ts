import { ROUTES, type Waypoint } from './corridors'
import { parseTripIntent } from './parseTrip'
import type {
  FoodPreference,
  ItineraryDay,
  ItineraryStop,
  TripIntent,
  TripPlan,
} from './types'

const FOOD_STOPS: Record<FoodPreference, string[]> = {
  vegetarian: [
    'Plant-forward cafe with grain bowls',
    'Vegetarian-friendly diner along the highway',
    'Farm stand + picnic of fresh produce',
    'Casual spot known for veggie plates',
  ],
  vegan: [
    'Vegan cafe with hearty wraps',
    'Plant-based lunch counter near the route',
    'Grocery stop for picnic supplies',
    'Vegan-friendly kitchen with local produce',
  ],
  seafood: [
    'Coastal seafood shack',
    'Oyster bar with a view',
    'Fish market lunch counter',
    'Harbor-side seafood plate',
  ],
  local: [
    'Regional favorite recommended by locals',
    'Farm-to-table lunch stop',
    'Market hall tasting stroll',
    'Hometown diner with seasonal specials',
  ],
  any: [
    'Reliable roadside lunch stop',
    'Town-square cafe',
    'Scenic picnic pull-off',
    'Casual dinner near lodging',
  ],
}

export function mapsDirections(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`
}

export function mapsPlace(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
}

export function formatDrive(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function formatMiles(miles: number): string {
  return `${Math.round(miles)} mi`
}

function newId(): string {
  return `trip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function pickWaypoints(intent: TripIntent): Waypoint[] {
  const pool = ROUTES[intent.region].map((w) => ({ ...w }))
  if (intent.startCity) {
    const key = intent.startCity.split(',')[0].toLowerCase()
    const idx = pool.findIndex((w) => w.name.toLowerCase().includes(key))
    if (idx > 0) {
      const [start] = pool.splice(idx, 1)
      pool.unshift(start)
    } else if (idx === -1) {
      pool[0] = {
        name: intent.startCity,
        vibe: 'Your starting point',
        activity: 'Roll out when traffic clears',
        lat: pool[0].lat,
        lon: pool[0].lon,
      }
    }
  }
  if (intent.endCity && intent.endCity !== intent.startCity) {
    const endKey = intent.endCity.split(',')[0].toLowerCase()
    const endIdx = pool.findIndex((w) => w.name.toLowerCase().includes(endKey))
    if (endIdx > 0) return pool.slice(0, endIdx + 1)
    pool[pool.length - 1] = {
      name: intent.endCity,
      vibe: 'Your finish line',
      activity: 'Arrive with buffer for dinner',
      lat: pool[pool.length - 1].lat,
      lon: pool[pool.length - 1].lon,
    }
  }
  return pool
}

function stay(wp: Waypoint): Waypoint {
  return {
    name: wp.name,
    vibe: `Extra day around ${wp.name.split(',')[0]}`,
    activity: 'Linger for a longer hike or town wander before pushing on',
    lat: wp.lat,
    lon: wp.lon,
  }
}

export function sampleRoute(waypoints: Waypoint[], days: number): Waypoint[] {
  const needed = days + 1
  if (waypoints.length === 0) {
    return Array.from({ length: needed }, (_, i) => ({
      name: 'Open road',
      vibe: i === 0 ? 'Flexible start' : 'Flexible corridor',
      activity: 'Follow the scenic pull-offs',
      lat: 39.7392,
      lon: -104.9903,
    }))
  }

  if (waypoints.length >= needed) {
    const picked: Waypoint[] = []
    for (let i = 0; i < needed; i++) {
      const idx = Math.round((i * (waypoints.length - 1)) / Math.max(needed - 1, 1))
      const wp = waypoints[idx]
      if (picked.length && picked[picked.length - 1].name === wp.name) picked.push(stay(wp))
      else picked.push(wp)
    }
    return picked
  }

  const result = [...waypoints]
  let missing = needed - result.length
  let cursor = 1
  while (missing > 0) {
    const at = Math.min(Math.max(cursor, 1), result.length - 1)
    result.splice(at, 0, stay(result[at]))
    missing -= 1
    cursor = Math.min(at + 2, result.length - 1)
  }
  return result
}

function foodLabel(food: FoodPreference, dayIndex: number): string {
  const list = FOOD_STOPS[food]
  return list[dayIndex % list.length]
}

function dayTitle(from: string, to: string, themes: string[]): string {
  const short = (s: string) => s.split(',')[0]
  if (from === to) return `${short(from)} · explore day`
  if (themes.includes('hills')) return `${short(from)} → ${short(to)} · ridge lines`
  if (themes.includes('coast')) return `${short(from)} → ${short(to)} · coastal run`
  if (themes.includes('desert')) return `${short(from)} → ${short(to)} · desert miles`
  return `${short(from)} → ${short(to)}`
}

function estimateDrive(dayIndex: number, themes: string[], samePlace: boolean): number {
  if (samePlace) return 45
  let base = 150 + (dayIndex % 3) * 25
  if (themes.includes('slow')) base = Math.round(base * 0.75)
  if (themes.includes('hills')) base += 20
  if (themes.includes('coast')) base += 15
  return base
}

export function buildDay(
  day: number,
  from: Waypoint,
  to: Waypoint,
  intent: TripIntent,
  driveMinutes: number,
  driveMiles?: number,
): ItineraryDay {
  const food = foodLabel(intent.food, day - 1)
  const samePlace = from.name === to.name
  const stops: ItineraryStop[] = [
    {
      id: `${day}-depart`,
      time: '08:30',
      title: samePlace ? `Morning in ${from.name.split(',')[0]}` : `Depart ${from.name.split(',')[0]}`,
      detail: from.activity,
      type: 'drive',
      durationMinutes: Math.round(driveMinutes * (samePlace ? 0.4 : 0.45)),
      mapUrl: mapsDirections(from.name, to.name),
    },
    {
      id: `${day}-sight`,
      time: '11:00',
      title: samePlace
        ? `${to.name.split(',')[0]} highlight`
        : to.vibe.includes('launch')
          ? from.vibe
          : `${to.name.split(',')[0]} waypoint`,
      detail: to.activity,
      type: 'sight',
      durationMinutes: 45,
      mapUrl: mapsPlace(to.name),
    },
    {
      id: `${day}-food`,
      time: '12:30',
      title: 'Food stop',
      detail: food,
      type: 'food',
      durationMinutes: 60,
      mapUrl: mapsPlace(`${food} near ${to.name}`),
    },
    {
      id: `${day}-drive2`,
      time: '14:00',
      title: samePlace ? 'Scenic loop' : 'Afternoon drive',
      detail: intent.themes.includes('slow')
        ? 'Keep the pace easy—pull over for views when they appear.'
        : samePlace
          ? 'Local scenic loop with one longer pull-off.'
          : 'Continue toward tonight’s base with one scenic pull-off.',
      type: 'drive',
      durationMinutes: Math.round(driveMinutes * (samePlace ? 0.6 : 0.55)),
      mapUrl: mapsDirections(from.name, to.name),
    },
    {
      id: `${day}-lodge`,
      time: '17:30',
      title: `Check in · ${to.name.split(',')[0]}`,
      detail: 'Lodging near the evening stroll zone so dinner is a short walk.',
      type: 'lodging',
      mapUrl: mapsPlace(`hotels in ${to.name}`),
    },
    {
      id: `${day}-eve`,
      time: '19:00',
      title: 'Evening wind-down',
      detail: intent.themes.includes('views')
        ? 'Golden-hour overlook or waterfront walk before dinner.'
        : 'Neighborhood walk, then dinner near lodging.',
      type: 'activity',
      durationMinutes: 90,
      mapUrl: mapsPlace(`${to.name} evening walk`),
    },
  ]

  return {
    day,
    title: dayTitle(from.name, to.name, intent.themes),
    summary: samePlace
      ? `${to.vibe}—a deeper look without packing the car twice.`
      : `${from.vibe} into ${to.vibe.toLowerCase()}.`,
    driveMinutes,
    driveMiles,
    driveLabel: formatDrive(driveMinutes),
    from: from.name,
    to: to.name,
    mapUrl: mapsDirections(from.name, to.name),
    stops,
  }
}

function buildTips(intent: TripIntent, routing: 'estimated' | 'osrm'): string[] {
  const tips = [
    'Pack a cooler—highway food stops are better when you already have snacks.',
    'Start each morning by 8:30 to keep daylight for the scenic legs.',
  ]
  if (intent.food === 'vegetarian' || intent.food === 'vegan') {
    tips.push('Lunch stops are tuned for plant-forward options along the corridor.')
  }
  if (intent.themes.includes('hills')) {
    tips.push('Expect slower climbs—build buffer into afternoon arrivals.')
  }
  if (intent.themes.includes('coast')) {
    tips.push('Coastal fog can slow mornings; keep sunglasses and a layer handy.')
  }
  tips.push(
    routing === 'osrm'
      ? 'Drive times come from live OpenStreetMap routing (OSRM).'
      : 'Drive times are estimates—connect the API for live OSRM routing.',
  )
  return tips.slice(0, 4)
}

export type DraftPlan = {
  intent: TripIntent
  waypoints: Waypoint[]
  days: ItineraryDay[]
  title: string
  subtitle: string
}

export function buildDraftPlan(raw: string): DraftPlan {
  const intent = parseTripIntent(raw)
  const waypoints = sampleRoute(pickWaypoints(intent), intent.days)
  const days: ItineraryDay[] = []

  for (let i = 0; i < intent.days; i++) {
    const from = waypoints[i]
    const to = waypoints[i + 1]
    const samePlace = from.name === to.name
    days.push(buildDay(i + 1, from, to, intent, estimateDrive(i, intent.themes, samePlace)))
  }

  const themeBit = intent.themes.includes('hills')
    ? 'through the hills'
    : intent.themes.includes('coast')
      ? 'along the coast'
      : intent.themes.includes('desert')
        ? 'across desert country'
        : 'on open roads'

  return {
    intent,
    waypoints,
    days,
    title: `${intent.days}-day drive ${themeBit}`,
    subtitle: `From ${intent.startCity.split(',')[0]}${intent.endCity ? ` to ${intent.endCity.split(',')[0]}` : ''} · structured from your notes`,
  }
}

export function finalizePlan(
  draft: DraftPlan,
  meta: TripPlan['meta'],
  extras?: { tips?: string[] },
): TripPlan {
  const totalDriveMinutes = draft.days.reduce((sum, d) => sum + d.driveMinutes, 0)
  const totalDriveMiles = draft.days.every((d) => typeof d.driveMiles === 'number')
    ? draft.days.reduce((sum, d) => sum + (d.driveMiles ?? 0), 0)
    : undefined

  return {
    id: newId(),
    title: draft.title,
    subtitle: draft.subtitle,
    intent: draft.intent,
    totalDriveMinutes,
    totalDriveMiles,
    days: draft.days,
    tips: extras?.tips ?? buildTips(draft.intent, meta.routing),
    meta,
  }
}

export function generateHeuristicPlan(raw: string): TripPlan {
  const draft = buildDraftPlan(raw)
  return finalizePlan(draft, {
    engine: 'heuristic',
    routing: 'estimated',
    places: 'none',
    generatedAt: new Date().toISOString(),
  })
}

export function formatTotalDrive(minutes: number): string {
  return formatDrive(minutes)
}
