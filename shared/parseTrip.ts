import type { FoodPreference, RouteRegion, TravelMode, TripIntent } from './types'

const CITY_ALIASES: Array<{ pattern: RegExp; city: string; region: RouteRegion }> = [
  { pattern: /\b(mumbai|bombay)\b/i, city: 'Mumbai, MH', region: 'west_india' },
  { pattern: /\b(pune|poona)\b/i, city: 'Pune, MH', region: 'west_india' },
  { pattern: /\b(goa|panaji|panjim)\b/i, city: 'Goa, GA', region: 'west_india' },
  { pattern: /\b(lonavala|lonavla)\b/i, city: 'Lonavala, MH', region: 'west_india' },
  { pattern: /\b(nashik|nasik)\b/i, city: 'Nashik, MH', region: 'west_india' },
  { pattern: /\b(ahmedabad|amdavad)\b/i, city: 'Ahmedabad, GJ', region: 'west_india' },
  { pattern: /\b(delhi|new delhi|ndls)\b/i, city: 'Delhi, DL', region: 'north_india' },
  { pattern: /\b(agra)\b/i, city: 'Agra, UP', region: 'north_india' },
  { pattern: /\b(jaipur)\b/i, city: 'Jaipur, RJ', region: 'north_india' },
  { pattern: /\b(udaipur)\b/i, city: 'Udaipur, RJ', region: 'north_india' },
  { pattern: /\b(jodhpur)\b/i, city: 'Jodhpur, RJ', region: 'north_india' },
  { pattern: /\b(rishikesh)\b/i, city: 'Rishikesh, UK', region: 'himalayas' },
  { pattern: /\b(manali)\b/i, city: 'Manali, HP', region: 'himalayas' },
  { pattern: /\b(shimla)\b/i, city: 'Shimla, HP', region: 'himalayas' },
  { pattern: /\b(amritsar)\b/i, city: 'Amritsar, PB', region: 'north_india' },
  { pattern: /\b(varanasi|banaras|benaras)\b/i, city: 'Varanasi, UP', region: 'east_india' },
  { pattern: /\b(lucknow)\b/i, city: 'Lucknow, UP', region: 'north_india' },
  { pattern: /\b(kolkata|calcutta)\b/i, city: 'Kolkata, WB', region: 'east_india' },
  { pattern: /\b(darjeeling)\b/i, city: 'Darjeeling, WB', region: 'east_india' },
  { pattern: /\b(bengaluru|bangalore)\b/i, city: 'Bengaluru, KA', region: 'south_india' },
  { pattern: /\b(mysuru|mysore)\b/i, city: 'Mysuru, KA', region: 'south_india' },
  { pattern: /\b(chennai|madras)\b/i, city: 'Chennai, TN', region: 'south_india' },
  { pattern: /\b(pondicherry|puducherry)\b/i, city: 'Pondicherry, PY', region: 'south_india' },
  { pattern: /\b(madurai)\b/i, city: 'Madurai, TN', region: 'south_india' },
  { pattern: /\b(kochi|cochin|ernakulam)\b/i, city: 'Kochi, KL', region: 'south_india' },
  { pattern: /\b(munnar)\b/i, city: 'Munnar, KL', region: 'south_india' },
  { pattern: /\b(hyderabad)\b/i, city: 'Hyderabad, TS', region: 'south_india' },
  { pattern: /\b(leh|ladakh)\b/i, city: 'Leh, LA', region: 'himalayas' },
  { pattern: /\b(srinagar)\b/i, city: 'Srinagar, JK', region: 'himalayas' },
  // keep a few US aliases for older demos
  { pattern: /\b(denver)\b/i, city: 'Denver, CO', region: 'rockies' },
  { pattern: /\b(san francisco|sf)\b/i, city: 'San Francisco, CA', region: 'pacific_coast' },
]

const THEME_RULES: Array<{ pattern: RegExp; theme: string; regionHint?: RouteRegion }> = [
  { pattern: /\b(hills?|mountains?|ghats?|peaks?)\b/i, theme: 'hills', regionHint: 'himalayas' },
  { pattern: /\b(himalaya|manali|shimla|ladakh)\b/i, theme: 'hills', regionHint: 'himalayas' },
  { pattern: /\b(beach|coast|konkan|goa)\b/i, theme: 'coast', regionHint: 'west_india' },
  { pattern: /\b(desert|thar|rajasthan)\b/i, theme: 'desert', regionHint: 'north_india' },
  { pattern: /\b(temple|heritage|fort|palace)\b/i, theme: 'heritage', regionHint: 'north_india' },
  { pattern: /\b(backwater|kerala)\b/i, theme: 'coast', regionHint: 'south_india' },
  { pattern: /\b(foodie|restaurants?|eats|cuisine|thali)\b/i, theme: 'food' },
  { pattern: /\b(family|kids|child)\b/i, theme: 'family' },
  { pattern: /\b(relax|chill|slow|leisurely)\b/i, theme: 'slow' },
  { pattern: /\b(photo|views?|overlook|sunset)\b/i, theme: 'views' },
]

function extractDays(text: string): number {
  const patterns = [
    /(\d+)\s*-?\s*days?\b/i,
    /\bfor\s+(\d+)\s+days?\b/i,
    /\b(\d+)\s+day\s+(?:road\s*)?trip\b/i,
    /\bover\s+(\d+)\s+days?\b/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = Number(m[1])
      if (n >= 1 && n <= 21) return n
    }
  }
  if (/\bweekend\b/i.test(text)) return 2
  if (/\bweek\b/i.test(text)) return 7
  return 5
}

function extractFood(text: string): FoodPreference {
  if (/\bvegan\b/i.test(text)) return 'vegan'
  if (/\bvegetarian|veggie|plant[- ]based|jain\b/i.test(text)) return 'vegetarian'
  if (/\bseafood|fish|prawn|crab\b/i.test(text)) return 'seafood'
  if (/\blocal|thali|street food|regional\b/i.test(text)) return 'local'
  return 'any'
}

function extractMode(text: string, fallback: TravelMode = 'car'): TravelMode {
  if (/\b(train|irctc|rail|shatabdi|rajdhani|express)\b/i.test(text)) return 'train'
  if (/\b(bus|volvo|redbus|sleeper bus)\b/i.test(text)) return 'bus'
  if (/\b(bike|motorcycle|scooter|activa|royal enfield)\b/i.test(text)) return 'bike'
  if (/\b(car|self drive|road trip|driving)\b/i.test(text)) return 'car'
  return fallback
}

function extractCities(text: string): { cities: string[]; region: RouteRegion } {
  const matches: Array<{ city: string; region: RouteRegion; index: number }> = []
  for (const entry of CITY_ALIASES) {
    const flags = entry.pattern.flags.includes('g') ? entry.pattern.flags : `${entry.pattern.flags}g`
    const re = new RegExp(entry.pattern.source, flags)
    for (const m of text.matchAll(re)) {
      matches.push({ city: entry.city, region: entry.region, index: m.index ?? 0 })
    }
  }
  matches.sort((a, b) => a.index - b.index)
  const found: string[] = []
  let region: RouteRegion = 'generic'
  for (const match of matches) {
    if (!found.includes(match.city)) {
      found.push(match.city)
      if (region === 'generic') region = match.region
    }
  }
  return { cities: found, region }
}

function extractThemes(text: string): { themes: string[]; regionHint: RouteRegion | null } {
  const themes: string[] = []
  let regionHint: RouteRegion | null = null
  for (const rule of THEME_RULES) {
    if (rule.pattern.test(text) && !themes.includes(rule.theme)) {
      themes.push(rule.theme)
      if (!regionHint && rule.regionHint) regionHint = rule.regionHint
    }
  }
  if (themes.length === 0) themes.push('scenic')
  return { themes, regionHint }
}

function defaultStartForRegion(region: RouteRegion): string {
  switch (region) {
    case 'north_india':
      return 'Delhi, DL'
    case 'west_india':
      return 'Mumbai, MH'
    case 'south_india':
      return 'Bengaluru, KA'
    case 'east_india':
      return 'Kolkata, WB'
    case 'himalayas':
      return 'Delhi, DL'
    case 'pacific_coast':
      return 'San Francisco, CA'
    case 'southwest':
      return 'Phoenix, AZ'
    case 'rockies':
      return 'Denver, CO'
    case 'northeast':
      return 'Boston, MA'
    case 'southeast':
      return 'Asheville, NC'
    case 'midwest':
      return 'Chicago, IL'
    default:
      return 'Mumbai, MH'
  }
}

export function parseTripIntent(
  raw: string,
  opts?: { mode?: TravelMode; startOverride?: string },
): TripIntent {
  const text = raw.trim()
  const days = extractDays(text)
  const food = extractFood(text)
  const mode = opts?.mode ?? extractMode(text, 'car')
  const { cities, region: cityRegion } = extractCities(text)
  const { themes, regionHint } = extractThemes(text)

  let region = cityRegion
  if (region === 'generic' && regionHint) region = regionHint
  if (region === 'generic' && themes.includes('hills')) region = 'himalayas'
  if (region === 'generic' && themes.includes('coast')) region = 'west_india'
  if (region === 'generic' && themes.includes('desert')) region = 'north_india'
  if (region === 'generic') region = 'west_india'

  const startCity = opts?.startOverride || cities[0] || defaultStartForRegion(region)
  const endCity = cities.length > 1 ? cities[cities.length - 1] : null

  return {
    days,
    startCity,
    endCity,
    themes,
    food,
    raw: text,
    region,
    mode,
  }
}
