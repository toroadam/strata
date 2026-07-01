import React, { useState, useEffect, useMemo } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore, type LngLat } from '../store/overlayStore'
import { useWizardStore } from '../store/wizardStore'
import { useDestinationStore } from '../store/destinationStore'
import { colors } from '../styles/tokens'
import { Icons, Button } from '../components/ui'
import MapboxCanvas from '../mapbox/MapboxCanvas'

type Coords = { topLeft: LngLat; topRight: LngLat; bottomRight: LngLat; bottomLeft: LngLat }

const BASEMAPS: { id: string; label: string; style: string }[] = [
  { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets', label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'light', label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', label: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'outdoors', label: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12' },
]

const seedCoordinates = (lng: number, lat: number, aspect: number): Coords => {
  const base = 0.0045
  const cos = Math.max(0.2, Math.cos((lat * Math.PI) / 180))
  let halfLng: number, halfLat: number
  if (aspect >= 1) { halfLat = base; halfLng = (base * aspect) / cos }
  else { halfLng = base / cos; halfLat = base / aspect }
  return {
    topLeft: [lng - halfLng, lat + halfLat],
    topRight: [lng + halfLng, lat + halfLat],
    bottomRight: [lng + halfLng, lat - halfLat],
    bottomLeft: [lng - halfLng, lat - halfLat],
  }
}

const translate = (c: Coords, dLng: number, dLat: number): Coords => ({
  topLeft: [c.topLeft[0] + dLng, c.topLeft[1] + dLat],
  topRight: [c.topRight[0] + dLng, c.topRight[1] + dLat],
  bottomRight: [c.bottomRight[0] + dLng, c.bottomRight[1] + dLat],
  bottomLeft: [c.bottomLeft[0] + dLng, c.bottomLeft[1] + dLat],
})

const scale = (c: Coords, factor: number): Coords => {
  const cx = (c.topLeft[0] + c.bottomRight[0]) / 2
  const cy = (c.topLeft[1] + c.bottomRight[1]) / 2
  const f = (p: LngLat): LngLat => [cx + (p[0] - cx) * factor, cy + (p[1] - cy) * factor]
  return { topLeft: f(c.topLeft), topRight: f(c.topRight), bottomRight: f(c.bottomRight), bottomLeft: f(c.bottomLeft) }
}

const Step4AlignImagery: React.FC = () => {
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay, setOverlay, updateOpacity, updateCoordinates, resetOverlay } = useOverlayStore()
  const currentStep = useWizardStore((s) => s.currentStep)
  const completeStep = useWizardStore((s) => s.completeStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const destination = useDestinationStore((s) => s.destination)
  const [cursor, setCursor] = useState<{ lng: number; lat: number } | null>(null)
  // The chosen destination map is the primary basemap so alignment happens on the real target.
  const basemaps = useMemo(() => {
    if (destination && !BASEMAPS.some((b) => b.style === destination.styleUrl)) {
      return [{ id: 'target', label: 'Target map', style: destination.styleUrl }, ...BASEMAPS]
    }
    return BASEMAPS
  }, [destination])
  const [basemap, setBasemap] = useState(basemaps[0])
  const [showOutline, setShowOutline] = useState(true)

  const isAutoAligned = !!uploadedImage?.capturedCorners

  // Seed an initial overlay so the user always has something to align. Captured imagery is
  // georeferenced, so it seeds onto its exact corners already aligned; uploads get a rough box.
  useEffect(() => {
    if (!overlay && selectedCourse && uploadedImage) {
      const aspect = uploadedImage.width / uploadedImage.height
      setOverlay({
        id: `ov-${Date.now()}`,
        opacity: 0.7,
        coordinates: uploadedImage.capturedCorners
          ?? seedCoordinates(selectedCourse.location.longitude, selectedCourse.location.latitude, aspect),
        accuracyLabel: uploadedImage.capturedCorners ? 'visually_aligned' : 'rough_placement',
        notes: '',
        updatedAt: new Date().toISOString(),
      })
    }
  }, [overlay, selectedCourse, uploadedImage, setOverlay])

  useEffect(() => {
    setCurrentStepIsValid(!!overlay)
    if (overlay) completeStep(currentStep)
  }, [overlay, setCurrentStepIsValid, completeStep, currentStep])

  // Stable identities so mousemove-driven re-renders don't reset the map view or re-seed the overlay.
  const mapCenter = useMemo<[number, number]>(
    () => [selectedCourse?.location.longitude ?? 0, selectedCourse?.location.latitude ?? 0],
    [selectedCourse?.location.longitude, selectedCourse?.location.latitude],
  )
  const overlayConfig = useMemo(
    () => (overlay && uploadedImage
      ? {
          imageUrl: uploadedImage.previewUrl,
          coordinates: [overlay.coordinates.topLeft, overlay.coordinates.topRight, overlay.coordinates.bottomRight, overlay.coordinates.bottomLeft] as [number, number][],
          opacity: overlay.opacity,
          outline: showOutline,
        }
      : null),
    [overlay, uploadedImage, showOutline],
  )

  if (!selectedCourse || !uploadedImage) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const step = 0.00015
  const nudge = (dLng: number, dLat: number) => { if (overlay) updateCoordinates(translate(overlay.coordinates, dLng, dLat)) }
  const resize = (factor: number) => { if (overlay) updateCoordinates(scale(overlay.coordinates, factor)) }
  const reseed = () => {
    const aspect = uploadedImage.width / uploadedImage.height
    if (overlay) updateCoordinates(
      uploadedImage.capturedCorners
        ?? seedCoordinates(selectedCourse.location.longitude, selectedCourse.location.latitude, aspect),
    )
  }

  // Handle/marker drags return the 4 corners in [TL, TR, BR, BL] order.
  const handleOverlayChange = (next: [number, number][]) => {
    if (!overlay || next.length !== 4) return
    updateCoordinates({ topLeft: next[0], topRight: next[1], bottomRight: next[2], bottomLeft: next[3] })
  }

  const NudgeBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: 10,
      border: `1px solid ${colors.gray200}`, background: colors.white, color: colors.ink, cursor: 'pointer',
      fontSize: 16, fontWeight: 700, transition: 'all 0.15s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.gray50; e.currentTarget.style.borderColor = colors.gray300 }}
      onMouseLeave={(e) => { e.currentTarget.style.background = colors.white; e.currentTarget.style.borderColor = colors.gray200 }}
    >{children}</button>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isAutoAligned && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 14px', background: colors.toroRedTint, borderRadius: 12, color: colors.ink }}>
            <Icons.Sparkles size={17} style={{ color: colors.toroRed, flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.45 }}>
              <strong>Already aligned.</strong> This capture is georeferenced, so it's placed exactly over the course. Only adjust if you want to fine-tune. Use <strong>Reset placement</strong> to snap back.
            </div>
          </div>
        )}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
          <MapboxCanvas
            center={mapCenter}
            zoom={14}
            height={620}
            initialLoad
            showSandboxLabel
            mapStyle={basemap.style}
            editableOverlay
            onOverlayChange={handleOverlayChange}
            overlayConfig={overlayConfig}
            onMouseMove={(lngLat) => setCursor(lngLat)}
        />
        </div>
      </div>

      <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Sliders size={18} style={{ color: colors.toroRed }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>Alignment tools</span>
        </div>

        <div style={{ fontSize: 12.5, color: colors.gray500, lineHeight: 1.5, padding: '10px 12px', background: colors.gray50, borderRadius: 10 }}>
          Drag the <strong style={{ color: colors.ink }}>corner dots</strong> to stretch &amp; warp, or the <strong style={{ color: colors.ink }}>red handle</strong> above the image to rotate.
        </div>

        {/* Base map */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Base map</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {basemaps.map((b) => {
              const active = basemap.id === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setBasemap(b)}
                  style={{
                    padding: '6px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${active ? colors.toroRed : colors.gray200}`,
                    background: active ? colors.toroRed : colors.white,
                    color: active ? '#fff' : colors.body, transition: 'all 0.15s ease',
                  }}
                >{b.label}</button>
              )
            })}
          </div>
          <div style={{ fontSize: 11.5, color: colors.gray400, marginTop: 6 }}>Switch backgrounds for clearer contrast under your imagery.</div>
        </div>

        {/* Opacity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>Opacity</span>
            <span style={{ fontSize: 13, color: colors.gray500 }}>{Math.round((overlay?.opacity ?? 0.7) * 100)}%</span>
          </div>
          <input type="range" className="toro-range" min={0} max={1} step={0.01} value={overlay?.opacity ?? 0.7} onChange={(e) => updateOpacity(parseFloat(e.target.value))} />
        </div>

        {/* Outline toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" className="toro-check" checked={showOutline} onChange={(e) => setShowOutline(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>Show image outline</span>
        </label>

        {/* Position */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Position</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            <div />
            <NudgeBtn onClick={() => nudge(0, step)}>↑</NudgeBtn>
            <div />
            <NudgeBtn onClick={() => nudge(-step, 0)}>←</NudgeBtn>
            <NudgeBtn onClick={reseed}><Icons.Pin size={15} /></NudgeBtn>
            <NudgeBtn onClick={() => nudge(step, 0)}>→</NudgeBtn>
            <div />
            <NudgeBtn onClick={() => nudge(0, -step)}>↓</NudgeBtn>
            <div />
          </div>
        </div>

        {/* Scale */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Size</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <NudgeBtn onClick={() => resize(0.96)}>−</NudgeBtn>
            <NudgeBtn onClick={() => resize(1.04)}>+</NudgeBtn>
          </div>
        </div>

        {/* Cursor */}
        <div style={{ padding: '10px 12px', background: colors.gray50, borderRadius: 10 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.gray400, marginBottom: 4 }}>Cursor</div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: colors.ink }}>
            {cursor ? `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}` : 'Hover the map'}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={resetOverlay} iconLeft={<Icons.X size={15} />}>Reset placement</Button>
      </div>
    </div>
  )
}

export default Step4AlignImagery
