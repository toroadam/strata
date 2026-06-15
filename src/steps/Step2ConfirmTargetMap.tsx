import React, { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

const Step2ConfirmTargetMap: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const completeStep = useWizardStore((s) => s.completeStep)
  const [confirmed, setConfirmed] = useState(false)

  if (!selectedCourse) return <div style={{ color: colors.error }}>Please select a course first.</div>

  const handleContinue = () => {
    if (confirmed) {
      completeStep('step2')
      useWizardStore.getState().nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '1.5rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>{selectedCourse.name}</h3>
        <p style={{ margin: 0, color: colors.gray700 }}>ID: {selectedCourse.id}</p>
        <p style={{ margin: '0.5rem 0 0 0', color: colors.gray500 }}>Location: {selectedCourse.location.latitude.toFixed(4)}, {selectedCourse.location.longitude.toFixed(4)}</p>
      </div>
      
      <div style={{ padding: '1rem', backgroundColor: '#eef2f6', borderRadius: '8px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray500 }}>
        [ Mapbox Canvas Placeholder ]
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I confirm this is the correct course/map target.</span>
      </label>

      <button
        onClick={handleContinue}
        disabled={!confirmed}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: confirmed ? colors.toroRed : colors.gray300, color: confirmed ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: confirmed ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        Confirm Target
      </button>
    </div>
  )
}

export default Step2ConfirmTargetMap
