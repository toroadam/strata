import { MAPBOX_TOKEN } from './mapboxConfig'

export interface GeoResult {
  id: string
  /** Full human-readable place name. */
  placeName: string
  /** Short primary label (first segment of the place name). */
  title: string
  lng: number
  lat: number
  city?: string
  state?: string
}

interface MapboxFeature {
  id: string
  text?: string
  place_name?: string
  center?: [number, number]
  place_type?: string[]
  context?: { id: string; text: string; short_code?: string }[]
}

const extractCityState = (f: MapboxFeature): { city?: string; state?: string } => {
  let city: string | undefined
  let state: string | undefined
  const types = f.place_type ?? []
  if (types.includes('place')) city = f.text
  for (const c of f.context ?? []) {
    if (c.id.startsWith('place') && !city) city = c.text
    if (c.id.startsWith('region')) {
      // Prefer the 2-letter postal code (e.g., "US-MN" -> "MN") when available.
      state = c.short_code ? c.short_code.replace(/^[a-z]{2}-/i, '').toUpperCase() : c.text
    }
  }
  return { city, state }
}

const toResult = (f: MapboxFeature): GeoResult | null => {
  if (!f.center) return null
  const { city, state } = extractCityState(f)
  return {
    id: f.id,
    placeName: f.place_name ?? f.text ?? '',
    title: f.text ?? f.place_name ?? '',
    lng: f.center[0],
    lat: f.center[1],
    city,
    state,
  }
}

/** Forward geocode an address/place query into ranked suggestions. */
export const geocodeForward = async (query: string, limit = 5): Promise<GeoResult[]> => {
  const q = query.trim()
  if (!q || !MAPBOX_TOKEN) return []
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=${limit}` +
    `&types=address,place,poi,locality,neighborhood,region`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.features as MapboxFeature[]).map(toResult).filter((r): r is GeoResult => r !== null)
  } catch {
    return []
  }
}

/** Reverse geocode a coordinate into the nearest place (for map-click pin drops). */
export const reverseGeocode = async (lng: number, lat: number): Promise<GeoResult | null> => {
  if (!MAPBOX_TOKEN) return null
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${MAPBOX_TOKEN}&limit=1&types=place,locality,region,address,poi`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const f = (data.features as MapboxFeature[])[0]
    return f ? toResult(f) : null
  } catch {
    return null
  }
}
