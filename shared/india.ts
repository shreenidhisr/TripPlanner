import type { NearbyDestination, TravelMode } from './types'

export type IndiaPlace = {
  name: string
  state: string
  vibe: string
  lat: number
  lon: number
  bestModes: TravelMode[]
  tags: string[]
}

/** Popular India destinations for nearby suggestions + corridors. */
export const INDIA_DESTINATIONS: IndiaPlace[] = [
  { name: 'Mumbai', state: 'MH', vibe: 'Coastal megacity', lat: 19.076, lon: 72.8777, bestModes: ['train', 'car', 'bus'], tags: ['city', 'west'] },
  { name: 'Pune', state: 'MH', vibe: 'Deccan plateau city', lat: 18.5204, lon: 73.8567, bestModes: ['car', 'bus', 'train', 'bike'], tags: ['city', 'west'] },
  { name: 'Goa', state: 'GA', vibe: 'Beaches & Portuguese lanes', lat: 15.2993, lon: 74.124, bestModes: ['car', 'bus', 'train', 'bike'], tags: ['beach', 'west'] },
  { name: 'Lonavala', state: 'MH', vibe: 'Western Ghats hill station', lat: 18.7481, lon: 73.4072, bestModes: ['car', 'bike', 'train'], tags: ['hills', 'west'] },
  { name: 'Nashik', state: 'MH', vibe: 'Wine & temple town', lat: 19.9975, lon: 73.7898, bestModes: ['car', 'bus'], tags: ['west'] },
  { name: 'Delhi', state: 'DL', vibe: 'Capital hub', lat: 28.6139, lon: 77.209, bestModes: ['train', 'car', 'bus', 'bike'], tags: ['city', 'north'] },
  { name: 'Agra', state: 'UP', vibe: 'Taj Mahal & forts', lat: 27.1767, lon: 78.0081, bestModes: ['train', 'car', 'bus'], tags: ['heritage', 'north'] },
  { name: 'Jaipur', state: 'RJ', vibe: 'Pink City palaces', lat: 26.9124, lon: 75.7873, bestModes: ['train', 'car', 'bus'], tags: ['heritage', 'north'] },
  { name: 'Udaipur', state: 'RJ', vibe: 'Lake city romance', lat: 24.5854, lon: 73.7125, bestModes: ['car', 'bus', 'train'], tags: ['heritage', 'north'] },
  { name: 'Jodhpur', state: 'RJ', vibe: 'Blue city desert edge', lat: 26.2389, lon: 73.0243, bestModes: ['car', 'bus', 'train'], tags: ['desert', 'north'] },
  { name: 'Rishikesh', state: 'UK', vibe: 'Ganga & yoga valleys', lat: 30.0869, lon: 78.2676, bestModes: ['car', 'bus', 'train'], tags: ['hills', 'north', 'himalayas'] },
  { name: 'Manali', state: 'HP', vibe: 'Himalayan adventure base', lat: 32.2396, lon: 77.1887, bestModes: ['car', 'bus'], tags: ['hills', 'himalayas'] },
  { name: 'Shimla', state: 'HP', vibe: 'Colonial hill capital', lat: 31.1048, lon: 77.1734, bestModes: ['car', 'bus', 'train'], tags: ['hills', 'himalayas'] },
  { name: 'Amritsar', state: 'PB', vibe: 'Golden Temple city', lat: 31.634, lon: 74.8723, bestModes: ['train', 'car', 'bus'], tags: ['heritage', 'north'] },
  { name: 'Varanasi', state: 'UP', vibe: 'Ghats & old city lanes', lat: 25.3176, lon: 82.9739, bestModes: ['train', 'car', 'bus'], tags: ['heritage', 'east'] },
  { name: 'Lucknow', state: 'UP', vibe: 'Nawabi food capital', lat: 26.8467, lon: 80.9462, bestModes: ['train', 'car', 'bus'], tags: ['city', 'north'] },
  { name: 'Kolkata', state: 'WB', vibe: 'Cultural capital', lat: 22.5726, lon: 88.3639, bestModes: ['train', 'car', 'bus', 'bike'], tags: ['city', 'east'] },
  { name: 'Darjeeling', state: 'WB', vibe: 'Tea hills & toy train', lat: 27.036, lon: 88.2627, bestModes: ['car', 'bus', 'train'], tags: ['hills', 'east', 'himalayas'] },
  { name: 'Bengaluru', state: 'KA', vibe: 'Garden city start', lat: 12.9716, lon: 77.5946, bestModes: ['car', 'bus', 'train', 'bike'], tags: ['city', 'south'] },
  { name: 'Mysuru', state: 'KA', vibe: 'Palace city weekend', lat: 12.2958, lon: 76.6394, bestModes: ['car', 'bus', 'train'], tags: ['heritage', 'south'] },
  { name: 'Chennai', state: 'TN', vibe: 'Marina & temples', lat: 13.0827, lon: 80.2707, bestModes: ['train', 'car', 'bus'], tags: ['city', 'south'] },
  { name: 'Pondicherry', state: 'PY', vibe: 'French quarter coast', lat: 11.9416, lon: 79.8083, bestModes: ['car', 'bus', 'bike'], tags: ['beach', 'south'] },
  { name: 'Madurai', state: 'TN', vibe: 'Temple town south', lat: 9.9252, lon: 78.1198, bestModes: ['train', 'car', 'bus'], tags: ['heritage', 'south'] },
  { name: 'Kochi', state: 'KL', vibe: 'Backwaters gateway', lat: 9.9312, lon: 76.2673, bestModes: ['train', 'car', 'bus'], tags: ['coast', 'south'] },
  { name: 'Munnar', state: 'KL', vibe: 'Tea estate hills', lat: 10.0889, lon: 77.0595, bestModes: ['car', 'bus'], tags: ['hills', 'south'] },
  { name: 'Hyderabad', state: 'TS', vibe: 'Biryani & charminar', lat: 17.385, lon: 78.4867, bestModes: ['train', 'car', 'bus', 'bike'], tags: ['city', 'south'] },
  { name: 'Ahmedabad', state: 'GJ', vibe: 'Heritage & food trail', lat: 23.0225, lon: 72.5714, bestModes: ['train', 'car', 'bus'], tags: ['city', 'west'] },
  { name: 'Udaipur', state: 'RJ', vibe: 'Lakes & old city', lat: 24.5854, lon: 73.7125, bestModes: ['car', 'bus', 'train'], tags: ['heritage', 'west'] },
  { name: 'Leh', state: 'LA', vibe: 'High-altitude desert', lat: 34.1526, lon: 77.5771, bestModes: ['car', 'bike'], tags: ['hills', 'himalayas'] },
  { name: 'Srinagar', state: 'JK', vibe: 'Dal Lake houseboats', lat: 34.0837, lon: 74.7973, bestModes: ['car', 'bus', 'bike'], tags: ['hills', 'himalayas'] },
]

export type TrainCorridor = {
  from: string
  to: string
  fromCode: string
  toCode: string
  trains: Array<{ name: string; number: string; approxHours: number }>
}

/** Curated popular IRCTC-style corridors (not live inventory). */
export const INDIA_TRAIN_CORRIDORS: TrainCorridor[] = [
  {
    from: 'Mumbai',
    to: 'Pune',
    fromCode: 'CSMT',
    toCode: 'PUNE',
    trains: [
      { name: 'Deccan Queen', number: '12123', approxHours: 3.5 },
      { name: 'Intercity Express', number: '12127', approxHours: 3.5 },
    ],
  },
  {
    from: 'Delhi',
    to: 'Jaipur',
    fromCode: 'NDLS',
    toCode: 'JP',
    trains: [
      { name: 'Ajmer Shatabdi', number: '12015', approxHours: 4.5 },
      { name: 'Double Decker', number: '12985', approxHours: 5 },
    ],
  },
  {
    from: 'Delhi',
    to: 'Agra',
    fromCode: 'NDLS',
    toCode: 'AGC',
    trains: [
      { name: 'Gatimaan Express', number: '12049', approxHours: 1.7 },
      { name: 'Taj Express', number: '12280', approxHours: 3 },
    ],
  },
  {
    from: 'Bengaluru',
    to: 'Mysuru',
    fromCode: 'SBC',
    toCode: 'MYS',
    trains: [
      { name: 'Tippu Express', number: '12613', approxHours: 2.5 },
      { name: 'Chamundi Express', number: '16215', approxHours: 3 },
    ],
  },
  {
    from: 'Chennai',
    to: 'Madurai',
    fromCode: 'MAS',
    toCode: 'MDU',
    trains: [
      { name: 'Pandian SF', number: '12637', approxHours: 7.5 },
      { name: 'Vaigai SF', number: '12635', approxHours: 7 },
    ],
  },
  {
    from: 'Mumbai',
    to: 'Goa',
    fromCode: 'LTT',
    toCode: 'MAO',
    trains: [
      { name: 'Mandovi Express', number: '10103', approxHours: 11 },
      { name: 'Konkan Kanya', number: '10111', approxHours: 12 },
    ],
  },
  {
    from: 'Delhi',
    to: 'Rishikesh',
    fromCode: 'NDLS',
    toCode: 'RKSH',
    trains: [
      { name: 'Yoga Express', number: '19031', approxHours: 7 },
      { name: 'Jan Shatabdi', number: '12055', approxHours: 6 },
    ],
  },
  {
    from: 'Kolkata',
    to: 'Darjeeling',
    fromCode: 'HWH',
    toCode: 'NJP',
    trains: [
      { name: 'Darjeeling Mail', number: '12343', approxHours: 10 },
      { name: 'Kanchan Kanya', number: '13149', approxHours: 11 },
    ],
  },
  {
    from: 'Hyderabad',
    to: 'Bengaluru',
    fromCode: 'HYB',
    toCode: 'SBC',
    trains: [
      { name: 'Kacheguda YPR Express', number: '12785', approxHours: 11 },
      { name: 'Rajdhani / SF options', number: '12735', approxHours: 10 },
    ],
  },
  {
    from: 'Ahmedabad',
    to: 'Udaipur',
    fromCode: 'ADI',
    toCode: 'UDZ',
    trains: [
      { name: 'Udaipur City Express', number: '12991', approxHours: 8 },
      { name: 'Ashram Express leg / SF', number: '12915', approxHours: 9 },
    ],
  },
]

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function nearbyIndiaDestinations(
  lat: number,
  lon: number,
  opts?: { limit?: number; maxKm?: number; mode?: TravelMode },
): NearbyDestination[] {
  const limit = opts?.limit ?? 8
  const maxKm = opts?.maxKm ?? 650
  const mode = opts?.mode

  return INDIA_DESTINATIONS.map((place) => {
    const distanceKm = Math.round(haversineKm({ lat, lon }, place) * 10) / 10
    return {
      name: place.name,
      state: place.state,
      vibe: place.vibe,
      distanceKm,
      lat: place.lat,
      lon: place.lon,
      bestModes: place.bestModes,
    }
  })
    .filter((p) => p.distanceKm > 15 && p.distanceKm <= maxKm)
    .filter((p) => (mode ? p.bestModes.includes(mode) : true))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

export function nearestIndiaPlace(lat: number, lon: number): IndiaPlace | null {
  let best: IndiaPlace | null = null
  let bestKm = Infinity
  for (const place of INDIA_DESTINATIONS) {
    const km = haversineKm({ lat, lon }, place)
    if (km < bestKm) {
      bestKm = km
      best = place
    }
  }
  return best
}

export function irctcSearchUrl(_fromCode: string, _toCode: string): string {
  // IRCTC requires login for booking; deep-link users to the portal.
  return `https://www.irctc.co.in/nget/train-search`
}

export function confirmtktSearchUrl(fromCode: string, toCode: string): string {
  return `https://www.confirmtkt.com/train-schedule/${fromCode}-${toCode}`
}

export function redbusSearchUrl(fromCity: string, toCity: string): string {
  const from = encodeURIComponent(fromCity.toLowerCase())
  const to = encodeURIComponent(toCity.toLowerCase())
  return `https://www.redbus.in/bus-tickets/${from}-to-${to}`
}

export function findTrainCorridor(fromCity: string, toCity: string): TrainCorridor | null {
  const a = fromCity.split(',')[0].trim().toLowerCase()
  const b = toCity.split(',')[0].trim().toLowerCase()
  return (
    INDIA_TRAIN_CORRIDORS.find(
      (c) =>
        (c.from.toLowerCase() === a && c.to.toLowerCase() === b) ||
        (c.from.toLowerCase() === b && c.to.toLowerCase() === a),
    ) ?? null
  )
}
