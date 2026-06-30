import React from 'react'
import { useCourseStore, formatLocation } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { usePublishStore } from '../store/publishStore'
import { useWizardStore } from '../store/wizardStore'
import { useUIStore } from '../store/uiStore'
import { colors } from '../styles/tokens'
import { Icons, Button, EnvBadge } from '../components/ui'

const Step8Success: React.FC = () => {
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay } = useOverlayStore()
  const result = usePublishStore((s) => s.result)
  const resetWizard = useWizardStore((s) => s.resetWizard)
  const goDashboard = useUIStore((s) => s.goDashboard)

  if (!selectedCourse || !result) return <div style={{ color: colors.error }}>No publish result found.</div>

  const isSuccess = result.status === 'success'

  const handleExport = () => {
    const pkg = {
      publish: result,
      course: selectedCourse,
      image: uploadedImage ? { name: uploadedImage.originalFileName, width: uploadedImage.width, height: uploadedImage.height, sizeBytes: uploadedImage.sizeBytes } : null,
      overlay: overlay ? { opacity: overlay.opacity, coordinates: overlay.coordinates, accuracyLabel: overlay.accuracyLabel, notes: overlay.notes } : null,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCourse.id}-publish-package.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 22, paddingTop: 12 }}>
      <div style={{
        width: 88, height: 88, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isSuccess ? colors.successTint : colors.errorTint,
        color: isSuccess ? colors.success : colors.error,
        boxShadow: isSuccess ? '0 0 0 10px rgba(15,123,63,0.06)' : '0 0 0 10px rgba(192,41,31,0.06)',
      }}>
        {isSuccess ? <Icons.CheckCircle size={44} strokeWidth={2} /> : <Icons.X size={44} strokeWidth={2} />}
      </div>

      <div>
        <h2 style={{ fontSize: 28, color: colors.ink }}>{isSuccess ? 'Imagery published 🎉' : 'Publish failed'}</h2>
        <p style={{ margin: '10px 0 0', fontSize: 15, color: colors.gray500, maxWidth: 460, lineHeight: 1.55 }}>
          {isSuccess
            ? `Your drone imagery for ${selectedCourse.name} is live and processing on Mapbox. Open the course workspace to manage overlays, or export the package.`
            : 'The publish operation encountered an error. Review the details below and try again.'}
        </p>
      </div>

      <div className="card" style={{ padding: 0, width: '100%', maxWidth: 520, overflow: 'hidden', textAlign: 'left' }}>
        {([
          ['Course', selectedCourse.name],
          ['Location', formatLocation(selectedCourse)],
          ['Environment', <EnvBadge env={selectedCourse.environment} />],
          ['Status', <span style={{ color: isSuccess ? colors.success : colors.error, fontWeight: 700 }}>{result.status.toUpperCase()}</span>],
          ['Published', new Date(result.publishedAt).toLocaleString()],
          ['Destination', result.destination || '—'],
        ] as [string, React.ReactNode][]).map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: i === 0 ? 'none' : `1px solid ${colors.gray100}` }}>
            <span style={{ fontSize: 13, color: colors.gray500 }}>{k}</span>
            <span style={{ fontSize: 14, color: colors.ink, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {result.errorMessage && (
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'left', padding: '14px 16px', background: colors.errorTint, border: `1px solid ${colors.error}40`, borderRadius: 12, color: colors.error, fontSize: 13 }}>
          <strong>Error:</strong> {result.errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={() => { goDashboard(); resetWizard() }} iconLeft={<Icons.Grid size={17} />}>Back to dashboard</Button>
        {isSuccess && <Button variant="primary" onClick={handleExport} iconLeft={<Icons.Download size={17} />}>Export package</Button>}
      </div>
    </div>
  )
}

export default Step8Success
