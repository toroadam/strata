import type { LngLat } from '../store/overlayStore'

/**
 * Public-domain aerial imagery providers.
 *
 * These are U.S. government (USGS / USDA NAIP) ArcGIS REST services. Their imagery is
 * public domain and free to redistribute — unlike Google Earth / Esri World Imagery,
 * which are license-restricted and cannot be screenshotted into a published product.
 *
 * Each endpoint is CORS-enabled (`Access-Control-Allow-Origin: *`) so the renderer can
 * fetch the bytes directly and turn them into a data URL, matching the upload flow.
 */
export type AerialSourceId = 'naip' | 'usgs' | 'usgs_labels'

export interface AerialSource {
  id: AerialSourceId
  label: string
  /** One-line description shown under the source pill. */
  description: string
  /** Attribution string stored with the captured overlay. */
  attribution: string
  /** Native ground resolution, for the resolution hint. */
  nativeMetersPerPixel: number
  /** ArcGIS ImageServer uses /exportImage; MapServer uses /export. */
  endpoint: string
  kind: 'ImageServer' | 'MapServer'
}

export const AERIAL_SOURCES: AerialSource[] = [
  {
    id: 'naip',
    label: 'USGS NAIP · 1m aerial',
    description: 'Highest detail. Public-domain leaf-off/leaf-on orthoimagery from the USDA National Agriculture Imagery Program.',
    attribution: 'USDA NAIP / USGS — public domain',
    nativeMetersPerPixel: 1,
    endpoint: 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/exportImage',
    kind: 'ImageServer',
  },
  {
    id: 'usgs',
    label: 'USGS Imagery',
    description: 'Clean aerial basemap with no labels — good clean canvas for course features.',
    attribution: 'USGS The National Map — public domain',
    nativeMetersPerPixel: 1,
    endpoint: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/export',
    kind: 'MapServer',
  },
  {
    id: 'usgs_labels',
    label: 'USGS Imagery + labels',
    description: 'Aerial with roads and place labels — helps confirm you framed the right property.',
    attribution: 'USGS The National Map — public domain',
    nativeMetersPerPixel: 1,
    endpoint: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/export',
    kind: 'MapServer',
  },
]

export const getAerialSource = (id: AerialSourceId): AerialSource =>
  AERIAL_SOURCES.find((s) => s.id === id) ?? AERIAL_SOURCES[0]

/** A lng/lat bounding box: [west, south, east, north]. */
export type BBox = [west: number, south: number, east: number, north: number]

export interface OverlayCorners {
  topLeft: LngLat
  topRight: LngLat
  bottomRight: LngLat
  bottomLeft: LngLat
}

const R = 6378137
const clampLat = (lat: number) => Math.max(-85.05112878, Math.min(85.05112878, lat))
const lonToX = (lon: number) => (R * lon * Math.PI) / 180
const latToY = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + (clampLat(lat) * Math.PI) / 360))

/**
 * Corners of a geographic bbox, in the [TL, TR, BR, BL] convention the overlay store uses.
 * Because the capture is requested in Web Mercator, these corners line the raster up
 * pixel-perfectly on a Mapbox `image` source — no manual alignment required.
 */
export const bboxToCorners = ([w, s, e, n]: BBox): OverlayCorners => ({
  topLeft: [w, n],
  topRight: [e, n],
  bottomRight: [e, s],
  bottomLeft: [w, s],
})

/**
 * Pick a pixel size for the request that keeps pixels square in Web Mercator and respects
 * the ArcGIS single-request cap (4096). `longEdge` is the target long-edge resolution.
 */
export const sizeForBBox = (bbox: BBox, longEdge: number): { width: number; height: number } => {
  const [w, s, e, n] = bbox
  const mercW = Math.abs(lonToX(e) - lonToX(w))
  const mercH = Math.abs(latToY(n) - latToY(s))
  const cap = 4000
  const target = Math.min(longEdge, cap)
  if (mercW >= mercH) {
    const width = target
    const height = Math.max(1, Math.round((target * mercH) / mercW))
    return { width, height }
  }
  const height = target
  const width = Math.max(1, Math.round((target * mercW) / mercH))
  return { width, height }
}

const buildUrl = (source: AerialSource, bbox: BBox, width: number, height: number): string => {
  const [w, s, e, n] = bbox
  const params = new URLSearchParams({
    bbox: `${w},${s},${e},${n}`,
    bboxSR: '4326',
    imageSR: '3857',
    size: `${width},${height}`,
    format: 'png',
    transparent: 'false',
    f: 'image',
  })
  return `${source.endpoint}?${params.toString()}`
}

/**
 * A Mapbox raster tile-URL template for showing a source as a live slippy basemap.
 * Uses the `{bbox-epsg-3857}` token Mapbox fills per tile — so it must be built as a raw
 * string (URLSearchParams would percent-encode the braces).
 */
export const tileTemplate = (source: AerialSource): string =>
  `${source.endpoint}?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=false&f=image`

export interface CaptureResult {
  dataUrl: string
  width: number
  height: number
  corners: OverlayCorners
  attribution: string
  sizeBytes: number
  capturedAt: string
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read captured imagery.'))
    reader.readAsDataURL(blob)
  })

/**
 * Capture a georeferenced aerial still for the given bbox from a public-domain source.
 * Returns a data URL plus the exact corner coordinates so the overlay is already aligned.
 */
export const captureAerial = async (
  sourceId: AerialSourceId,
  bbox: BBox,
  longEdge = 4096,
): Promise<CaptureResult> => {
  const source = getAerialSource(sourceId)
  const { width, height } = sizeForBBox(bbox, longEdge)
  const url = buildUrl(source, bbox, width, height)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`${source.label} returned ${res.status}. Try again or pick another source.`)

  // ArcGIS reports failures as a 200 with a JSON body rather than an image.
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    let message = `${source.label} did not return imagery for this area (it may be outside U.S. coverage).`
    try {
      const body = await res.json()
      if (body?.error?.message) message = `${source.label}: ${body.error.message}`
    } catch {
      /* keep the default message */
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const dataUrl = await blobToDataUrl(blob)

  return {
    dataUrl,
    width,
    height,
    corners: bboxToCorners(bbox),
    attribution: source.attribution,
    sizeBytes: blob.size,
    capturedAt: new Date().toISOString(),
  }
}
