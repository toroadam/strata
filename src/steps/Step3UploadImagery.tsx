import React, { useState, useCallback, useRef } from 'react'
import { useUploadStore } from '../store/uploadStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'
import { validateImageFile, SUPPORTED_TYPES } from '../types/upload'

const Step3UploadImagery: React.FC = () => {
  const { colors } = useTheme()
  const { uploadedImage, setUploadedImage, clearUploadedImage } = useUploadStore()
  const completeStep = useWizardStore((s) => s.completeStep)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [])

  const handleReplace = () => {
    clearUploadedImage()
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleContinue = () => {
    if (uploadedImage) {
      completeStep('step3')
      useWizardStore.getState().nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!uploadedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '3rem 2rem',
            border: `2px dashed ${isDragging ? colors.toroRed : colors.gray300}`,
            borderRadius: '8px',
            backgroundColor: isDragging ? `${colors.toroRed}10` : colors.white,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_TYPES.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>Upload the new course image</h3>
          <p style={{ margin: 0, color: colors.gray500, fontSize: '0.875rem' }}>
            Drag & drop your PNG or JPEG here, or click to browse.<br/>
            Max size: 50 MB • Min dimensions: 2000px
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
            <img src={uploadedImage.previewUrl} alt="Uploaded course imagery" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', backgroundColor: colors.charcoal, color: colors.white, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
              Preview
            </div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>File Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', color: colors.gray700 }}>
              <div><strong>Name:</strong> {uploadedImage.originalFileName}</div>
              <div><strong>Type:</strong> {uploadedImage.mimeType.split('/')[1].toUpperCase()}</div>
              <div><strong>Dimensions:</strong> {uploadedImage.width} × {uploadedImage.height}px</div>
              <div><strong>Size:</strong> {(uploadedImage.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>

          <button
            onClick={handleReplace}
            style={{ padding: '0.5rem 1rem', backgroundColor: colors.white, border: `1px solid ${colors.gray300}`, borderRadius: '6px', cursor: 'pointer', color: colors.charcoal, fontWeight: 500 }}
          >
            Replace Image
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: `${colors.error}15`, border: `1px solid ${colors.error}`, borderRadius: '6px', color: colors.error, fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!uploadedImage}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: uploadedImage ? colors.toroRed : colors.gray300, color: uploadedImage ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: uploadedImage ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        Continue to Alignment
      </button>
    </div>
  )
}

export default Step3UploadImagery
