import React, { useState, useEffect, useMemo, useRef } from 'react'
import logoSvg from '../assets/Toro-Logo2.svg'
import MapboxCanvas from '../mapbox/MapboxCanvas'
import { useWizardStore } from '../store/wizardStore'
import { useUIStore } from '../store/uiStore'
import { geocodeForward, reverseGeocode, type GeoResult } from '../mapbox/geocode'
import {
  getFilteredCourses, useCourseStore, getRecentActivity, courseThumb, formatLocation,
  type Course, type CourseStatus, type ActivityKind,
} from '../store/courseStore'
import { colors } from '../styles/tokens'
import { Icons, Button, EnvBadge, Field, Input, Select } from '../components/ui'

interface DashboardProps {
  onStart?: () => void
  onReset?: () => void
}

const STATUS_META: Record<CourseStatus, { label: string; fg: string; bg: string; dot: string }> = {
  ready: { label: 'Ready', fg: colors.gray700, bg: colors.gray100, dot: colors.gray400 },
  in_progress: { label: 'In progress', fg: '#92400E', bg: colors.warningTint, dot: '#D97706' },
  published: { label: 'Published', fg: '#0F5132', bg: colors.successTint, dot: '#16A34A' },
}

const ACTIVITY_ICON: Record<ActivityKind, { icon: React.ReactNode; fg: string; bg: string }> = {
  created: { icon: <Icons.Flag size={14} />, fg: colors.gray500, bg: colors.gray100 },
  uploaded: { icon: <Icons.Upload size={14} />, fg: colors.toroRed, bg: colors.toroRedTint },
  aligned: { icon: <Icons.Sliders size={14} />, fg: '#0369A1', bg: colors.infoTint },
  published: { icon: <Icons.Rocket size={14} />, fg: colors.success, bg: colors.successTint },
  toggled: { icon: <Icons.Eye size={14} />, fg: colors.gray700, bg: colors.gray100 },
  updated: { icon: <Icons.Sparkles size={14} />, fg: colors.gray700, bg: colors.gray100 },
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

const Dashboard: React.FC<DashboardProps> = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const showAddCourse = useUIStore((s) => s.addCourseOpen)
  const openAddCourse = useUIStore((s) => s.openAddCourse)
  const closeAddCourse = useUIStore((s) => s.closeAddCourse)
  const openCourse = useUIStore((s) => s.openCourse)

  const addCourse = useCourseStore((s) => s.addCourse)
  // subscribe to course list so grid/activity update after add/publish
  const courseList = useCourseStore((s) => s.courses)
  const recentActivity = getRecentActivity(7)

  const courses = getFilteredCourses(searchQuery)

  // Add-course form
  const [newName, setNewName] = useState('')
  const [newCustomerId, setNewCustomerId] = useState('')
  const [newLong, setNewLong] = useState('-93.265')
  const [newLat, setNewLat] = useState('44.978')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newEnv, setNewEnv] = useState<'sandbox' | 'staging' | 'production'>('sandbox')
  const [markerPos, setMarkerPos] = useState<{ lng: number; lat: number } | null>({ lng: -93.265, lat: 44.978 })

  // Address typeahead
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const justSelectedRef = useRef(false)

  const drawerCenter = useMemo<[number, number]>(
    () => [parseFloat(newLong) || -93.265, parseFloat(newLat) || 44.978],
    [newLong, newLat],
  )

  const resetAddForm = () => {
    setNewName(''); setNewCustomerId(''); setNewCity(''); setNewState('')
    setAddressQuery(''); setSuggestions([]); setShowSuggestions(false)
  }

  // Debounced forward geocoding for the address typeahead.
  useEffect(() => {
    if (!showAddCourse) return
    if (justSelectedRef.current) { justSelectedRef.current = false; return }
    const q = addressQuery.trim()
    if (q.length < 3) { setSuggestions([]); return }
    setGeoLoading(true)
    const handle = setTimeout(async () => {
      const results = await geocodeForward(q)
      setSuggestions(results)
      setShowSuggestions(true)
      setGeoLoading(false)
    }, 280)
    return () => clearTimeout(handle)
  }, [addressQuery, showAddCourse])

  const applyLocation = (lng: number, lat: number, city?: string, state?: string) => {
    setMarkerPos({ lng, lat })
    setNewLong(lng.toFixed(6))
    setNewLat(lat.toFixed(6))
    if (city !== undefined) setNewCity(city ?? '')
    if (state !== undefined) setNewState(state ?? '')
  }

  const selectSuggestion = (s: GeoResult) => {
    justSelectedRef.current = true
    setAddressQuery(s.placeName)
    setShowSuggestions(false)
    setSuggestions([])
    applyLocation(s.lng, s.lat, s.city, s.state)
  }

  const handleMapClick = async (lngLat: { lng: number; lat: number }) => {
    applyLocation(lngLat.lng, lngLat.lat)
    const place = await reverseGeocode(lngLat.lng, lngLat.lat)
    if (place) {
      if (place.city) setNewCity(place.city)
      if (place.state) setNewState(place.state)
      justSelectedRef.current = true
      setAddressQuery(place.placeName)
    }
  }

  const openCourseWorkspace = (course: Course) => {
    openCourse(course.id)
  }

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const created = addCourse({
      name: newName.trim(),
      customerId: newCustomerId || undefined,
      location: { longitude: parseFloat(newLong), latitude: parseFloat(newLat) },
      city: newCity.trim() || undefined,
      state: newState.trim() || undefined,
      environment: newEnv,
    })
    resetAddForm()
    closeAddCourse()
    openCourse(created.id)
  }

  const dismissAddCourse = () => {
    resetAddForm()
    closeAddCourse()
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.canvas }}>
      {/* Top nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, height: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.gray200}`, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoSvg} alt="Toro" style={{ width: 28, height: 28 }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: colors.ink, letterSpacing: '-0.01em' }}>Strata</span>
            <span style={{ width: 1, height: 18, background: colors.gray200 }} />
            <span style={{ fontSize: 14, color: colors.gray500, fontWeight: 500 }}>Course Imagery Publisher</span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {['Dashboard', 'Courses', 'Pipelines'].map((item, i) => (
              <button key={item} style={{
                fontSize: 14, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: i === 0 ? colors.gray100 : 'transparent',
                color: i === 0 ? colors.ink : colors.gray500, fontWeight: i === 0 ? 600 : 500,
              }}>{item}</button>
            ))}
          </nav>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: colors.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>TC</div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px 64px' }}>
        {/* Hero */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }}>Course imagery</h1>
            <p style={{ margin: '10px 0 0', fontSize: 16, color: colors.gray500, maxWidth: 560, lineHeight: 1.5 }}>
              Publish high-resolution drone imagery as aligned overlays on your course maps — in about five minutes.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={openAddCourse} iconLeft={<Icons.Plus size={18} />}>Add course</Button>
        </div>

        {/* Courses + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 28, alignItems: 'start' }}>
          {/* Courses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.ink }}>Your courses</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 240 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, display: 'flex' }}><Icons.Search size={17} /></span>
                  <input className="search-input" placeholder="Search courses…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="secondary" onClick={openAddCourse} iconLeft={<Icons.Plus size={17} />}>Add course</Button>
              </div>
            </div>

            {courses.length > 0 ? (
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {courses.map((course) => {
                  const thumb = courseThumb(course, 360, 220, 14)
                  const sm = STATUS_META[course.status]
                  const overlayCount = course.overlays.length
                  return (
                    <div key={course.id} className="card card-hover" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openCourseWorkspace(course)}>
                      <div style={{ position: 'relative', height: 150, background: colors.gray100 }}>
                        {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%)' }} />
                        <div style={{ position: 'absolute', top: 12, left: 12 }}><EnvBadge env={course.environment} /></div>
                        <div className="badge" style={{ position: 'absolute', top: 12, right: 12, background: sm.bg, color: sm.fg }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: sm.dot }} />{sm.label}
                        </div>
                      </div>
                      <div style={{ padding: '16px 18px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>{course.name}</div>
                          <span style={{ color: colors.gray300, display: 'flex', marginTop: 2 }}><Icons.ArrowRight size={18} /></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 13, color: colors.gray500 }}>
                          <Icons.Pin size={14} /> {formatLocation(course)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.gray100}`, fontSize: 12, color: colors.gray400 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.Layers size={13} /> {overlayCount} {overlayCount === 1 ? 'overlay' : 'overlays'}</span>
                          <span>·</span>
                          <span>{course.holes ?? 18} holes</span>
                          {course.hasPendingChanges && (<><span style={{ marginLeft: 'auto' }} /><span style={{ color: '#92400E', fontWeight: 600 }}>Unpublished</span></>)}
                          {!course.hasPendingChanges && course.lastPublished && (<><span style={{ marginLeft: 'auto' }} /><span>Published {timeAgo(course.lastPublished)}</span></>)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card" style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: colors.gray100, color: colors.gray400, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icons.Search size={26} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>No courses found</div>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: colors.gray500 }}>Try a different search or add a new course.</p>
              </div>
            )}
          </div>

          {/* Recent activity rail */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 84, maxHeight: 'calc(100vh - 108px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Icons.Activity size={17} style={{ color: colors.toroRed }} />
              <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink }}>Recent activity</span>
            </div>
            <div style={{ padding: '6px 18px 14px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {recentActivity.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.gray500, padding: '14px 0' }}>No recent activity yet.</p>
              ) : recentActivity.map((ev) => {
                const ai = ACTIVITY_ICON[ev.kind]
                return (
                  <button
                    key={ev.id}
                    onClick={() => openCourse(ev.courseId)}
                    style={{ display: 'flex', gap: 11, padding: '10px 0', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: ai.bg, color: ai.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ai.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: colors.ink, lineHeight: 1.4 }}>{ev.message}</div>
                      <div style={{ fontSize: 11.5, color: colors.gray400, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.courseName} · {timeAgo(ev.at)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        {/* keep courseList referenced for store subscription */}
        <span style={{ display: 'none' }}>{courseList.length}</span>
      </main>

      {/* Add Course drawer */}
      {showAddCourse && (
        <>
          <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} onClick={dismissAddCourse} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '100vw', background: colors.white, boxShadow: colors.toroRed ? '-8px 0 32px rgba(0,0,0,0.18)' : undefined, zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'drawerIn 0.3s cubic-bezier(.2,.8,.3,1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.ink }}>Add a new course</h3>
              <button onClick={dismissAddCourse} style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: colors.gray100, color: colors.gray700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={18} /></button>
            </div>

            <form onSubmit={handleAddCourse} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Course name">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Oak Ridge Golf Club" required />
                </Field>
                <Field label="Customer ID" optional>
                  <Input value={newCustomerId} onChange={(e) => setNewCustomerId(e.target.value)} placeholder="e.g., acc-09921" />
                </Field>

                <Field label="Find by address" hint="Search an address or place, or drop a pin on the map.">
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, display: 'flex', pointerEvents: 'none' }}>
                      <Icons.Search size={17} />
                    </span>
                    <input
                      className="input"
                      style={{ paddingLeft: 40, paddingRight: 36 }}
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                      placeholder="e.g., 1600 Champions Way, Pinehurst NC"
                      autoComplete="off"
                    />
                    {geoLoading && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: colors.gray400 }}>
                        <span className="spin" style={{ display: 'inline-block', width: 15, height: 15, border: `2px solid ${colors.gray200}`, borderTopColor: colors.toroRed, borderRadius: '50%' }} />
                      </span>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 5, background: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', overflow: 'hidden', maxHeight: 244, overflowY: 'auto' }}>
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectSuggestion(s)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: `1px solid ${colors.gray100}`, background: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.gray50 || colors.gray100)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ color: colors.toroRed, display: 'flex', marginTop: 1, flexShrink: 0 }}><Icons.Pin size={15} /></span>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: colors.ink }}>{s.title}</span>
                              <span style={{ display: 'block', fontSize: 12, color: colors.gray500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.placeName}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Confirm location on map" hint="Click the map to fine-tune the course pin.">
                  <div style={{ borderRadius: 12, border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
                    <MapboxCanvas
                      center={drawerCenter}
                      zoom={13}
                      height={220}
                      initialLoad
                      markerPosition={markerPos}
                      onClick={handleMapClick}
                    />
                  </div>
                </Field>
                {(newCity || newState) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -6, fontSize: 13, color: colors.gray700 }}>
                    <Icons.Pin size={14} /> <span style={{ fontWeight: 600, color: colors.ink }}>{[newCity, newState].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Longitude"><Input type="number" step="any" value={newLong} onChange={(e) => setNewLong(e.target.value)} required /></Field>
                  <Field label="Latitude"><Input type="number" step="any" value={newLat} onChange={(e) => setNewLat(e.target.value)} required /></Field>
                </div>
                <Field label="Environment">
                  <Select value={newEnv} onChange={(e) => setNewEnv(e.target.value as any)}>
                    <option value="sandbox">Sandbox</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </Select>
                </Field>
              </div>

              <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.gray200}`, display: 'flex', gap: 12 }}>
                <Button type="button" variant="secondary" onClick={dismissAddCourse} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={!newName.trim()} style={{ flex: 2 }} iconRight={<Icons.ArrowRight size={17} />}>
                  Add &amp; start
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
