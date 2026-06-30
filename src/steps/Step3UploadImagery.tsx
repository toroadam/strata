import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useUploadStore } from '../store/uploadStore'
import { useWizardStore } from '../store/wizardStore'
import { colors } from '../styles/tokens'
import { validateImageFile, SUPPORTED_TYPES } from '../types/upload'
import { Icons, Button } from '../components/ui'

const Step3UploadImagery: React.FC = () => {
  const { uploadedImage, setUploadedImage, clearUploadedImage } = useUploadStore()
  const completeStep = useWizardStore((s) => s.completeStep)
  const currentStep = useWizardStore((s) => s.currentStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const isValid = !!uploadedImage
    setCurrentStepIsValid(isValid)
    if (isValid) completeStep(currentStep)
  }, [uploadedImage, setCurrentStepIsValid, completeStep, currentStep])

  const processFile = async (file: File) => {
    setError(null)
    const validation = await validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setUploadedImage({
          id: Date.now().toString(),
          originalFileName: file.name,
          previewUrl: e.target?.result as string,
          mimeType: file.type as 'image/png' | 'image/jpeg',
          width: img.width,
          height: img.height,
          sizeBytes: file.size,
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]; if (file) processFile(file)
  }, [])
  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file)
  }, [])
  const handleReplace = () => {
    clearUploadedImage(); setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {!uploadedImage ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '56px 32px',
            border: `2px dashed ${isDragging ? colors.toroRed : colors.gray300}`,
            borderRadius: 18,
            background: isDragging ? colors.toroRedTint : colors.white,
            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
          }}
        >
          <input ref={fileInputRef} type="file" accept={SUPPORTED_TYPES.join(',')} onChange={onSelect} style={{ display: 'none' }} />
          <div style={{ width: 64, height: 64, borderRadius: 999, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.toroRedTint, color: colors.toroRed }}>
            <Icons.Upload size={28} strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: 18, color: colors.ink, marginBottom: 6 }}>Drag & drop your drone image</h3>
          <p style={{ margin: 0, color: colors.gray500, fontSize: 14 }}>
            or <span style={{ color: colors.toroRed, fontWeight: 600 }}>browse to upload</span>
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            {['PNG or JPEG', 'Up to 50 MB', 'Min 2000px'].map((t) => (
              <span key={t} className="badge" style={{ background: colors.gray100, color: colors.gray700 }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}`, maxHeight: 420 }}>
            <img src={uploadedImage.previewUrl} alt="Uploaded course imagery" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div className="badge" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              <Icons.Image size={13} /> Preview
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>File details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                ['Name', uploadedImage.originalFileName],
                ['Format', uploadedImage.mimeType.split('/')[1].toUpperCase()],
                ['Dimensions', `${uploadedImage.width} × ${uploadedImage.height}`],
                ['Size', `${(uploadedImage.sizeBytes / 1024 / 1024).toFixed(2)} MB`],
              ].map(([k, v]) => (
                <div key={k} style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.gray400, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, color: colors.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button variant="secondary" size="sm" onClick={handleReplace} iconLeft={<Icons.Upload size={16} />}>Replace image</Button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '14px 16px', background: colors.errorTint, border: `1px solid ${colors.error}40`, borderRadius: 12, color: colors.error, fontSize: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icons.X size={18} /> {error}
        </div>
      )}
    </div>
  )
}

export default Step3UploadImagery
