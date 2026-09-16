export type FoodPreference =
  | 'vegetarian'
  | 'vegan'
  | 'seafood'
  | 'local'
  | 'any'

export type TripIntent = {
  days: number
  startCity: string
  endCity: string | null
  themes: string[]
  food: FoodPreference
  raw: string
  region: RouteRegion
}

export type RouteRegion =
  | 'pacific_coast'
  | 'southwest'
  | 'rockies'
  | 'northeast'
  | 'southeast'
  | 'midwest'
  | 'generic'

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
  driveLabel: string
  from: string
  to: string
  mapUrl: string
  stops: ItineraryStop[]
}

export type TripPlan = {
  title: string
  subtitle: string
  intent: TripIntent
  totalDriveMinutes: number
  days: ItineraryDay[]
  tips: string[]
}
