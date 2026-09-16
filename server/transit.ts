import {
  confirmtktSearchUrl,
  findTrainCorridor,
  irctcSearchUrl,
  redbusSearchUrl,
} from '../shared/india'
import type { ItineraryDay, TravelMode } from '../shared/types'
import type { Waypoint } from '../shared/corridors'

function cityKey(name: string) {
  return name.split(',')[0].trim()
}

export function enrichTransitStops(
  days: ItineraryDay[],
  waypoints: Waypoint[],
  mode: TravelMode,
): { days: ItineraryDay[]; routing: 'transit' | null } {
  if (mode !== 'train' && mode !== 'bus') {
    return { days, routing: null }
  }

  const next = days.map((day, i) => {
    const from = waypoints[i]
    const to = waypoints[i + 1]
    if (!from || !to || from.name === to.name) return day

    if (mode === 'train') {
      const corridor = findTrainCorridor(cityKey(from.name), cityKey(to.name))
      if (corridor) {
        const train = corridor.trains[i % corridor.trains.length]
        const minutes = Math.round(train.approxHours * 60)
        const bookingUrl = confirmtktSearchUrl(corridor.fromCode, corridor.toCode)
        const stops = day.stops.map((stop) => {
          if (stop.id.endsWith('depart') || stop.type === 'drive') {
            return {
              ...stop,
              type: 'transit' as const,
              title: `${train.name} (${train.number})`,
              detail: `${corridor.fromCode} → ${corridor.toCode} · ~${train.approxHours} hr · book on IRCTC / ConfirmTkt`,
              durationMinutes: Math.round(minutes * 0.55),
              bookingUrl,
              mapUrl: bookingUrl,
            }
          }
          return stop
        })
        return {
          ...day,
          driveMinutes: minutes,
          driveLabel: `${train.approxHours} hr train`,
          transitHint: `${train.name} · ${corridor.fromCode}-${corridor.toCode}`,
          mapUrl: irctcSearchUrl(corridor.fromCode, corridor.toCode),
          stops,
          mode,
        }
      }

      const bookingUrl = `https://www.irctc.co.in/nget/train-search`
      return {
        ...day,
        mode,
        transitHint: `Search IRCTC for ${cityKey(from.name)} → ${cityKey(to.name)}`,
        stops: day.stops.map((stop) =>
          stop.type === 'drive'
            ? {
                ...stop,
                type: 'transit' as const,
                title: `Train ${cityKey(from.name)} → ${cityKey(to.name)}`,
                detail: 'No curated corridor match—search IRCTC for live trains & seat availability.',
                bookingUrl,
                mapUrl: bookingUrl,
              }
            : stop,
        ),
      }
    }

    // bus
    const bookingUrl = redbusSearchUrl(cityKey(from.name), cityKey(to.name))
    return {
      ...day,
      mode,
      transitHint: `Bus ${cityKey(from.name)} → ${cityKey(to.name)}`,
      mapUrl: bookingUrl,
      driveLabel: day.driveLabel.replace('driving', 'bus'),
      stops: day.stops.map((stop) =>
        stop.type === 'drive'
          ? {
              ...stop,
              type: 'transit' as const,
              title: `Bus ${cityKey(from.name)} → ${cityKey(to.name)}`,
              detail: 'Check redBus / AbhiBus for Volvo sleeper & daytime AC coaches.',
              bookingUrl,
              mapUrl: bookingUrl,
            }
          : stop,
      ),
    }
  })

  return { days: next, routing: 'transit' }
}
