import React, { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'
import MapboxCanvas from '../mapbox/MapboxCanvas'

const Step4AlignImagery: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay, setOverlay, updateOpacity, resetOverlay } = useOverlayStore()
  const completeStep = useWizardStore((s) => s.completeStep)
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null)

  if (!selectedCourse || !uploadedImage) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const handleMapLoad = (map: mapboxgl.Map) => {
    if (!overlay) {
      const center = selectedCourse.location
      const offset = 0.005
      setOverlay({
        id: 'temp-overlay',
        opacity: 0.8,
        coordinates: {
          topLeft: [center.longitude - offset, center.latitude + offset],
          topRight: [center.longitude + offset, center.latitude + offset],
          bottomRight: [center.longitude + offset, center.latitude - offset],
          bottomLeft: [center.longitude - offset, center.latitude - offset],
        },
        accuracyLabel: 'rough_placement',
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const handleContinue = () => {
    if (overlay) {
      completeStep('step4')
      useWizardStore.getState().nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        <MapboxCanvas 
          center={[selectedCourse.location.longitude, selectedCourse.location.latitude]} 
          zoom={14}
          overlayConfig={overlay ? { imageUrl: uploadedImage.previewUrl, coordinates: [overlay.coordinates.topLeft, overlay.coordinates.topRight, overlay.coordinates.bottomRight, overlay.coordinates.bottomLeft], opacity: overlay.opacity } : null}
          onMouseMove={(lngLat) => setCursorCoords(lngLat)}
        />
        
        <div style={{ padding: '1rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, color: colors.charcoal }}>Alignment Tools</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: colors.gray700 }}>Opacity: {Math.round(overlay?.opacity || 0.8) * 100}%</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={overlay?.opacity || 0.8} 
              onChange={(e) => updateOpacity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginTop: 'auto', padding: '0.75rem', backgroundColor: colors.white, borderRadius: '6px', border: `1px solid ${colors.gray200}` }}>
            <div style={{ fontSize: '0.75rem', color: colors.gray500, marginBottom: '0.25rem' }}>Cursor Position</div>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: colors.charcoal }}>
              {cursorCoords ? `${cursorCoords.lat.toFixed(6)}, ${cursorCoords.lng.toFixed(6)}` : 'Hover over map'}
            </div>
          </div>

          <button onClick={resetOverlay} style={{ padding: '0.5rem', backgroundColor: colors.white, border: `1px solid ${colors.gray300}`, borderRadius: '6px', cursor: 'pointer', color: colors.charcoal }}>Reset Placement</button>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!overlay}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: overlay ? colors.toroRed : colors.gray300, color: overlay ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: overlay ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        Continue to Accuracy Check
      </button>
    </div>
  )
}

export default Step4AlignImagery
