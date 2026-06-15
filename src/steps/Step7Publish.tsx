import React, { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore } from '../store/checklistStore'
import { usePublishStore } from '../store/publishStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

const Step7Publish: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const checklist = useChecklistStore((s) => s.checklist)
  const setResult = usePublishStore((s) => s.setResult)
  const completeStep = useWizardStore((s) => s.completeStep)
  const [confirmed, setConfirmed] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  if (!selectedCourse || !uploadedImage || !overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const handlePublish = async () => {
    if (!confirmed) return
    setIsPublishing(true)
    
    // Simulate publish delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock success result
    setResult({
      id: `pub-${Date.now()}`,
      status: 'success',
      publishedAt: new Date().toISOString(),
      destination: `${selectedCourse.environment} → Mapbox Sandbox`,
    })
    
    setIsPublishing(false)
    completeStep('step7')
    useWizardStore.getState().nextStep()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '1.5rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>Publish course imagery</h3>
        <p style={{ margin: 0, color: colors.gray500 }}>You are about to publish this imagery to the selected course. The update will only apply to this course/map target.</p>
      </div>

      <div style={{ padding: '1rem', backgroundColor: colors.white, borderRadius: '8px', border: `1px solid ${colors.gray200}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div><strong>Course:</strong> {selectedCourse.name}</div>
        <div><strong>ID:</strong> {selectedCourse.id}</div>
        <div><strong>Environment:</strong> {selectedCourse.environment}</div>
        <div><strong>Image:</strong> {uploadedImage.originalFileName}</div>
        <div><strong>Accuracy:</strong> {overlay.accuracyLabel.replace('_', ' ')}</div>
        <div><strong>Checklist:</strong> {Object.values(checklist).every(Boolean) ? 'Complete' : 'Incomplete'}</div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I understand this will publish imagery to the selected course.</span>
      </label>

      <button
        onClick={handlePublish}
        disabled={!confirmed || isPublishing}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: (confirmed && !isPublishing) ? colors.toroRed : colors.gray300, color: (confirmed && !isPublishing) ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: (confirmed && !isPublishing) ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        {isPublishing ? 'Publishing...' : 'Publish Imagery'}
      </button>
    </div>
  )
}

export default Step7Publish
