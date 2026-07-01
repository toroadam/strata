import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type mapboxgl from 'mapbox-gl'
import { useUploadStore } from '../store/uploadStore'
import { useWizardStore } from '../store/wizardStore'
import { useCourseStore } from '../store/courseStore'
import { colors } from '../styles/tokens'
import { validateImageFile, SUPPORTED_TYPES } from '../types/upload'
import { Icons, Button } from '../components/ui'
import DualSourceCompare from '../mapbox/DualSourceCompare'
import { AERIAL_SOURCES, captureAerial, getAerialSource, sizeForBBox, type AerialSourceId, type BBox } from '../services/imagerySources'

type Method = 'capture' | 'upload'

const DETAIL_LEVELS: { id: string; label: string; longEdge: number }[] = [
  { id: 'standard', label: 'Standard · 2K', longEdge: 2048 },
  { id: 'high', label: 'High · 4K', longEdge: 4000 },
]

const Step3UploadImagery: React.FC = () => {
  const { uploadedImage, setUploadedImage, clearUploadedImage } = useUploadStore()
  const selectedCourse = useCourseStore((s) => s.selectedCourse)
  const completeStep = useWizardStore((s) => s.completeStep)
  const currentStep = useWizardStore((s) => s.currentStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)

  const [method, setMethod] = useState<Method>('capture')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Capture state
  const captureMapRef = useRef<mapboxgl.Map | null>(null)
  const [sourceId, setSourceId] = useState<AerialSourceId>('naip_plus')
  const [detail, setDetail] = useState(DETAIL_LEVELS[1])
  const [capturing, setCapturing] = useState(false)
  const [viewBounds, setViewBounds] = useState<BBox | null>(null)

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
          source: 'upload',
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

  const handleCapture = async () => {
    const map = captureMapRef.current
    if (!map || !selectedCourse) return
    setError(null)
    setCapturing(true)
    try {
      const b = map.getBounds()
      if (!b) throw new Error('Map is not ready yet — give it a moment and try again.')
      const bbox: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      const source = getAerialSource(sourceId)
      const result = await captureAerial(sourceId, bbox, detail.longEdge)
      setUploadedImage({
        id: Date.now().toString(),
        originalFileName: `${source.label.replace(/[^\w]+/g, '-').toLowerCase()}-${Date.now()}.png`,
        previewUrl: result.dataUrl,
        mimeType: 'image/png',
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        source: sourceId,
        capturedCorners: result.corners,
        attribution: result.attribution,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed. Try another source or area.')
    } finally {
      setCapturing(false)
    }
  }

  const mapCenter: [number, number] = selectedCourse
    ? [selectedCourse.location.longitude, selectedCourse.location.latitude]
    : [0, 0]

  const readBounds = useCallback((m: mapboxgl.Map) => {
    const b = m.getBounds()
    if (b) setViewBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  }, [])

  const onCaptureMapLoad = useCallback((m: mapboxgl.Map) => {
    captureMapRef.current = m
    readBounds(m)
    m.on('moveend', () => readBounds(m))
  }, [readBounds])

  // Live estimate of what the current framing will yield, so users judge quality before capturing.
  const readout = useMemo(() => {
    if (!viewBounds) return null
    const [w, s, e, n] = viewBounds
    const { width } = sizeForBBox(viewBounds, detail.longEdge)
    const midLat = (s + n) / 2
    const widthM = Math.abs(e - w) * 111320 * Math.cos((midLat * Math.PI) / 180)
    const heightM = Math.abs(n - s) * 110540
    const spanKm = Math.max(widthM, heightM) / 1000
    const mpp = widthM / width
    const native = getAerialSource(sourceId).nativeMetersPerPixel
    return { spanKm, mpp: Math.max(mpp, native), upscaled: mpp < native }
  }, [viewBounds, detail, sourceId])

  const openGoogleEarthCompare = useCallback(() => {
    if (!viewBounds) return
    const [w, s, e, n] = viewBounds
    const lat = (s + n) / 2
    const lng = (w + e) / 2
    const widthM = Math.abs(e - w) * 111320 * Math.cos((lat * Math.PI) / 180)
    const heightM = Math.abs(n - s) * 110540
    const altitude = Math.max(120, Math.round(Math.max(widthM, heightM) * 1.25))
    const url = `https://earth.google.com/web/@${lat.toFixed(6)},${lng.toFixed(6)},${altitude}a,0d,35y,0h,0t,0r`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [viewBounds])

  const MethodCard: React.FC<{ id: Method; icon: React.ReactNode; title: string; desc: string }> = ({ id, icon, title, desc }) => {
    const active = method === id
    return (
      <button
        onClick={() => { setMethod(id); setError(null) }}
        style={{
          flex: 1, textAlign: 'left', padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
          border: `1.5px solid ${active ? colors.toroRed : colors.gray200}`,
          background: active ? colors.toroRedTint : colors.white, transition: 'all 0.15s ease',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? colors.toroRed : colors.gray100, color: active ? '#fff' : colors.gray500 }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink, marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: colors.gray500, lineHeight: 1.45 }}>{desc}</div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Method chooser */}
      <div style={{ display: 'flex', gap: 12 }}>
        <MethodCard
          id="capture"
          icon={<Icons.Globe size={20} />}
          title="Capture from public aerial"
          desc="Pull free, public-domain USGS / NAIP imagery — auto-aligned to the course. No drone or screenshots needed."
        />
        <MethodCard
          id="upload"
          icon={<Icons.Upload size={20} />}
          title="Upload your own"
          desc="Have a drone orthomosaic or your own high-res capture? Drop in a PNG or JPEG."
        />
      </div>

      {/* Existing result preview (shared by both methods) */}
      {uploadedImage ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}`, maxHeight: 420 }}>
            <img src={uploadedImage.previewUrl} alt="Course imagery" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div className="badge" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              {uploadedImage.source === 'upload' ? <><Icons.Image size={13} /> Uploaded</> : <><Icons.Globe size={13} /> Captured · auto-aligned</>}
            </div>
          </div>

          {uploadedImage.source !== 'upload' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', background: colors.toroRedTint, borderRadius: 12, color: colors.ink }}>
              <Icons.Sparkles size={17} style={{ color: colors.toroRed, flexShrink: 0 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                Captured from <strong>{getAerialSource(uploadedImage.source).label}</strong>. It's georeferenced, so it drops onto the map already aligned — you can fine-tune on the next step if needed.
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>Image details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                ['Source', uploadedImage.source === 'upload' ? 'Your upload' : getAerialSource(uploadedImage.source).label],
                ['Dimensions', `${uploadedImage.width} × ${uploadedImage.height}`],
                ['Size', `${(uploadedImage.sizeBytes / 1024 / 1024).toFixed(2)} MB`],
                ['Attribution', uploadedImage.attribution || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.gray400, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, color: colors.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(v)}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button variant="secondary" size="sm" onClick={handleReplace} iconLeft={<Icons.X size={16} />}>Start over</Button>
          </div>
        </div>
      ) : method === 'upload' ? (
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
          <h3 style={{ fontSize: 18, color: colors.ink, marginBottom: 6 }}>Drag & drop your imagery</h3>
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
        /* Capture panel */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 270px', gap: 18, alignItems: 'start' }}>
          <div style={{ position: 'relative' }}>
            <DualSourceCompare
              center={mapCenter}
              zoom={15}
              height={560}
              sourceId={sourceId}
              onMapLoad={onCaptureMapLoad}
              onBoundsChange={setViewBounds}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <div style={{ padding: '7px 14px', background: colors.gray50, color: colors.gray700, borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>
                Drag either map — they stay in sync. Capture pulls the framed area from the source.
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 9 }}>Imagery source</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AERIAL_SOURCES.map((s) => {
                  const active = sourceId === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSourceId(s.id)}
                      style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 11, cursor: 'pointer',
                        border: `1.5px solid ${active ? colors.toroRed : colors.gray200}`,
                        background: active ? colors.toroRedTint : colors.white, transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? colors.toroRed : colors.ink }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, color: colors.gray500, lineHeight: 1.4, marginTop: 3 }}>{s.description}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!viewBounds}
                  onClick={openGoogleEarthCompare}
                  iconLeft={<Icons.Globe size={15} />}
                >
                  Open Google Earth for comparison
                </Button>
                <div style={{ fontSize: 11.5, color: colors.gray400, lineHeight: 1.45 }}>
                  External compare only. Google Earth imagery is not ingested or published by Strata.
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 9 }}>Detail level</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {DETAIL_LEVELS.map((d) => {
                  const active = detail.id === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDetail(d)}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${active ? colors.toroRed : colors.gray200}`,
                        background: active ? colors.toroRed : colors.white, color: active ? '#fff' : colors.body,
                        transition: 'all 0.15s ease',
                      }}
                    >{d.label}</button>
                  )
                })}
              </div>
            </div>

            {readout && (
              <div style={{ padding: '10px 12px', background: colors.gray50, borderRadius: 11 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.gray400, marginBottom: 6 }}>This capture</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.ink, fontWeight: 600 }}>
                  <span>Coverage</span><span>≈ {readout.spanKm.toFixed(2)} km</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.ink, fontWeight: 600, marginTop: 4 }}>
                  <span>Resolution</span><span>≈ {readout.mpp.toFixed(2)} m/px</span>
                </div>
                {readout.upscaled && (
                  <div style={{ fontSize: 11, color: colors.gray400, marginTop: 6, lineHeight: 1.4 }}>
                    Source native is {getAerialSource(sourceId).nativeMetersPerPixel} m/px — zoom out slightly for true full-detail pixels.
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleCapture} disabled={capturing || !selectedCourse} iconLeft={capturing ? undefined : <Icons.Globe size={16} />}>
              {capturing ? 'Capturing…' : 'Capture this area'}
            </Button>

            <div style={{ fontSize: 11.5, color: colors.gray400, lineHeight: 1.5 }}>
              Public-domain U.S. government imagery. Because it's georeferenced, the capture drops onto your map already aligned.
            </div>
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
