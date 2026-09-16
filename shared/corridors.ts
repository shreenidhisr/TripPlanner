import { INDIA_DESTINATIONS } from './india'
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
  north_india: [
    { name: 'Delhi, DL', vibe: 'Capital launch', activity: 'Early out after metro breakfast', lat: 28.6139, lon: 77.209 },
    { name: 'Agra, UP', vibe: 'Taj sunrise city', activity: 'Taj Mahal morning slot', lat: 27.1767, lon: 78.0081 },
    { name: 'Jaipur, RJ', vibe: 'Pink City forts', activity: 'Amber Fort + old bazaar walk', lat: 26.9124, lon: 75.7873 },
    { name: 'Pushkar, RJ', vibe: 'Desert lake town', activity: 'Evening aarti & cafe stretch', lat: 26.4899, lon: 74.5511 },
    { name: 'Udaipur, RJ', vibe: 'Lake palaces', activity: 'City Palace & sunset lakefront', lat: 24.5854, lon: 73.7125 },
    { name: 'Jodhpur, RJ', vibe: 'Blue city finish', activity: 'Mehrangarh overlook', lat: 26.2389, lon: 73.0243 },
    { name: 'Delhi, DL', vibe: 'Loop home option', activity: 'Buffer evening in the capital', lat: 28.6139, lon: 77.209 },
  ],
  west_india: [
    { name: 'Mumbai, MH', vibe: 'Coastal megacity start', activity: 'Marine Drive stretch before departure', lat: 19.076, lon: 72.8777 },
    { name: 'Lonavala, MH', vibe: 'Ghat viewpoint pause', activity: 'Tiger’s Leap / cafe stop', lat: 18.7481, lon: 73.4072 },
    { name: 'Pune, MH', vibe: 'Deccan city energy', activity: 'FC Road food stop', lat: 18.5204, lon: 73.8567 },
    { name: 'Mahabaleshwar, MH', vibe: 'Strawberry hills', activity: 'Arthur’s Seat overlook', lat: 17.9307, lon: 73.6477 },
    { name: 'Kolhapur, MH', vibe: 'Temple town pause', activity: 'Mahalaxmi temple area walk', lat: 16.705, lon: 74.2433 },
    { name: 'Goa, GA', vibe: 'Beach finish', activity: 'Fontainhas / beach sunset', lat: 15.2993, lon: 74.124 },
    { name: 'Mumbai, MH', vibe: 'Konkan return', activity: 'Evening local dinner', lat: 19.076, lon: 72.8777 },
  ],
  south_india: [
    { name: 'Bengaluru, KA', vibe: 'Garden city launch', activity: 'Early start before traffic', lat: 12.9716, lon: 77.5946 },
    { name: 'Mysuru, KA', vibe: 'Palace city', activity: 'Mysore Palace evening lights', lat: 12.2958, lon: 76.6394 },
    { name: 'Ooty, TN', vibe: 'Nilgiri hills', activity: 'Botanical garden / lake loop', lat: 11.4102, lon: 76.695 },
    { name: 'Coimbatore, TN', vibe: 'Textile city pause', activity: 'Quick city stretch & filter coffee', lat: 11.0168, lon: 76.9558 },
    { name: 'Kochi, KL', vibe: 'Backwaters gateway', activity: 'Fort Kochi sunset walk', lat: 9.9312, lon: 76.2673 },
    { name: 'Munnar, KL', vibe: 'Tea estate ridges', activity: 'Tea museum / viewpoint drive', lat: 10.0889, lon: 77.0595 },
    { name: 'Bengaluru, KA', vibe: 'Return south', activity: 'Buffer night in the city', lat: 12.9716, lon: 77.5946 },
  ],
  east_india: [
    { name: 'Kolkata, WB', vibe: 'Cultural capital start', activity: 'Howrah / riverside coffee', lat: 22.5726, lon: 88.3639 },
    { name: 'Shantiniketan, WB', vibe: 'Tagore town calm', activity: 'Campus walk & local crafts', lat: 23.68, lon: 87.68 },
    { name: 'Siliguri, WB', vibe: 'Doars gateway', activity: 'Overnight base for hills', lat: 26.7271, lon: 88.3953 },
    { name: 'Darjeeling, WB', vibe: 'Tea hills', activity: 'Tiger Hill sunrise / Mall Road', lat: 27.036, lon: 88.2627 },
    { name: 'Kalimpong, WB', vibe: 'Eastern Himalaya town', activity: 'Durpin Dara viewpoint', lat: 27.0669, lon: 88.4753 },
    { name: 'Gangtok, SK', vibe: 'Sikkim capital', activity: 'MG Marg evening stroll', lat: 27.3389, lon: 88.6065 },
    { name: 'Kolkata, WB', vibe: 'Return east', activity: 'Mishti & metro evening', lat: 22.5726, lon: 88.3639 },
  ],
  himalayas: [
    { name: 'Delhi, DL', vibe: 'Plains launch', activity: 'Early highway exit north', lat: 28.6139, lon: 77.209 },
    { name: 'Chandigarh, CH', vibe: 'Planned-city pause', activity: 'Sector 17 stretch stop', lat: 30.7333, lon: 76.7794 },
    { name: 'Shimla, HP', vibe: 'Colonial ridge town', activity: 'Mall Road evening', lat: 31.1048, lon: 77.1734 },
    { name: 'Manali, HP', vibe: 'Beas valley base', activity: 'Old Manali cafe walk', lat: 32.2396, lon: 77.1887 },
    { name: 'Kullu, HP', vibe: 'Valley town', activity: 'River viewpoint pull-off', lat: 31.9579, lon: 77.1095 },
    { name: 'Rishikesh, UK', vibe: 'Ganga foothills', activity: 'Laxman Jhula sunset', lat: 30.0869, lon: 78.2676 },
    { name: 'Delhi, DL', vibe: 'Return plains', activity: 'Buffer night in the capital', lat: 28.6139, lon: 77.209 },
  ],
  generic: [
    { name: 'Mumbai, MH', vibe: 'Open-road / rail launch', activity: 'Snacks, tickets, playlist set', lat: 19.076, lon: 72.8777 },
    { name: 'Lonavala, MH', vibe: 'Ghat views', activity: 'Viewpoint pull-off', lat: 18.7481, lon: 73.4072 },
    { name: 'Pune, MH', vibe: 'City pause', activity: 'Short downtown stretch', lat: 18.5204, lon: 73.8567 },
    { name: 'Satara, MH', vibe: 'Highway town', activity: 'Quick thali stop', lat: 17.6805, lon: 74.0183 },
    { name: 'Kolhapur, MH', vibe: 'Temple city', activity: 'Evening temple walk', lat: 16.705, lon: 74.2433 },
    { name: 'Belagavi, KA', vibe: 'Border pause', activity: 'Overnight base', lat: 15.8497, lon: 74.4977 },
    { name: 'Goa, GA', vibe: 'Coastal finish', activity: 'Beach sunset', lat: 15.2993, lon: 74.124 },
  ],
}

/** Known city coordinates for fast geocode without Nominatim. */
export const CITY_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries([
  ...Object.values(ROUTES)
    .flat()
    .map((w) => [w.name.toLowerCase(), { lat: w.lat, lon: w.lon }] as const),
  ...INDIA_DESTINATIONS.map(
    (p) => [`${p.name.toLowerCase()}, ${p.state.toLowerCase()}`, { lat: p.lat, lon: p.lon }] as const,
  ),
  ...INDIA_DESTINATIONS.map((p) => [p.name.toLowerCase(), { lat: p.lat, lon: p.lon }] as const),
])
