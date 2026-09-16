export type FoodPreference =
  | 'vegetarian'
  | 'vegan'
  | 'seafood'
  | 'local'
  | 'any'

export type TravelMode = 'car' | 'bike' | 'bus' | 'train'

export type LlmProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter'

export type RouteRegion =
  | 'pacific_coast'
  | 'southwest'
  | 'rockies'
  | 'northeast'
  | 'southeast'
  | 'midwest'
  | 'north_india'
  | 'west_india'
  | 'south_india'
  | 'east_india'
  | 'himalayas'
  | 'generic'

export type TripIntent = {
  days: number
  startCity: string
  endCity: string | null
  themes: string[]
  food: FoodPreference
  raw: string
  region: RouteRegion
  mode: TravelMode
}

export type StopType = 'drive' | 'sight' | 'food' | 'lodging' | 'activity' | 'transit'

export type ItineraryStop = {
  id: string
  time: string
  title: string
  detail: string
  type: StopType
  durationMinutes?: number
  mapUrl?: string
  bookingUrl?: string
}

export type ItineraryDay = {
  day: number
  title: string
  summary: string
  driveMinutes: number
  driveMiles?: number
  driveLabel: string
  from: string
  to: string
  mapUrl: string
  mode: TravelMode
  stops: ItineraryStop[]
  transitHint?: string
}

export type PlanMeta = {
  engine: 'heuristic' | 'llm'
  routing: 'estimated' | 'osrm' | 'transit'
  places: 'none' | 'overpass'
  generatedAt: string
  model?: string
  provider?: LlmProvider
  mode: TravelMode
}

export type TripPlan = {
  id: string
  title: string
  subtitle: string
  intent: TripIntent
  totalDriveMinutes: number
  totalDriveMiles?: number
  days: ItineraryDay[]
  tips: string[]
  meta: PlanMeta
  nearbySuggestions?: NearbyDestination[]
}

export type NearbyDestination = {
  name: string
  state: string
  vibe: string
  distanceKm: number
  lat: number
  lon: number
  bestModes: TravelMode[]
}

export type GenerateRequest = {
  notes: string
  mode?: TravelMode
  location?: { lat: number; lon: number; label?: string }
  destinationHint?: string
}

export type GenerateResponse = {
  plan: TripPlan
}

export type HealthResponse = {
  ok: true
  llm: boolean
  routing: 'osrm'
  places: 'overpass'
  database: boolean
  regionFocus: 'india'
}

export type UserSettingsPublic = {
  preferredProvider: LlmProvider
  preferredModel: string
  preferredMode: TravelMode
  configuredProviders: LlmProvider[]
  homeCity?: string | null
}
