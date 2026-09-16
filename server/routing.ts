import { CITY_COORDS } from '../shared/corridors'
import type { Waypoint } from '../shared/corridors'

export type LatLon = { lat: number; lon: number }

const geocodeCache = new Map<string, LatLon>()

function knownCoords(name: string): LatLon | null {
  const direct = CITY_COORDS[name.toLowerCase()]
  if (direct) return direct
  const key = name.split(',')[0].trim().toLowerCase()
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(key) || key.includes(city.split(',')[0])) return coords
  }
  return null
}

export async function geocodePlace(name: string): Promise<LatLon | null> {
  const cached = geocodeCache.get(name.toLowerCase())
  if (cached) return cached
  const known = knownCoords(name)
  if (known) {
    geocodeCache.set(name.toLowerCase(), known)
    return known
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', name)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'TripPlanner/1.0 (road-trip builder; contact=dev@tripplanner.local)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{ lat: string; lon: string }>
  if (!data[0]) return null
  const coords = { lat: Number(data[0].lat), lon: Number(data[0].lon) }
  geocodeCache.set(name.toLowerCase(), coords)
  return coords
}

export type DriveLeg = {
  minutes: number
  miles: number
}

export async function routeDrive(from: LatLon, to: LatLon): Promise<DriveLeg | null> {
  if (Math.abs(from.lat - to.lat) < 0.0001 && Math.abs(from.lon - to.lon) < 0.0001) {
    return { minutes: 45, miles: 18 }
  }

  const path = `${from.lon},${from.lat};${to.lon},${to.lat}`
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=false`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    code?: string
    routes?: Array<{ duration: number; distance: number }>
  }
  if (data.code !== 'Ok' || !data.routes?.[0]) return null
  const route = data.routes[0]
  return {
    minutes: Math.max(1, Math.round(route.duration / 60)),
    miles: route.distance / 1609.344,
  }
}

export async function resolveWaypointCoords(wp: Waypoint): Promise<Waypoint> {
  if (wp.lat && wp.lon) return wp
  const coords = await geocodePlace(wp.name)
  if (!coords) return wp
  return { ...wp, ...coords }
}

export async function enrichWaypoints(waypoints: Waypoint[]): Promise<Waypoint[]> {
  const out: Waypoint[] = []
  for (const wp of waypoints) {
    out.push(await resolveWaypointCoords(wp))
    // Be gentle with Nominatim if we ever miss the local cache.
    if (!knownCoords(wp.name)) await sleep(1100)
  }
  return out
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
