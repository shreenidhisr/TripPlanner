import { parseTripIntent } from './parseTrip'
import type {
  FoodPreference,
  ItineraryDay,
  ItineraryStop,
  RouteRegion,
  TripIntent,
  TripPlan,
} from './types'

type Waypoint = {
  name: string
  vibe: string
  activity: string
}

const ROUTES: Record<RouteRegion, Waypoint[]> = {
  pacific_coast: [
    { name: 'San Francisco, CA', vibe: 'Foggy start, bridge views', activity: 'Embarcadero stroll before wheels roll' },
    { name: 'Half Moon Bay, CA', vibe: 'Cliffside highway', activity: 'Pull-off at coastal overlook' },
    { name: 'Santa Cruz, CA', vibe: 'Surf town energy', activity: 'Boardwalk walk and snack stop' },
    { name: 'Monterey, CA', vibe: 'Cannery Row calm', activity: '17-Mile Drive scenic loop' },
    { name: 'Big Sur, CA', vibe: 'Dramatic cliffs', activity: 'Bixby Bridge photo stop' },
    { name: 'San Luis Obispo, CA', vibe: 'Central coast pause', activity: 'Downtown window stroll' },
    { name: 'Santa Barbara, CA', vibe: 'Palm-lined finish', activity: 'Waterfront sunset' },
  ],
  southwest: [
    { name: 'Phoenix, AZ', vibe: 'Desert launch', activity: 'Coffee and cooler stock-up' },
    { name: 'Sedona, AZ', vibe: 'Red rock amphitheater', activity: 'Airport Mesa overlook' },
    { name: 'Flagstaff, AZ', vibe: 'High-country pines', activity: 'Historic downtown stretch' },
    { name: 'Grand Canyon Village, AZ', vibe: 'Rim-of-the-world views', activity: 'South Rim walk' },
    { name: 'Page, AZ', vibe: 'Slot canyon country', activity: 'Lake Powell overlook' },
    { name: 'Monument Valley, UT', vibe: 'Iconic mesas', activity: 'Valley Drive viewpoints' },
    { name: 'Moab, UT', vibe: 'Arches gateway', activity: 'Delicate Arch trailhead' },
  ],
  rockies: [
    { name: 'Denver, CO', vibe: 'Mile-high launch', activity: 'Early departure toward the Front Range' },
    { name: 'Boulder, CO', vibe: 'Flatiron foothills', activity: 'Pearl Street stretch stop' },
    { name: 'Estes Park, CO', vibe: 'Mountain gateway', activity: 'Lake Estes shoreline walk' },
    { name: 'Rocky Mountain NP, CO', vibe: 'Alpine ridges', activity: 'Trail Ridge Road viewpoints' },
    { name: 'Hot Sulphur Springs, CO', vibe: 'Quiet valley', activity: 'River overlook pull-off' },
    { name: 'Glenwood Springs, CO', vibe: 'Canyon town', activity: 'Glenwood Canyon rest stop' },
    { name: 'Aspen, CO', vibe: 'High-country finish', activity: 'Maroon Bells overlook' },
  ],
  northeast: [
    { name: 'Boston, MA', vibe: 'Harbor departure', activity: 'Quick North End espresso' },
    { name: 'Portsmouth, NH', vibe: 'Seacoast charm', activity: 'Market Square wander' },
    { name: 'Portland, ME', vibe: 'Working waterfront', activity: 'Old Port stroll' },
    { name: 'Camden, ME', vibe: 'Harbor hills', activity: 'Mt. Battie overlook' },
    { name: 'Bar Harbor, ME', vibe: 'Acadia gateway', activity: 'Park Loop Road highlights' },
    { name: 'Acadia NP, ME', vibe: 'Granite coast', activity: 'Cadillac Mountain sunrise (or golden hour)' },
    { name: 'Portland, ME', vibe: 'Return coast', activity: 'Evening waterfront dinner' },
  ],
  southeast: [
    { name: 'Asheville, NC', vibe: 'Blue Ridge launch', activity: 'Downtown coffee before the parkway' },
    { name: 'Blue Ridge Parkway, NC', vibe: 'Endless ridgelines', activity: 'Craggy Gardens overlook' },
    { name: 'Cherokee, NC', vibe: 'Mountain gateway', activity: 'Oconaluftee River walk' },
    { name: 'Great Smoky Mountains NP, TN', vibe: 'Misty peaks', activity: 'Newfound Gap overlook' },
    { name: 'Gatlinburg, TN', vibe: 'Mountain town', activity: 'Short downtown stretch' },
    { name: 'Knoxville, TN', vibe: 'River city pause', activity: 'Market Square wander' },
    { name: 'Asheville, NC', vibe: 'Loop home', activity: 'Evening brewery patio' },
  ],
  midwest: [
    { name: 'Chicago, IL', vibe: 'Lakefront launch', activity: 'Early out along Lake Shore Drive' },
    { name: 'Madison, WI', vibe: 'Capitol isthmus', activity: 'State Street stretch' },
    { name: 'Wisconsin Dells, WI', vibe: 'River bluffs', activity: 'Scenic overlook pull-off' },
    { name: 'Minneapolis, MN', vibe: 'Twin Cities pulse', activity: 'Stone Arch Bridge walk' },
    { name: 'Duluth, MN', vibe: 'Great Lakes shore', activity: 'Canal Park stroll' },
    { name: 'North Shore, MN', vibe: 'Superior drama', activity: 'Split Rock Lighthouse stop' },
    { name: 'Minneapolis, MN', vibe: 'Return south', activity: 'Evening neighborhood dinner' },
  ],
  generic: [
    { name: 'Denver, CO', vibe: 'Open-road launch', activity: 'Fuel, snacks, playlist set' },
    { name: 'Colorado Springs, CO', vibe: 'Front Range views', activity: 'Garden of the Gods loop' },
    { name: 'Pueblo, CO', vibe: 'River corridor', activity: 'Quick park stretch' },
    { name: 'Salida, CO', vibe: 'Mountain town', activity: 'Downtown river walk' },
    { name: 'Buena Vista, CO', vibe: 'Peak country', activity: 'Arkansas River overlook' },
    { name: 'Leadville, CO', vibe: 'High alpine', activity: 'Historic Main Street stroll' },
    { name: 'Vail, CO', vibe: 'Valley finish', activity: 'Village evening wander' },
  ],
}

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

function mapsDirections(from: string, to: string): string {
  const origin = encodeURIComponent(from)
  const destination = encodeURIComponent(to)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
}

function mapsPlace(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
}

function formatDrive(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

function pickWaypoints(intent: TripIntent): Waypoint[] {
  const pool = [...ROUTES[intent.region]]
  if (intent.startCity) {
    const idx = pool.findIndex((w) =>
      w.name.toLowerCase().includes(intent.startCity.split(',')[0].toLowerCase()),
    )
    if (idx > 0) {
      const [start] = pool.splice(idx, 1)
      pool.unshift(start)
    } else if (idx === -1) {
      pool[0] = {
        name: intent.startCity,
        vibe: 'Your starting point',
        activity: 'Roll out when traffic clears',
      }
    }
  }
  if (intent.endCity && intent.endCity !== intent.startCity) {
    const last = pool[pool.length - 1]
    if (!last.name.toLowerCase().includes(intent.endCity.split(',')[0].toLowerCase())) {
      pool[pool.length - 1] = {
        name: intent.endCity,
        vibe: 'Your finish line',
        activity: 'Arrive with buffer for dinner',
      }
    }
  }
  return pool
}

function sampleRoute(waypoints: Waypoint[], days: number): Waypoint[] {
  if (waypoints.length <= days + 1) return waypoints
  const result: Waypoint[] = [waypoints[0]]
  const middle = waypoints.slice(1, -1)
  const need = days - 1
  const step = middle.length / Math.max(need, 1)
  for (let i = 0; i < need; i++) {
    const idx = Math.min(middle.length - 1, Math.floor(i * step + step / 2))
    const wp = middle[idx]
    if (result[result.length - 1].name !== wp.name) result.push(wp)
  }
  const end = waypoints[waypoints.length - 1]
  if (result[result.length - 1].name !== end.name) result.push(end)
  while (result.length < days + 1) {
    result.splice(result.length - 1, 0, middle[Math.min(middle.length - 1, result.length - 1)])
  }
  return result.slice(0, days + 1)
}

function foodLabel(food: FoodPreference, dayIndex: number): string {
  const list = FOOD_STOPS[food]
  return list[dayIndex % list.length]
}

function dayTitle(from: string, to: string, themes: string[]): string {
  const short = (s: string) => s.split(',')[0]
  if (themes.includes('hills')) return `${short(from)} → ${short(to)} · ridge lines`
  if (themes.includes('coast')) return `${short(from)} → ${short(to)} · coastal run`
  if (themes.includes('desert')) return `${short(from)} → ${short(to)} · desert miles`
  return `${short(from)} → ${short(to)}`
}

function buildDay(
  day: number,
  from: Waypoint,
  to: Waypoint,
  intent: TripIntent,
  driveMinutes: number,
): ItineraryDay {
  const food = foodLabel(intent.food, day - 1)
  const stops: ItineraryStop[] = [
    {
      id: `${day}-depart`,
      time: '08:30',
      title: `Depart ${from.name.split(',')[0]}`,
      detail: from.activity,
      type: 'drive',
      durationMinutes: Math.round(driveMinutes * 0.45),
      mapUrl: mapsDirections(from.name, to.name),
    },
    {
      id: `${day}-sight`,
      time: '11:00',
      title: to.vibe.includes('launch') ? from.vibe : `${to.name.split(',')[0]} waypoint`,
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
      title: 'Afternoon drive',
      detail: intent.themes.includes('slow')
        ? 'Keep the pace easy—pull over for views when they appear.'
        : 'Continue toward tonight’s base with one scenic pull-off.',
      type: 'drive',
      durationMinutes: Math.round(driveMinutes * 0.55),
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
    summary: `${from.vibe} into ${to.vibe.toLowerCase()}.`,
    driveMinutes,
    driveLabel: formatDrive(driveMinutes),
    from: from.name,
    to: to.name,
    mapUrl: mapsDirections(from.name, to.name),
    stops,
  }
}

function estimateDrive(dayIndex: number, themes: string[]): number {
  let base = 150 + (dayIndex % 3) * 25
  if (themes.includes('slow')) base = Math.round(base * 0.75)
  if (themes.includes('hills')) base += 20
  if (themes.includes('coast')) base += 15
  return base
}

function buildTips(intent: TripIntent): string[] {
  const tips = [
    'Pack a cooler—highway food stops are better when you already have snacks.',
    'Start each morning by 8:30 to keep daylight for the scenic legs.',
  ]
  if (intent.food === 'vegetarian' || intent.food === 'vegan') {
    tips.push('Lunch stops are pre-filtered for plant-forward options along the corridor.')
  }
  if (intent.themes.includes('hills')) {
    tips.push('Expect slower climbs—build buffer into afternoon arrivals.')
  }
  if (intent.themes.includes('coast')) {
    tips.push('Coastal fog can slow mornings; keep sunglasses and a layer handy.')
  }
  tips.push('Every map link opens Google Maps with the day’s route or stop prefilled.')
  return tips.slice(0, 4)
}

export function generateTripPlan(raw: string): TripPlan {
  const intent = parseTripIntent(raw)
  const waypoints = sampleRoute(pickWaypoints(intent), intent.days)
  const days: ItineraryDay[] = []

  for (let i = 0; i < intent.days; i++) {
    const from = waypoints[Math.min(i, waypoints.length - 2)]
    const to = waypoints[Math.min(i + 1, waypoints.length - 1)]
    const driveMinutes = estimateDrive(i, intent.themes)
    days.push(buildDay(i + 1, from, to, intent, driveMinutes))
  }

  const totalDriveMinutes = days.reduce((sum, d) => sum + d.driveMinutes, 0)
  const themeBit = intent.themes.includes('hills')
    ? 'through the hills'
    : intent.themes.includes('coast')
      ? 'along the coast'
      : intent.themes.includes('desert')
        ? 'across desert country'
        : 'on open roads'

  return {
    title: `${intent.days}-day drive ${themeBit}`,
    subtitle: `From ${intent.startCity.split(',')[0]}${intent.endCity ? ` to ${intent.endCity.split(',')[0]}` : ''} · structured from your notes`,
    intent,
    totalDriveMinutes,
    days,
    tips: buildTips(intent),
  }
}

export function formatTotalDrive(minutes: number): string {
  return formatDrive(minutes)
}
