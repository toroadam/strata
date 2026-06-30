import React from 'react'
import logoSvg from '../assets/Toro-Logo2.svg'
import MapboxCanvas from '../mapbox/MapboxCanvas'
import { useUIStore } from '../store/uiStore'
import { useWizardStore } from '../store/wizardStore'
import {
  useCourseStore, formatLocation,
  type CourseStatus, type ActivityKind,
} from '../store/courseStore'
import { colors } from '../styles/tokens'
import { Icons, Button, EnvBadge } from '../components/ui'

interface Props { courseId: string }

const STATUS_META: Record<CourseStatus, { label: string; fg: string; bg: string; dot: string }> = {
  ready: { label: 'Ready', fg: colors.gray700, bg: colors.gray100, dot: colors.gray400 },
  in_progress: { label: 'In progress', fg: '#92400E', bg: colors.warningTint, dot: '#D97706' },
  published: { label: 'Published', fg: '#0F5132', bg: colors.successTint, dot: '#16A34A' },
}

const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const mins = ms / 60000
  if (mins < 1) return 'just now'
  if (mins < 60) return `${Math.floor(mins)}m ago`
  const hrs = mins / 60
  if (hrs < 24) return `${Math.floor(hrs)}h ago`
  const d = hrs / 24
  if (d < 1.5) return 'yesterday'
  if (d < 30) return `${Math.floor(d)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const ACTIVITY_ICON: Record<ActivityKind, { icon: React.ReactNode; fg: string; bg: string }> = {
  created: { icon: <Icons.Flag size={15} />, fg: colors.gray500, bg: colors.gray100 },
  uploaded: { icon: <Icons.Upload size={15} />, fg: colors.toroRed, bg: colors.toroRedTint },
  aligned: { icon: <Icons.Sliders size={15} />, fg: '#0369A1', bg: colors.infoTint },
  published: { icon: <Icons.Rocket size={15} />, fg: colors.success, bg: colors.successTint },
  toggled: { icon: <Icons.Eye size={15} />, fg: colors.gray700, bg: colors.gray100 },
  updated: { icon: <Icons.Sparkles size={15} />, fg: colors.gray700, bg: colors.gray100 },
}

const Switch: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    style={{
      width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: checked ? colors.toroRed : colors.gray300, position: 'relative', transition: 'background 0.18s ease', padding: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: 999,
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.18s ease',
    }} />
  </button>
)

const CourseWorkspace: React.FC<Props> = ({ courseId }) => {
  const course = useCourseStore((s) => s.courses.find((c) => c.id === courseId))
  const toggleOverlay = useCourseStore((s) => s.toggleOverlay)
  const setOverlayOpacity = useCourseStore((s) => s.setOverlayOpacity)
  const publishCourse = useCourseStore((s) => s.publishCourse)
  const selectCourse = useCourseStore((s) => s.selectCourse)
  const goDashboard = useUIStore((s) => s.goDashboard)
  const setReturnToCourse = useUIStore((s) => s.setReturnToCourse)

  if (!course) {
    return (
      <div style={{ minHeight: '100vh', background: colors.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={goDashboard} iconLeft={<Icons.ArrowLeft size={17} />}>Back to dashboard</Button>
      </div>
    )
  }

  const sm = STATUS_META[course.status]
  const enabledOverlay = course.overlays.find((o) => o.enabled) ?? null
  const controlOverlay = enabledOverlay ?? course.overlays[0] ?? null
  const overlayConfig = enabledOverlay
    ? { imageUrl: enabledOverlay.imageUrl, coordinates: enabledOverlay.coordinates, opacity: enabledOverlay.opacity }
    : null

  const handleAddImagery = () => {
    selectCourse(course)
    setReturnToCourse(course.id)
    useWizardStore.getState().setCurrentStep(1)
  }

  const handlePublish = () => {
    if (course.hasPendingChanges) publishCourse(course.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.canvas }}>
      {/* Top nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, height: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.gray200}`, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={goDashboard} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img src={logoSvg} alt="Toro" style={{ width: 28, height: 28 }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: colors.ink, letterSpacing: '-0.01em' }}>Strata</span>
            <span style={{ width: 1, height: 18, background: colors.gray200 }} />
            <span style={{ fontSize: 14, color: colors.gray500, fontWeight: 500 }}>Course Imagery Publisher</span>
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: colors.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>TC</div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 64px' }}>
        {/* Breadcrumb */}
        <button onClick={goDashboard} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: colors.gray500, fontSize: 13.5, fontWeight: 600, padding: '4px 0', marginBottom: 14 }}>
          <Icons.ArrowLeft size={16} /> All courses
        </button>

        {/* Hero */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }}>{course.name}</h1>
                <span className="badge" style={{ background: sm.bg, color: sm.fg }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: sm.dot }} />{sm.label}
                </span>
                <EnvBadge env={course.environment} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontSize: 13.5, color: colors.gray500, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.Pin size={15} /> {formatLocation(course)}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{course.id}</span>
                <span>{course.holes ?? 18} holes</span>
                {course.acres && <span>{course.acres} acres</span>}
                {course.lastPublished && <span>Published {timeAgo(course.lastPublished)}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="secondary" onClick={handleAddImagery} iconLeft={<Icons.Upload size={17} />}>Add imagery</Button>
              <Button variant="primary" onClick={handlePublish} disabled={!course.hasPendingChanges} iconLeft={<Icons.Rocket size={17} />}>
                {course.hasPendingChanges ? 'Publish changes' : 'Published'}
              </Button>
            </div>
          </div>
          {course.hasPendingChanges && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: colors.warningTint, border: '1px solid #FDE68A', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
              <Icons.Clock size={15} /> You have unpublished changes for this course.
            </div>
          )}
        </div>

        {/* Body grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 24, alignItems: 'start' }}>
          {/* Map + overlay controls */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Map size={18} style={{ color: colors.toroRed }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>Live course map</span>
              </div>
              {enabledOverlay && (
                <span style={{ fontSize: 12.5, color: colors.gray500 }}>Showing “{enabledOverlay.name}”</span>
              )}
            </div>

            <MapboxCanvas
              center={[course.location.longitude, course.location.latitude]}
              zoom={14}
              height={440}
              initialLoad
              overlayConfig={overlayConfig}
            />

            {/* Overlay control bar */}
            {controlOverlay ? (
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 18, borderTop: `1px solid ${colors.gray100}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch checked={controlOverlay.enabled} onChange={() => toggleOverlay(course.id, controlOverlay.id)} label="Toggle overlay" />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.ink }}>Overlay {controlOverlay.enabled ? 'on' : 'off'}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, opacity: controlOverlay.enabled ? 1 : 0.45 }}>
                  <span style={{ fontSize: 13, color: colors.gray500 }}>Opacity</span>
                  <input
                    type="range" className="toro-range" min={0} max={1} step={0.01}
                    value={controlOverlay.opacity}
                    disabled={!controlOverlay.enabled}
                    onChange={(e) => setOverlayOpacity(course.id, controlOverlay.id, parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 13, color: colors.gray500, width: 38, textAlign: 'right' }}>{Math.round(controlOverlay.opacity * 100)}%</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${colors.gray100}` }}>
                <span style={{ fontSize: 13.5, color: colors.gray500 }}>No imagery overlays yet. Add drone imagery to preview it here.</span>
                <Button variant="primary" size="sm" onClick={handleAddImagery} iconLeft={<Icons.Plus size={15} />}>Add imagery</Button>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Overlays */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '15px 18px', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.Layers size={17} style={{ color: colors.toroRed }} />
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink }}>Imagery overlays</span>
                </div>
                <span className="badge" style={{ background: colors.gray100, color: colors.gray700 }}>{course.overlays.length}</span>
              </div>

              {course.overlays.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: colors.gray100, color: colors.gray400, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Icons.Image size={20} /></div>
                  <p style={{ fontSize: 13, color: colors.gray500, margin: '0 0 14px' }}>No overlays yet.</p>
                  <Button variant="secondary" size="sm" onClick={handleAddImagery} iconLeft={<Icons.Plus size={15} />}>Add imagery</Button>
                </div>
              ) : (
                <div>
                  {course.overlays.map((o, i) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: i === 0 ? 'none' : `1px solid ${colors.gray100}` }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: colors.gray100, flexShrink: 0 }}>
                        {o.imageUrl && <img src={o.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: 11.5, color: colors.gray400 }}>
                          <span className="badge" style={{ padding: '1px 7px', fontSize: 10.5, background: o.status === 'published' ? colors.successTint : colors.gray100, color: o.status === 'published' ? '#0F5132' : colors.gray700 }}>
                            {o.status === 'published' ? 'Live' : 'Draft'}
                          </span>
                          {o.capturedAt && <span>{timeAgo(o.capturedAt)}</span>}
                        </div>
                      </div>
                      <Switch checked={o.enabled} onChange={() => toggleOverlay(course.id, o.id)} label={`Toggle ${o.name}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 84, maxHeight: 'calc(100vh - 108px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '15px 18px', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Icons.Activity size={17} style={{ color: colors.toroRed }} />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink }}>Activity</span>
              </div>
              <div style={{ padding: '6px 18px 12px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {course.activity.map((ev) => {
                  const ai = ACTIVITY_ICON[ev.kind]
                  return (
                    <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 999, background: ai.bg, color: ai.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ai.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: colors.ink, lineHeight: 1.4 }}>{ev.message}</div>
                        <div style={{ fontSize: 11.5, color: colors.gray400, marginTop: 2 }}>
                          {timeAgo(ev.at)}{ev.actor ? ` · ${ev.actor}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CourseWorkspace
