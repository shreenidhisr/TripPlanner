import { mapsPlace } from '../shared/heuristicPlan'
import type { FoodPreference, ItineraryDay } from '../shared/types'
import type { Waypoint } from '../shared/corridors'

export type PlaceHit = {
  name: string
  cuisine?: string
  lat: number
  lon: number
}

function cuisineFilter(food: FoodPreference): string | null {
  switch (food) {
    case 'vegetarian':
      return 'vegetarian|vegan|plant'
    case 'vegan':
      return 'vegan'
    case 'seafood':
      return 'seafood|fish|sushi'
    default:
      return null
  }
}

export async function findFoodPlaces(near: {
  lat: number
  lon: number
  food: FoodPreference
}): Promise<PlaceHit[]> {
  if (!near.lat || !near.lon) return []

  const cuisine = cuisineFilter(near.food)
  const radius = 4500
  const cuisineClause = cuisine
    ? `node["amenity"~"restaurant|cafe|fast_food"]["cuisine"~"${cuisine}",i](around:${radius},${near.lat},${near.lon});`
    : ''

  const query = `
[out:json][timeout:20];
(
  ${cuisineClause}
  node["amenity"="restaurant"](around:${radius},${near.lat},${near.lon});
  node["amenity"="cafe"](around:${Math.round(radius * 0.7)},${near.lat},${near.lon});
);
out body 12;
`

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'TripPlanner/1.0 (road-trip builder)',
        },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (!res.ok) continue
      const data = (await res.json()) as {
        elements?: Array<{
          lat?: number
          lon?: number
          tags?: Record<string, string>
        }>
      }
      const hits: PlaceHit[] = []
      for (const el of data.elements ?? []) {
        const name = el.tags?.name?.trim()
        if (!name || el.lat == null || el.lon == null) continue
        hits.push({
          name,
          cuisine: el.tags?.cuisine,
          lat: el.lat,
          lon: el.lon,
        })
      }
      if (hits.length) return rankPlaces(hits, near.food)
    } catch {
      // try next endpoint
    }
  }
  return []
}

function rankPlaces(hits: PlaceHit[], food: FoodPreference): PlaceHit[] {
  const pref = cuisineFilter(food)
  const scored = hits.map((hit) => {
    let score = 0
    const cuisine = hit.cuisine?.toLowerCase() ?? ''
    if (pref && pref.split('|').some((p) => cuisine.includes(p))) score += 5
    if (food === 'local' && /american|regional|farm/i.test(cuisine)) score += 2
    return { hit, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const out: PlaceHit[] = []
  for (const { hit } of scored) {
    const key = hit.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(hit)
    if (out.length >= 3) break
  }
  return out
}

export async function enrichFoodStops(
  days: ItineraryDay[],
  waypoints: Waypoint[],
  food: FoodPreference,
): Promise<{ days: ItineraryDay[]; placesFound: number }> {
  let placesFound = 0
  const next = [...days]

  for (let i = 0; i < next.length; i++) {
    const dest = waypoints[i + 1] ?? waypoints[i]
    if (!dest) continue
    try {
      const places = await findFoodPlaces({ lat: dest.lat, lon: dest.lon, food })
      if (!places.length) continue
      placesFound += 1
      const pick = places[0]
      const alt = places
        .slice(1)
        .map((p) => p.name)
        .join(' · ')
      next[i] = {
        ...next[i],
        stops: next[i].stops.map((stop) => {
          if (stop.type !== 'food') return stop
          return {
            ...stop,
            title: pick.name,
            detail: [
              pick.cuisine ? `${pick.cuisine.replace(/;/g, ', ')} near ${dest.name.split(',')[0]}` : `OpenStreetMap place near ${dest.name.split(',')[0]}`,
              alt ? `Also nearby: ${alt}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            mapUrl: mapsPlace(`${pick.name} ${dest.name}`),
          }
        }),
      }
    } catch {
      // keep template food stop
    }
  }

  return { days: next, placesFound }
}
