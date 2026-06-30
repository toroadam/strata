import React, { useState, useEffect } from 'react'
import { useCourseStore, formatLocation } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore } from '../store/checklistStore'
import { useWizardStore } from '../store/wizardStore'
import { colors } from '../styles/tokens'
import { Icons } from '../components/ui'
import MapboxCanvas from '../mapbox/MapboxCanvas'

const Step6PreviewFinalMap: React.FC = () => {
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const checklist = useChecklistStore((s) => s.checklist)
  const completeStep = useWizardStore((s) => s.completeStep)
  const currentStep = useWizardStore((s) => s.currentStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const [confirmed, setConfirmed] = useState(false)
  const [viewMode, setViewMode] = useState<'before' | 'after'>('after')

  useEffect(() => {
    setCurrentStepIsValid(confirmed)
    if (confirmed) completeStep(currentStep)
  }, [confirmed, setCurrentStepIsValid, completeStep, currentStep])

  if (!selectedCourse || !uploadedImage || !overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const summary: [string, string][] = [
    ['Course', selectedCourse.name],
    ['Location', formatLocation(selectedCourse)],
    ['Course ID', selectedCourse.id],
    ['Image', uploadedImage.originalFileName],
    ['Accuracy', overlay.accuracyLabel.replace(/_/g, ' ')],
    ['Checklist', Object.values(checklist).every(Boolean) ? 'Complete' : 'Incomplete'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Toggle */}
      <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: colors.gray100, borderRadius: 999, padding: 4, gap: 4 }}>
        {(['before', 'after'] as const).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: viewMode === mode ? colors.white : 'transparent',
            color: viewMode === mode ? colors.ink : colors.gray500,
            boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}>
            {mode === 'after' ? <Icons.Layers size={15} /> : <Icons.Globe size={15} />}
            {mode === 'before' ? 'Satellite' : 'With overlay'}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
        <MapboxCanvas
          center={[selectedCourse.location.longitude, selectedCourse.location.latitude]}
          zoom={14}
          height={460}
          initialLoad
          overlayConfig={viewMode === 'after' ? { imageUrl: uploadedImage.previewUrl, coordinates: [overlay.coordinates.topLeft, overlay.coordinates.topRight, overlay.coordinates.bottomRight, overlay.coordinates.bottomLeft], opacity: 1 } : null}
        />
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>Publish summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 24px' }}>
          {summary.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.gray400, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, color: colors.ink, fontWeight: 600, textTransform: k === 'Accuracy' ? 'capitalize' : 'none' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '16px 18px',
        borderRadius: 14, border: `1.5px solid ${confirmed ? colors.success : colors.gray200}`,
        background: confirmed ? colors.successTint : colors.white, transition: 'all 0.18s ease',
      }}>
        <input type="checkbox" className="toro-check" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>The overlay looks correct and is ready to publish.</span>
      </label>
    </div>
  )
}

export default Step6PreviewFinalMap
