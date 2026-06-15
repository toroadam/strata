import React from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { usePublishStore } from '../store/publishStore'
import { useTheme } from '../styles/tokens'

const Step8Success: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const result = usePublishStore((s) => s.result)

  if (!selectedCourse || !result) return <div style={{ color: colors.error }}>No publish result found.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
      <h2 style={{ margin: 0, color: colors.charcoal }}>Course imagery published successfully</h2>
      <p style={{ margin: '0 0 1rem 0', color: colors.gray500 }}>The updated imagery has been published to the selected course. You can review the final map below or open the exported package.</p>

      <div style={{ padding: '1.5rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}`, width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'left' }}>
          <div><strong>Course:</strong> {selectedCourse.name}</div>
          <div><strong>ID:</strong> {selectedCourse.id}</div>
          <div><strong>Environment:</strong> {selectedCourse.environment}</div>
          <div><strong>Status:</strong> {result.status.toUpperCase()}</div>
          <div><strong>Published At:</strong> {new Date(result.publishedAt).toLocaleString()}</div>
          <div><strong>Destination:</strong> {result.destination}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{ padding: '0.75rem 1.5rem', backgroundColor: colors.white, border: `1px solid ${colors.gray300}`, borderRadius: '6px', cursor: 'pointer', color: colors.charcoal }}>View Published Map</button>
        <button style={{ padding: '0.75rem 1.5rem', backgroundColor: colors.toroRed, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Export Package</button>
      </div>
    </div>
  )
}

export default Step8Success
