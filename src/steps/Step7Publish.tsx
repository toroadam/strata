import React, { useState, useEffect } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore } from '../store/checklistStore'
import { usePublishStore } from '../store/publishStore'
import { useWizardStore } from '../store/wizardStore'
import { useUIStore } from '../store/uiStore'
import { colors } from '../styles/tokens'
import { Icons, Button, EnvBadge } from '../components/ui'
import { localExportAdapter, type PublishPayload } from '../services/localExportAdapter'

const Step7Publish: React.FC = () => {
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const checklist = useChecklistStore((s) => s.checklist)
  const setResult = usePublishStore((s) => s.setResult)
  const completeStep = useWizardStore((s) => s.completeStep)
  const currentStep = useWizardStore((s) => s.currentStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const [confirmed, setConfirmed] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    setCurrentStepIsValid(confirmed)
  }, [confirmed, setCurrentStepIsValid])

  if (!selectedCourse || !uploadedImage || !overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const handlePublish = async () => {
    if (!confirmed || isPublishing) return
    setIsPublishing(true)
    try {
      const payload: PublishPayload = {
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        environment: selectedCourse.environment,
        image: uploadedImage,
        overlay,
        checklist,
      }
      const result = await localExportAdapter(payload)
      setResult(result)
      if (result.status === 'success') {
        const cs = useCourseStore.getState()
        cs.addOverlay(selectedCourse.id, {
          name: uploadedImage.originalFileName || 'Drone imagery',
          imageUrl: uploadedImage.previewUrl,
          capturedAt: new Date().toISOString(),
          opacity: overlay.opacity,
          coordinates: [
            overlay.coordinates.topLeft,
            overlay.coordinates.topRight,
            overlay.coordinates.bottomRight,
            overlay.coordinates.bottomLeft,
          ],
        })
        cs.publishCourse(selectedCourse.id)
        useUIStore.getState().openCourse(selectedCourse.id)
        useUIStore.getState().setReturnToCourse(selectedCourse.id)
      }
      completeStep(currentStep)
      useWizardStore.getState().nextStep()
    } catch (err) {
      setResult({
        id: `pub-${Date.now()}`,
        status: 'failed',
        publishedAt: new Date().toISOString(),
        destination: selectedCourse.environment,
        errorMessage: err instanceof Error ? err.message : 'Unknown error during publish.',
      })
      useWizardStore.getState().nextStep()
    } finally {
      setIsPublishing(false)
    }
  }

  const rows: [string, React.ReactNode][] = [
    ['Course', selectedCourse.name],
    ['Course ID', <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedCourse.id}</span>],
    ['Environment', <EnvBadge env={selectedCourse.environment} />],
    ['Image', uploadedImage.originalFileName],
    ['Dimensions', `${uploadedImage.width} × ${uploadedImage.height}px`],
    ['Accuracy', <span style={{ textTransform: 'capitalize' }}>{overlay.accuracyLabel.replace(/_/g, ' ')}</span>],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: i === 0 ? 'none' : `1px solid ${colors.gray100}` }}>
            <span style={{ fontSize: 13, color: colors.gray500, fontWeight: 500 }}>{k}</span>
            <span style={{ fontSize: 14, color: colors.ink, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Environment notice */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: colors.warningTint, border: `1px solid #FDE68A`, borderRadius: 12 }}>
        <span style={{ color: colors.warning, marginTop: 1 }}><Icons.Rocket size={18} /></span>
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
          You're publishing to <strong style={{ textTransform: 'capitalize' }}>{selectedCourse.environment}</strong>. Once published, the imagery becomes the active overlay for this course.
        </div>
      </div>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '16px 18px',
        borderRadius: 14, border: `1.5px solid ${confirmed ? colors.success : colors.gray200}`,
        background: confirmed ? colors.successTint : colors.white, transition: 'all 0.18s ease',
      }}>
        <input type="checkbox" className="toro-check" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={isPublishing} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>I understand this will publish imagery to the selected course.</span>
      </label>

      <div>
        <Button variant="primary" size="lg" disabled={!confirmed || isPublishing} onClick={handlePublish}
          iconLeft={isPublishing ? undefined : <Icons.Rocket size={18} />}>
          {isPublishing ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Publishing…
            </span>
          ) : 'Publish imagery'}
        </Button>
      </div>
    </div>
  )
}

export default Step7Publish
