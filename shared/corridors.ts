import type { RouteRegion } from './types'

export type Waypoint = {
  name: string
  vibe: string
  activity: string
  lat: number
  lon: number
}

export const ROUTES: Record<RouteRegion, Waypoint[]> = {
  pacific_coast: [
    { name: 'San Francisco, CA', vibe: 'Foggy start, bridge views', activity: 'Embarcadero stroll before wheels roll', lat: 37.7749, lon: -122.4194 },
    { name: 'Half Moon Bay, CA', vibe: 'Cliffside highway', activity: 'Pull-off at coastal overlook', lat: 37.4636, lon: -122.4286 },
    { name: 'Santa Cruz, CA', vibe: 'Surf town energy', activity: 'Boardwalk walk and snack stop', lat: 36.9741, lon: -122.0308 },
    { name: 'Monterey, CA', vibe: 'Cannery Row calm', activity: '17-Mile Drive scenic loop', lat: 36.6002, lon: -121.8947 },
    { name: 'Big Sur, CA', vibe: 'Dramatic cliffs', activity: 'Bixby Bridge photo stop', lat: 36.2704, lon: -121.8081 },
    { name: 'San Luis Obispo, CA', vibe: 'Central coast pause', activity: 'Downtown window stroll', lat: 35.2828, lon: -120.6596 },
    { name: 'Santa Barbara, CA', vibe: 'Palm-lined finish', activity: 'Waterfront sunset', lat: 34.4208, lon: -119.6982 },
  ],
  southwest: [
    { name: 'Phoenix, AZ', vibe: 'Desert launch', activity: 'Coffee and cooler stock-up', lat: 33.4484, lon: -112.074 },
    { name: 'Sedona, AZ', vibe: 'Red rock amphitheater', activity: 'Airport Mesa overlook', lat: 34.8697, lon: -111.761 },
    { name: 'Flagstaff, AZ', vibe: 'High-country pines', activity: 'Historic downtown stretch', lat: 35.1983, lon: -111.6513 },
    { name: 'Grand Canyon Village, AZ', vibe: 'Rim-of-the-world views', activity: 'South Rim walk', lat: 36.0544, lon: -112.1401 },
    { name: 'Page, AZ', vibe: 'Slot canyon country', activity: 'Lake Powell overlook', lat: 36.9147, lon: -111.4558 },
    { name: 'Monument Valley, UT', vibe: 'Iconic mesas', activity: 'Valley Drive viewpoints', lat: 36.9982, lon: -110.0986 },
    { name: 'Moab, UT', vibe: 'Arches gateway', activity: 'Delicate Arch trailhead', lat: 38.5733, lon: -109.5498 },
    { name: 'Canyonlands NP, UT', vibe: 'Island in the Sky', activity: 'Mesa Arch overlook', lat: 38.4598, lon: -109.821 },
  ],
  rockies: [
    { name: 'Denver, CO', vibe: 'Mile-high launch', activity: 'Early departure toward the Front Range', lat: 39.7392, lon: -104.9903 },
    { name: 'Boulder, CO', vibe: 'Flatiron foothills', activity: 'Pearl Street stretch stop', lat: 40.015, lon: -105.2705 },
    { name: 'Estes Park, CO', vibe: 'Mountain gateway', activity: 'Lake Estes shoreline walk', lat: 40.3772, lon: -105.5217 },
    { name: 'Rocky Mountain NP, CO', vibe: 'Alpine ridges', activity: 'Trail Ridge Road viewpoints', lat: 40.3428, lon: -105.6836 },
    { name: 'Hot Sulphur Springs, CO', vibe: 'Quiet valley', activity: 'River overlook pull-off', lat: 40.073, lon: -106.1028 },
    { name: 'Glenwood Springs, CO', vibe: 'Canyon town', activity: 'Glenwood Canyon rest stop', lat: 39.5505, lon: -107.3248 },
    { name: 'Aspen, CO', vibe: 'High-country finish', activity: 'Maroon Bells overlook', lat: 39.1911, lon: -106.8175 },
  ],
  northeast: [
    { name: 'Boston, MA', vibe: 'Harbor departure', activity: 'Quick North End espresso', lat: 42.3601, lon: -71.0589 },
    { name: 'Portsmouth, NH', vibe: 'Seacoast charm', activity: 'Market Square wander', lat: 43.0718, lon: -70.7626 },
    { name: 'Portland, ME', vibe: 'Working waterfront', activity: 'Old Port stroll', lat: 43.6591, lon: -70.2568 },
    { name: 'Camden, ME', vibe: 'Harbor hills', activity: 'Mt. Battie overlook', lat: 44.2098, lon: -69.0648 },
    { name: 'Bar Harbor, ME', vibe: 'Acadia gateway', activity: 'Park Loop Road highlights', lat: 44.3876, lon: -68.2039 },
    { name: 'Acadia NP, ME', vibe: 'Granite coast', activity: 'Cadillac Mountain sunrise (or golden hour)', lat: 44.3386, lon: -68.2733 },
    { name: 'Portland, ME', vibe: 'Return coast', activity: 'Evening waterfront dinner', lat: 43.6591, lon: -70.2568 },
  ],
  southeast: [
    { name: 'Asheville, NC', vibe: 'Blue Ridge launch', activity: 'Downtown coffee before the parkway', lat: 35.5951, lon: -82.5515 },
    { name: 'Blue Ridge Parkway, NC', vibe: 'Endless ridgelines', activity: 'Craggy Gardens overlook', lat: 35.702, lon: -82.374 },
    { name: 'Cherokee, NC', vibe: 'Mountain gateway', activity: 'Oconaluftee River walk', lat: 35.472, lon: -83.319 },
    { name: 'Great Smoky Mountains NP, TN', vibe: 'Misty peaks', activity: 'Newfound Gap overlook', lat: 35.6118, lon: -83.425 },
    { name: 'Gatlinburg, TN', vibe: 'Mountain town', activity: 'Short downtown stretch', lat: 35.7143, lon: -83.5102 },
    { name: 'Knoxville, TN', vibe: 'River city pause', activity: 'Market Square wander', lat: 35.9606, lon: -83.9207 },
    { name: 'Asheville, NC', vibe: 'Loop home', activity: 'Evening brewery patio', lat: 35.5951, lon: -82.5515 },
  ],
  midwest: [
    { name: 'Chicago, IL', vibe: 'Lakefront launch', activity: 'Early out along Lake Shore Drive', lat: 41.8781, lon: -87.6298 },
    { name: 'Madison, WI', vibe: 'Capitol isthmus', activity: 'State Street stretch', lat: 43.0731, lon: -89.4012 },
    { name: 'Wisconsin Dells, WI', vibe: 'River bluffs', activity: 'Scenic overlook pull-off', lat: 43.6275, lon: -89.771 },
    { name: 'Minneapolis, MN', vibe: 'Twin Cities pulse', activity: 'Stone Arch Bridge walk', lat: 44.9778, lon: -93.265 },
    { name: 'Duluth, MN', vibe: 'Great Lakes shore', activity: 'Canal Park stroll', lat: 46.7867, lon: -92.1005 },
    { name: 'North Shore, MN', vibe: 'Superior drama', activity: 'Split Rock Lighthouse stop', lat: 47.2002, lon: -91.3668 },
    { name: 'Minneapolis, MN', vibe: 'Return south', activity: 'Evening neighborhood dinner', lat: 44.9778, lon: -93.265 },
  ],
  generic: [
    { name: 'Denver, CO', vibe: 'Open-road launch', activity: 'Fuel, snacks, playlist set', lat: 39.7392, lon: -104.9903 },
    { name: 'Colorado Springs, CO', vibe: 'Front Range views', activity: 'Garden of the Gods loop', lat: 38.8339, lon: -104.8214 },
    { name: 'Pueblo, CO', vibe: 'River corridor', activity: 'Quick park stretch', lat: 38.2544, lon: -104.6091 },
    { name: 'Salida, CO', vibe: 'Mountain town', activity: 'Downtown river walk', lat: 38.5347, lon: -105.9989 },
    { name: 'Buena Vista, CO', vibe: 'Peak country', activity: 'Arkansas River overlook', lat: 38.8422, lon: -106.1311 },
    { name: 'Leadville, CO', vibe: 'High alpine', activity: 'Historic Main Street stroll', lat: 39.2508, lon: -106.2925 },
    { name: 'Vail, CO', vibe: 'Valley finish', activity: 'Village evening wander', lat: 39.6403, lon: -106.3742 },
  ],
}

/** Known city coordinates for fast geocode without Nominatim. */
export const CITY_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  Object.values(ROUTES)
    .flat()
    .map((w) => [w.name.toLowerCase(), { lat: w.lat, lon: w.lon }]),
)
