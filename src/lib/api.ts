import type {
  GenerateRequest,
  GenerateResponse,
  HealthResponse,
  LlmProvider,
  NearbyDestination,
  TravelMode,
  TripPlan,
  UserSettingsPublic,
} from '../../shared/types'
import { generateHeuristicPlan } from '../../shared/heuristicPlan'

export type AuthUser = {
  id: string
  email: string
  name: string
  createdAt: string
}

export type CloudTrip = {
  id: string
  planId: string
  title: string
  plan: TripPlan
  createdAt: string
  updatedAt: string
}

async function readError(res: Response, fallback: string) {
  try {
    const err = (await res.json()) as { error?: string }
    if (err.error) return err.error
  } catch {
    // ignore
  }
  return fallback
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}

export async function fetchNearby(opts: {
  lat: number
  lon: number
  mode: TravelMode
}): Promise<NearbyDestination[]> {
  const url = `/api/nearby?lat=${opts.lat}&lon=${opts.lon}&mode=${opts.mode}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await readError(res, 'Could not load nearby destinations'))
  const data = (await res.json()) as { destinations: NearbyDestination[] }
  return data.destinations
}

export async function generatePlanFromApi(input: GenerateRequest): Promise<TripPlan> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not generate itinerary'))
  const data = (await res.json()) as GenerateResponse
  return data.plan
}

export async function generatePlan(input: GenerateRequest): Promise<TripPlan> {
  try {
    return await generatePlanFromApi(input)
  } catch (err) {
    console.warn('API generate failed, using local heuristic', err)
    return generateHeuristicPlan(input.notes, {
      mode: input.mode,
      startOverride: input.location?.label,
    })
  }
}

export async function fetchMe(): Promise<{ user: AuthUser | null; database: boolean }> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) return { user: null, database: false }
    return (await res.json()) as { user: AuthUser | null; database: boolean }
  } catch {
    return { user: null, database: false }
  }
}

export async function register(input: {
  email: string
  password: string
  name?: string
}): Promise<AuthUser> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readError(res, 'Registration failed'))
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readError(res, 'Login failed'))
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function fetchCloudTrips(): Promise<CloudTrip[]> {
  const res = await fetch('/api/trips', { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res, 'Could not load trips'))
  const data = (await res.json()) as { trips: CloudTrip[] }
  return data.trips
}

export async function saveCloudTrip(plan: TripPlan): Promise<CloudTrip> {
  const res = await fetch('/api/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not save trip'))
  const data = (await res.json()) as { trip: CloudTrip }
  return data.trip
}

export async function fetchSettings(): Promise<UserSettingsPublic> {
  const res = await fetch('/api/settings', { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res, 'Could not load settings'))
  const data = (await res.json()) as { settings: UserSettingsPublic }
  return data.settings
}

export async function saveSettings(input: {
  preferredProvider?: LlmProvider
  preferredModel?: string
  preferredMode?: TravelMode
  homeCity?: string | null
  keys?: Partial<Record<LlmProvider, string>>
}): Promise<UserSettingsPublic> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not save settings'))
  const data = (await res.json()) as { settings: UserSettingsPublic }
  return data.settings
}
