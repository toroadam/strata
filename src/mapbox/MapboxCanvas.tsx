import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from './mapboxConfig'
import { useTheme } from '../styles/tokens'

interface MapboxCanvasProps {
  center: [number, number]
  zoom?: number
  className?: string
  onMapLoad?: (map: mapboxgl.Map) => void
  onMouseMove?: (lngLat: { lng: number; lat: number }) => void
  overlayConfig?: {
    imageUrl: string
    coordinates: [number, number][]
    opacity: number
  } | null
}

const MapboxCanvas: React.FC<MapboxCanvasProps> = ({ center, zoom = 14, className = '', onMapLoad, onMouseMove, overlayConfig }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const sandboxLabelRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null)
  const { colors } = useTheme()

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setError('Mapbox token is missing. Please set MAPBOX_TOKEN in your environment variables.')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: MAPBOX_STYLE,
        center: center,
        zoom: zoom,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      const sandboxLabel = document.createElement('div')
      Object.assign(sandboxLabel.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        padding: '4px 8px',
        backgroundColor: colors.charcoal,
        color: colors.white,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        zIndex: '1000'
      })
      sandboxLabel.textContent = 'Sandbox Mode: Changes are not published yet.'
      sandboxLabelRef.current = sandboxLabel
      mapContainerRef.current?.appendChild(sandboxLabelRef.current)

      map.on('load', () => {
        onMapLoad?.(map)
      })

      map.on('mousemove', (e) => {
        const lngLat = e.lngLat
        setCursorCoords({ lng: lngLat.lng, lat: lngLat.lat })
        onMouseMove?.({ lng: lngLat.lng, lat: lngLat.lat })
      })

      mapRef.current = map
    } catch (err) {
      setError('Failed to load Mapbox. Check your token or internet connection.')
      console.error(err)
    }

    return () => {
      mapRef.current?.remove()
      sandboxLabelRef.current?.remove()
    }
  }, [center, zoom])

  useEffect(() => {
    if (!mapRef.current || !overlayConfig) return

    const map = mapRef.current
    const sourceId = 'sandbox-course-image'

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }

    map.addSource(sourceId, {
      type: 'image',
      url: overlayConfig.imageUrl,
      coordinates: overlayConfig.coordinates,
    })

    if (map.getLayer(sourceId)) {
      map.removeLayer(sourceId)
    }

    map.addLayer({
      id: sourceId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': overlayConfig.opacity
      }
    })
  }, [overlayConfig])

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.error, border: `1px solid ${colors.gray300}`, borderRadius: '8px' }}>
        <p>{error}</p>
        <p style={{ fontSize: '0.875rem', color: colors.gray500 }}>Map functionality is disabled until a valid token is provided.</p>
      </div>
    )
  }

  return (
    <div className={className} ref={mapContainerRef} style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      {cursorCoords && (
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '4px 8px', backgroundColor: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: '4px', fontSize: '12px', color: colors.charcoal, zIndex: 1000 }}>
          {cursorCoords.lat.toFixed(5)}, {cursorCoords.lng.toFixed(5)}
        </div>
      )}
    </div>
  )
}

export default MapboxCanvas
