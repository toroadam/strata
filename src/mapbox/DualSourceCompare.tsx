import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN } from './mapboxConfig'
import { getAerialSource, tileTemplate, type AerialSourceId, type BBox } from '../services/imagerySources'
import { colors } from '../styles/tokens'

interface Props {
  center: [number, number]
  zoom?: number
  height?: number
  /** Which public-domain source to render live on the right map. */
  sourceId: AerialSourceId
  /** Receives the (shared) left map so the parent can read bounds for capture. */
  onMapLoad?: (map: mapboxgl.Map) => void
  /** Fired on move end with the current shared bounds. */
  onBoundsChange?: (bbox: BBox) => void
}

const RASTER_SOURCE = 'aerial-src'
const RASTER_LAYER = 'aerial-layer'
const emptyStyle: mapboxgl.StyleSpecification = { version: 8, sources: {}, layers: [] }

/**
 * Side-by-side compare: left shows the current Mapbox satellite imagery, right shows the
 * selected public-domain source as a live basemap. Panning/zooming either map moves both,
 * so the user can judge the source against what they have before capturing.
 */
const DualSourceCompare: React.FC<Props> = ({ center, zoom = 15, height = 520, sourceId, onMapLoad, onBoundsChange }) => {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const leftMapRef = useRef<mapboxgl.Map | null>(null)
  const rightMapRef = useRef<mapboxgl.Map | null>(null)
  const syncingRef = useRef(false)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const [error, setError] = useState<string | null>(null)
  onBoundsChangeRef.current = onBoundsChange

  // Create both maps once and keep them in sync.
  useEffect(() => {
    if (leftMapRef.current || !leftRef.current || !rightRef.current) return
    if (!MAPBOX_TOKEN) { setError('Mapbox token is missing. Set VITE_MAPBOX_TOKEN.'); return }
    mapboxgl.accessToken = MAPBOX_TOKEN

    const left = new mapboxgl.Map({
      container: leftRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center, zoom, attributionControl: false,
    })
    left.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const right = new mapboxgl.Map({
      container: rightRef.current,
      style: emptyStyle,
      center, zoom, attributionControl: false,
    })

    const addAerial = () => {
      const tpl = tileTemplate(getAerialSource(sourceId))
      if (right.getLayer(RASTER_LAYER)) right.removeLayer(RASTER_LAYER)
      if (right.getSource(RASTER_SOURCE)) right.removeSource(RASTER_SOURCE)
      right.addSource(RASTER_SOURCE, { type: 'raster', tiles: [tpl], tileSize: 256, attribution: 'USGS / USDA NAIP — public domain' })
      right.addLayer({ id: RASTER_LAYER, type: 'raster', source: RASTER_SOURCE, paint: { 'raster-fade-duration': 0 } })
    }
    right.on('load', addAerial)

    // Keep the two views locked together (guard against move-event feedback loops).
    const sync = (from: mapboxgl.Map, to: mapboxgl.Map) => {
      from.on('move', () => {
        if (syncingRef.current) return
        syncingRef.current = true
        to.jumpTo({ center: from.getCenter(), zoom: from.getZoom(), bearing: from.getBearing(), pitch: from.getPitch() })
        syncingRef.current = false
      })
    }
    sync(left, right)
    sync(right, left)

    const emit = () => {
      const b = left.getBounds()
      if (b) onBoundsChangeRef.current?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    }
    left.on('moveend', emit)
    left.on('load', () => { emit(); onMapLoad?.(left) })

    leftMapRef.current = left
    rightMapRef.current = right

    return () => { left.remove(); right.remove(); leftMapRef.current = null; rightMapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — init once

  // Swap the right-hand source when the selection changes.
  useEffect(() => {
    const right = rightMapRef.current
    if (!right || !right.isStyleLoaded()) return
    const tpl = tileTemplate(getAerialSource(sourceId))
    const src = right.getSource(RASTER_SOURCE) as mapboxgl.RasterTileSource | undefined
    if (src?.setTiles) src.setTiles([tpl])
    else {
      if (right.getLayer(RASTER_LAYER)) right.removeLayer(RASTER_LAYER)
      if (right.getSource(RASTER_SOURCE)) right.removeSource(RASTER_SOURCE)
      right.addSource(RASTER_SOURCE, { type: 'raster', tiles: [tpl], tileSize: 256 })
      right.addLayer({ id: RASTER_LAYER, type: 'raster', source: RASTER_SOURCE, paint: { 'raster-fade-duration': 0 } })
    }
  }, [sourceId])

  if (error) {
    return <div style={{ padding: 24, textAlign: 'center', color: colors.error, border: `1px solid ${colors.gray300}`, borderRadius: 12 }}>{error}</div>
  }

  const Label: React.FC<{ text: string }> = ({ text }) => (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, padding: '5px 11px', background: 'rgba(31,35,40,0.82)', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>{text}</div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
        <Label text="Current · Mapbox satellite" />
        <div ref={leftRef} style={{ width: '100%', height }} />
      </div>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
        <Label text={`Source · ${getAerialSource(sourceId).label}`} />
        <div ref={rightRef} style={{ width: '100%', height }} />
      </div>
    </div>
  )
}

export default DualSourceCompare
