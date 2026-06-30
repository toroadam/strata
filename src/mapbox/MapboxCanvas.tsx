import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from './mapboxConfig'
import { useTheme } from '../styles/tokens'
import LoadingState from '../components/LoadingState'

interface MapboxCanvasProps {
  center: [number, number]
  zoom?: number
  className?: string
  onMapLoad?: (map: mapboxgl.Map) => void
  onMouseMove?: (lngLat: { lng: number; lat: number }) => void
  onClick?: (lngLat: { lng: number; lat: number }) => void
  markerPosition?: { lng: number; lat: number } | null
  /** Allow the marker to be dragged to a new position. */
  draggableMarker?: boolean
  /** Called with the new position when the marker is dropped. */
  onMarkerDragEnd?: (lngLat: { lng: number; lat: number }) => void
  height?: string | number
  overlayConfig?: {
    imageUrl: string
    coordinates: [number, number][]
    opacity: number
    /** Draw a dashed outline around the image bounds (helps alignment at low opacity). */
    outline?: boolean
  } | null
  initialLoad?: boolean
  /** Show the "Sandbox Mode" pill (only meaningful during alignment). */
  showSandboxLabel?: boolean
  /** Mapbox style URL. Switching at runtime re-applies the overlay. */
  mapStyle?: string
  /** Render draggable corner + rotate handles on the overlay (alignment step). */
  editableOverlay?: boolean
  /** Called with the 4 updated corner coordinates (TL, TR, BR, BL) on handle drag/rotate. */
  onOverlayChange?: (coordinates: [number, number][]) => void
}

const MapboxCanvas: React.FC<MapboxCanvasProps> = ({ center, zoom = 14, className = '', onMapLoad, onMouseMove, onClick, markerPosition, overlayConfig, initialLoad = false, height, showSandboxLabel = false, mapStyle, editableOverlay = false, onOverlayChange, draggableMarker = false, onMarkerDragEnd }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const nativeMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const sandboxLabelRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const overlaySourceId = 'sandbox-course-image'
  const outlineLayerId = 'sandbox-course-image-outline'
  const outlineSourceId = 'sandbox-course-image-outline-src'
  const stemLayerId = 'sandbox-rotate-stem'
  const stemSourceId = 'sandbox-rotate-stem-src'
  const cornerMarkersRef = useRef<mapboxgl.Marker[]>([])
  const rotateMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const rotatingRef = useRef(false)
  const overlayConfigRef = useRef(overlayConfig)
  const onOverlayChangeRef = useRef(onOverlayChange)
  const onMarkerDragEndRef = useRef(onMarkerDragEnd)
  const onClickRef = useRef(onClick)
  const currentStyleRef = useRef<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [styleEpoch, setStyleEpoch] = useState(0)
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null)
  const { colors } = useTheme()

  overlayConfigRef.current = overlayConfig
  onOverlayChangeRef.current = onOverlayChange
  onMarkerDragEndRef.current = onMarkerDragEnd
  onClickRef.current = onClick

  // (Re)apply the raster overlay + dashed outline. `fit` only frames the bounds on first creation.
  const applyOverlay = useCallback((fit: boolean) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const cfg = overlayConfigRef.current

    if (!cfg) {
      if (map.getLayer(overlaySourceId)) map.setPaintProperty(overlaySourceId, 'raster-opacity', 0)
      if (map.getLayer(outlineLayerId)) map.setLayoutProperty(outlineLayerId, 'visibility', 'none')
      return
    }

    const coords = cfg.coordinates as [[number, number], [number, number], [number, number], [number, number]]

    // Raster image source/layer
    if (map.getSource(overlaySourceId)) {
      ;(map.getSource(overlaySourceId) as any).updateImage({ url: cfg.imageUrl, coordinates: coords })
      if (map.getLayer(overlaySourceId)) map.setPaintProperty(overlaySourceId, 'raster-opacity', cfg.opacity)
    } else {
      map.addSource(overlaySourceId, { type: 'image', url: cfg.imageUrl, coordinates: coords })
      map.addLayer({ id: overlaySourceId, type: 'raster', source: overlaySourceId, paint: { 'raster-opacity': cfg.opacity, 'raster-fade-duration': 0 } })
      if (fit) {
        const bounds: mapboxgl.LngLatBoundsLike = [
          [Math.min(coords[0][0], coords[2][0]), Math.min(coords[0][1], coords[2][1])],
          [Math.max(coords[0][0], coords[2][0]), Math.max(coords[0][1], coords[2][1])],
        ]
        map.fitBounds(bounds, { padding: 60, maxZoom: 18 })
      }
    }

    // Dashed outline around the image bounds
    const ring = [coords[0], coords[1], coords[2], coords[3], coords[0]]
    const outlineData = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ring } } as any
    if (map.getSource(outlineSourceId)) {
      ;(map.getSource(outlineSourceId) as any).setData(outlineData)
    } else {
      map.addSource(outlineSourceId, { type: 'geojson', data: outlineData })
      map.addLayer({ id: outlineLayerId, type: 'line', source: outlineSourceId, paint: { 'line-color': '#D71920', 'line-width': 2, 'line-dasharray': [2, 1.5] } })
    }
    map.setLayoutProperty(outlineLayerId, 'visibility', cfg.outline ? 'visible' : 'none')
  }, [])

  const applyOverlayRef = useRef(applyOverlay)
  applyOverlayRef.current = applyOverlay

  // Create map once only
  useEffect(() => {
    if (hasLoadedRef.current || !mapContainerRef.current) return

    if (!MAPBOX_TOKEN) {
      setError('Mapbox token is missing. Please set MAPBOX_TOKEN in your environment variables.')
      setIsInitialized(true)
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN
    isLoadingRef.current = true

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: center,
        zoom: zoom,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      if (showSandboxLabel) {
        const sandboxLabel = document.createElement('div')
        Object.assign(sandboxLabel.style, {
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '5px 11px',
          backgroundColor: 'rgba(31,35,40,0.82)',
          color: '#fff',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '600',
          backdropFilter: 'blur(4px)',
          zIndex: '1000',
        })
        sandboxLabel.textContent = 'Sandbox · not yet published'
        sandboxLabelRef.current = sandboxLabel
        mapContainerRef.current.appendChild(sandboxLabel)
      }

      map.on('load', () => {
        isLoadingRef.current = false
        hasLoadedRef.current = true
        currentStyleRef.current = mapStyle ?? MAPBOX_STYLE
        setIsInitialized(true)
        onMapLoad?.(map)
        applyOverlayRef.current(true)
      })

      map.on('mousemove', (e) => {
        const lngLat = e.lngLat
        setCursorCoords({ lng: lngLat.lng, lat: lngLat.lat })
        onMouseMove?.({ lng: lngLat.lng, lat: lngLat.lat })
      })

      map.on('click', (e) => {
        const lngLat = e.lngLat
        onClickRef.current?.({ lng: lngLat.lng, lat: lngLat.lat })
      })

      mapRef.current = map
    } catch (err) {
      setError('Failed to load Mapbox. Check your token or internet connection.')
      setIsInitialized(true)
      console.error(err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — only init once

  // Fly to new center when props change (without recreating map)
  useEffect(() => {
    if (!mapRef.current || !hasLoadedRef.current) return

    const [lng, lat] = center
    const z = zoom ?? 14
    mapRef.current.flyTo({ center: [lng, lat], zoom: z, duration: 800 })
  }, [center, zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply overlay whenever its config changes (opacity, coordinates, outline toggle) or the base map style swaps.
  useEffect(() => {
    applyOverlayRef.current(true)
  }, [overlayConfig, styleEpoch])

  // Switch base map style at runtime, then re-apply the overlay + handles once the new style is ready.
  useEffect(() => {
    const map = mapRef.current
    const target = mapStyle ?? MAPBOX_STYLE
    if (!map || !hasLoadedRef.current || currentStyleRef.current === target) return
    currentStyleRef.current = target
    map.setStyle(target)
    map.once('idle', () => {
      applyOverlayRef.current(false)
      setStyleEpoch((e) => e + 1)
    })
  }, [mapStyle])

  // Draggable corner handles + rotate handle for interactive alignment.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasLoadedRef.current) return

    const clearHandles = () => {
      cornerMarkersRef.current.forEach((m) => m.remove())
      cornerMarkersRef.current = []
      if (rotateMarkerRef.current) { rotateMarkerRef.current.remove(); rotateMarkerRef.current = null }
      if (map.getLayer(stemLayerId)) map.removeLayer(stemLayerId)
      if (map.getSource(stemSourceId)) map.removeSource(stemSourceId)
    }

    if (!editableOverlay || !overlayConfig) { clearHandles(); return }

    const coords = overlayConfig.coordinates as [number, number][]
    const centroid = (): [number, number] => {
      const c = overlayConfig.coordinates
      return [(c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4, (c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4]
    }

    const cornerEl = () => {
      const el = document.createElement('div')
      Object.assign(el.style, {
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        border: '3px solid #D71920', boxShadow: '0 1px 4px rgba(0,0,0,0.35)', cursor: 'grab',
      })
      return el
    }

    const emitFromMarkers = () => {
      const next = cornerMarkersRef.current.map((m) => {
        const ll = m.getLngLat(); return [ll.lng, ll.lat] as [number, number]
      })
      if (next.length === 4) onOverlayChangeRef.current?.(next)
    }

    // Create corner markers once; otherwise just reposition.
    if (cornerMarkersRef.current.length !== 4) {
      clearHandles()
      cornerMarkersRef.current = coords.map((c, i) => {
        const marker = new mapboxgl.Marker({ element: cornerEl(), draggable: true, anchor: 'center' })
          .setLngLat(c as mapboxgl.LngLatLike)
          .addTo(map)
        marker.on('dragstart', () => { marker.getElement().style.cursor = 'grabbing' })
        marker.on('drag', emitFromMarkers)
        marker.on('dragend', () => { marker.getElement().style.cursor = 'grab'; emitFromMarkers() })
        ;(marker as any)._cornerIndex = i
        return marker
      })
    } else {
      cornerMarkersRef.current.forEach((m, i) => m.setLngLat(coords[i] as mapboxgl.LngLatLike))
    }

    // Rotate handle: sits above the top edge midpoint, on a short stem.
    const cen = centroid()
    const cenPx = map.project(cen as mapboxgl.LngLatLike)
    const topMid: [number, number] = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2]
    const topMidPx = map.project(topMid as mapboxgl.LngLatLike)
    let dx = topMidPx.x - cenPx.x, dy = topMidPx.y - cenPx.y
    const len = Math.hypot(dx, dy) || 1
    dx /= len; dy /= len
    const handlePx = new mapboxgl.Point(topMidPx.x + dx * 34, topMidPx.y + dy * 34)
    const handleLngLat = map.unproject(handlePx)

    const stemData = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [topMid, [handleLngLat.lng, handleLngLat.lat]] } } as any
    if (map.getSource(stemSourceId)) {
      ;(map.getSource(stemSourceId) as any).setData(stemData)
    } else {
      map.addSource(stemSourceId, { type: 'geojson', data: stemData })
      map.addLayer({ id: stemLayerId, type: 'line', source: stemSourceId, paint: { 'line-color': '#D71920', 'line-width': 2 } })
    }

    if (!rotateMarkerRef.current) {
      const rEl = document.createElement('div')
      Object.assign(rEl.style, {
        width: '24px', height: '24px', borderRadius: '50%', background: '#D71920',
        border: '3px solid #fff', boxShadow: '0 1px 5px rgba(0,0,0,0.4)', cursor: 'grab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      })
      rEl.innerHTML = "<svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12a9 9 0 1 1-3-6.7'/><path d='M21 3v5h-5'/></svg>"

      const onMove = (ev: MouseEvent) => {
        const m = mapRef.current
        if (!m || !rotatingRef.current) return
        const rect = m.getContainer().getBoundingClientRect()
        const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top
        const cfg = overlayConfigRef.current
        if (!cfg) return
        const cc = cfg.coordinates
        const ctr: [number, number] = [(cc[0][0] + cc[1][0] + cc[2][0] + cc[3][0]) / 4, (cc[0][1] + cc[1][1] + cc[2][1] + cc[3][1]) / 4]
        const ctrPx = m.project(ctr as mapboxgl.LngLatLike)
        const startAngle = (rEl as any)._startAngle as number
        const startPx = (rEl as any)._startPx as mapboxgl.Point[]
        const cur = Math.atan2(cy - ctrPx.y, cx - ctrPx.x)
        const da = cur - startAngle
        const cosA = Math.cos(da), sinA = Math.sin(da)
        const next = startPx.map((p) => {
          const ox = p.x - ctrPx.x, oy = p.y - ctrPx.y
          const np = new mapboxgl.Point(ctrPx.x + ox * cosA - oy * sinA, ctrPx.y + ox * sinA + oy * cosA)
          const ll = m.unproject(np); return [ll.lng, ll.lat] as [number, number]
        })
        onOverlayChangeRef.current?.(next)
      }
      const onUp = () => {
        rotatingRef.current = false
        rEl.style.cursor = 'grab'
        if (mapRef.current) mapRef.current.dragPan.enable()
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      rEl.addEventListener('mousedown', (ev) => {
        ev.preventDefault(); ev.stopPropagation()
        const m = mapRef.current; const cfg = overlayConfigRef.current
        if (!m || !cfg) return
        rotatingRef.current = true
        rEl.style.cursor = 'grabbing'
        m.dragPan.disable()
        const rect = m.getContainer().getBoundingClientRect()
        const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top
        const cc = cfg.coordinates
        const ctr: [number, number] = [(cc[0][0] + cc[1][0] + cc[2][0] + cc[3][0]) / 4, (cc[0][1] + cc[1][1] + cc[2][1] + cc[3][1]) / 4]
        const ctrPx = m.project(ctr as mapboxgl.LngLatLike)
        ;(rEl as any)._startAngle = Math.atan2(cy - ctrPx.y, cx - ctrPx.x)
        ;(rEl as any)._startPx = cc.map((p) => m.project(p as mapboxgl.LngLatLike))
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      })

      rotateMarkerRef.current = new mapboxgl.Marker({ element: rEl, anchor: 'center' })
        .setLngLat(handleLngLat)
        .addTo(map)
    } else if (!rotatingRef.current) {
      rotateMarkerRef.current.setLngLat(handleLngLat)
    }

    return () => { /* handles persist across coordinate updates; cleared when disabled */ }
  }, [editableOverlay, overlayConfig, styleEpoch, isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps


  // Place / update marker on map
  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasLoadedRef.current) return

    if (nativeMarkerRef.current) {
      nativeMarkerRef.current.remove()
      nativeMarkerRef.current = null
    }

    if (!markerPosition) return

    const el = document.createElement('div')
    el.style.width = '26px'
    el.style.height = '34px'
    el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='34' viewBox='0 0 26 34'%3E%3Cpath fill='%23D71920' stroke='%23fff' stroke-width='2' d='M13 1C6.4 1 1 6.4 1 13c0 8.5 12 20 12 20s12-11.5 12-20C25 6.4 19.6 1 13 1z'/%3E%3Ccircle cx='13' cy='13' r='4.5' fill='%23fff'/%3E%3C/svg%3E")`
    el.style.backgroundSize = 'contain'
    el.style.backgroundRepeat = 'no-repeat'
    el.style.pointerEvents = draggableMarker ? 'auto' : 'none'
    el.style.cursor = draggableMarker ? 'grab' : 'default'

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', draggable: draggableMarker })
      .setLngLat([markerPosition.lng, markerPosition.lat])
      .addTo(map)

    if (draggableMarker) {
      marker.on('dragstart', () => { el.style.cursor = 'grabbing' })
      marker.on('dragend', () => {
        el.style.cursor = 'grab'
        const ll = marker.getLngLat()
        onMarkerDragEndRef.current?.({ lng: ll.lng, lat: ll.lat })
      })
    }

    nativeMarkerRef.current = marker
  }, [markerPosition, draggableMarker, isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.error, border: `1px solid ${colors.gray300}`, borderRadius: '8px' }}>
        <p>{error}</p>
        <p style={{ fontSize: '0.875rem', color: colors.gray500 }}>Map functionality is disabled until a valid token is provided.</p>
      </div>
    )
  }

  const normalizedHeight = height == null ? '400px' : (typeof height === 'number' ? `${height}px` : (/^\d+$/.test(height) ? `${height}px` : height))

  return (
    <div className={className} ref={mapContainerRef} style={{ width: '100%', height: normalizedHeight, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      {!isInitialized && !error && (<LoadingState message="Initializing map..." />)}
      {cursorCoords && isInitialized && (
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '4px 8px', backgroundColor: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: '4px', fontSize: '12px', color: colors.charcoal, zIndex: 1000 }}>
          {cursorCoords.lat.toFixed(5)}, {cursorCoords.lng.toFixed(5)}
        </div>
      )}
    </div>
  )
}

export default MapboxCanvas
