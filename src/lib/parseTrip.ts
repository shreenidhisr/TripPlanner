import type { FoodPreference, RouteRegion, TripIntent } from './types'

const CITY_ALIASES: Array<{ pattern: RegExp; city: string; region: RouteRegion }> = [
  { pattern: /\b(san francisco|sf|bay area)\b/i, city: 'San Francisco, CA', region: 'pacific_coast' },
  { pattern: /\b(los angeles|l\.?a\.?|la)\b/i, city: 'Los Angeles, CA', region: 'pacific_coast' },
  { pattern: /\b(san diego)\b/i, city: 'San Diego, CA', region: 'pacific_coast' },
  { pattern: /\b(seattle|puget)\b/i, city: 'Seattle, WA', region: 'pacific_coast' },
  { pattern: /\b(portland)\b/i, city: 'Portland, OR', region: 'pacific_coast' },
  { pattern: /\b(denver)\b/i, city: 'Denver, CO', region: 'rockies' },
  { pattern: /\b(aspen|boulder)\b/i, city: 'Boulder, CO', region: 'rockies' },
  { pattern: /\b(salt lake|moab|utah)\b/i, city: 'Salt Lake City, UT', region: 'southwest' },
  { pattern: /\b(phoenix|scottsdale|arizona)\b/i, city: 'Phoenix, AZ', region: 'southwest' },
  { pattern: /\b(santa fe|albuquerque|new mexico)\b/i, city: 'Santa Fe, NM', region: 'southwest' },
  { pattern: /\b(austin|texas hill)\b/i, city: 'Austin, TX', region: 'southwest' },
  { pattern: /\b(nashville)\b/i, city: 'Nashville, TN', region: 'southeast' },
  { pattern: /\b(asheville|smoky|blue ridge)\b/i, city: 'Asheville, NC', region: 'southeast' },
  { pattern: /\b(miami|florida keys|keys)\b/i, city: 'Miami, FL', region: 'southeast' },
  { pattern: /\b(new orleans|nola)\b/i, city: 'New Orleans, LA', region: 'southeast' },
  { pattern: /\b(boston)\b/i, city: 'Boston, MA', region: 'northeast' },
  { pattern: /\b(new york|nyc|manhattan)\b/i, city: 'New York, NY', region: 'northeast' },
  { pattern: /\b(chicago)\b/i, city: 'Chicago, IL', region: 'midwest' },
  { pattern: /\b(big sur|monterey|carmel)\b/i, city: 'Monterey, CA', region: 'pacific_coast' },
  { pattern: /\b(yosemite)\b/i, city: 'Yosemite Valley, CA', region: 'pacific_coast' },
  { pattern: /\b(grand canyon)\b/i, city: 'Grand Canyon Village, AZ', region: 'southwest' },
  { pattern: /\b(yellowstone)\b/i, city: 'Yellowstone NP, WY', region: 'rockies' },
]

const THEME_RULES: Array<{ pattern: RegExp; theme: string; regionHint?: RouteRegion }> = [
  { pattern: /\b(hills?|mountains?|peaks?|scenic drives?|elevation)\b/i, theme: 'hills', regionHint: 'rockies' },
  { pattern: /\b(coast|ocean|beach|pacific|highway 1|pch)\b/i, theme: 'coast', regionHint: 'pacific_coast' },
  { pattern: /\b(desert|canyon|red rock|mesa)\b/i, theme: 'desert', regionHint: 'southwest' },
  { pattern: /\b(wine|vineyard|napa|sonoma)\b/i, theme: 'wine', regionHint: 'pacific_coast' },
  { pattern: /\b(national parks?|parks?|hiking|trail)\b/i, theme: 'parks' },
  { pattern: /\b(foodie|restaurants?|eats|cuisine)\b/i, theme: 'food' },
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
  if (/\bvegetarian|veggie|plant[- ]based\b/i.test(text)) return 'vegetarian'
  if (/\bseafood|fish|oyster|sushi\b/i.test(text)) return 'seafood'
  if (/\blocal|farm[- ]to[- ]table|regional\b/i.test(text)) return 'local'
  return 'any'
}

function extractCities(text: string): { cities: string[]; region: RouteRegion } {
  const found: string[] = []
  let region: RouteRegion = 'generic'
  for (const entry of CITY_ALIASES) {
    if (entry.pattern.test(text) && !found.includes(entry.city)) {
      found.push(entry.city)
      if (region === 'generic') region = entry.region
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
      return 'Denver, CO'
  }
}

export function parseTripIntent(raw: string): TripIntent {
  const text = raw.trim()
  const days = extractDays(text)
  const food = extractFood(text)
  const { cities, region: cityRegion } = extractCities(text)
  const { themes, regionHint } = extractThemes(text)

  let region = cityRegion
  if (region === 'generic' && regionHint) region = regionHint
  if (region === 'generic' && themes.includes('hills')) region = 'rockies'
  if (region === 'generic' && themes.includes('coast')) region = 'pacific_coast'
  if (region === 'generic' && themes.includes('desert')) region = 'southwest'

  const startCity = cities[0] ?? defaultStartForRegion(region)
  const endCity = cities.length > 1 ? cities[cities.length - 1] : null

  return {
    days,
    startCity,
    endCity,
    themes,
    food,
    raw: text,
    region,
  }
}
