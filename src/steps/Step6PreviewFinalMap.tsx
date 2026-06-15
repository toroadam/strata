import React, { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore } from '../store/checklistStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'
import MapboxCanvas from '../mapbox/MapboxCanvas'

const Step6PreviewFinalMap: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const checklist = useChecklistStore((s) => s.checklist)
  const completeStep = useWizardStore((s) => s.completeStep)
  const [confirmed, setConfirmed] = useState(false)
  const [viewMode, setViewMode] = useState<'after' | 'before'>('after')

  if (!selectedCourse || !uploadedImage || !overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const handleContinue = () => {
    if (confirmed) {
      completeStep('step6')
      useWizardStore.getState().nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '1.5rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>Preview the final map</h3>
        <p style={{ margin: 0, color: colors.gray500 }}>This is how the course imagery will appear after publishing. Review it carefully before continuing.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {['before', 'after'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            style={{ padding: '0.5rem 1rem', backgroundColor: viewMode === mode ? colors.toroRed : colors.white, color: viewMode === mode ? colors.white : colors.charcoal, border: `1px solid ${colors.gray300}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <MapboxCanvas 
        center={[selectedCourse.location.longitude, selectedCourse.location.latitude]} 
        zoom={14}
        overlayConfig={viewMode === 'after' ? { imageUrl: uploadedImage.previewUrl, coordinates: [overlay.coordinates.topLeft, overlay.coordinates.topRight, overlay.coordinates.bottomRight, overlay.coordinates.bottomLeft], opacity: 1 } : null}
      />

      <div style={{ padding: '1rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div><strong>Course:</strong> {selectedCourse.name}</div>
        <div><strong>ID:</strong> {selectedCourse.id}</div>
        <div><strong>Image:</strong> {uploadedImage.originalFileName}</div>
        <div><strong>Size:</strong> {(uploadedImage.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
        <div><strong>Accuracy:</strong> {overlay.accuracyLabel.replace('_', ' ')}</div>
        <div><strong>Checklist:</strong> {Object.values(checklist).every(Boolean) ? 'Complete' : 'Incomplete'}</div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I reviewed the final map preview.</span>
      </label>

      <button
        onClick={handleContinue}
        disabled={!confirmed}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: confirmed ? colors.toroRed : colors.gray300, color: confirmed ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: confirmed ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        Continue to Publish
      </button>
    </div>
  )
}

export default Step6PreviewFinalMap
