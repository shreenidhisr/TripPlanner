import type { TripPlan } from '../../shared/types'

const STORAGE_KEY = 'tripplanner.saved.v1'

export type SavedTrip = {
  savedAt: string
  plan: TripPlan
}

export function listSavedTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTrip[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTrip(plan: TripPlan): SavedTrip[] {
  const next: SavedTrip[] = [
    { savedAt: new Date().toISOString(), plan },
    ...listSavedTrips().filter((t) => t.plan.id !== plan.id),
  ].slice(0, 12)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function deleteSavedTrip(id: string): SavedTrip[] {
  const next = listSavedTrips().filter((t) => t.plan.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function encodeShareUrl(plan: TripPlan): string {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(plan))))
  const url = new URL(window.location.href)
  url.hash = `trip=${payload}`
  return url.toString()
}

export function readSharedPlan(): TripPlan | null {
  try {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash.startsWith('trip=')) return null
    const payload = hash.slice('trip='.length)
    const json = decodeURIComponent(escape(atob(payload)))
    return JSON.parse(json) as TripPlan
  } catch {
    return null
  }
}

export function clearShareHash() {
  if (window.location.hash.startsWith('#trip=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
