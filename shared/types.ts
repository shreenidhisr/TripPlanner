export type FoodPreference =
  | 'vegetarian'
  | 'vegan'
  | 'seafood'
  | 'local'
  | 'any'

export type RouteRegion =
  | 'pacific_coast'
  | 'southwest'
  | 'rockies'
  | 'northeast'
  | 'southeast'
  | 'midwest'
  | 'generic'

export type TripIntent = {
  days: number
  startCity: string
  endCity: string | null
  themes: string[]
  food: FoodPreference
  raw: string
  region: RouteRegion
}

export type StopType = 'drive' | 'sight' | 'food' | 'lodging' | 'activity'

export type ItineraryStop = {
  id: string
  time: string
  title: string
  detail: string
  type: StopType
  durationMinutes?: number
  mapUrl?: string
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
  stops: ItineraryStop[]
}

export type PlanMeta = {
  engine: 'heuristic' | 'llm'
  routing: 'estimated' | 'osrm'
  generatedAt: string
  model?: string
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
}

export type GenerateRequest = {
  notes: string
}

export type GenerateResponse = {
  plan: TripPlan
}

export type HealthResponse = {
  ok: true
  llm: boolean
  routing: 'osrm'
}
