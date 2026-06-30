import React, { useState, useEffect, useRef } from 'react'
import { useCourseStore, formatLocation } from '../store/courseStore'
import { useWizardStore } from '../store/wizardStore'
import { colors } from '../styles/tokens'
import { Icons, EnvBadge, Button } from '../components/ui'
import MapboxCanvas from '../mapbox/MapboxCanvas'

const Step2ConfirmTargetMap: React.FC = () => {
  const selectedCourse = useCourseStore((s) => s.selectedCourse)
  const setCourseLocation = useCourseStore((s) => s.setCourseLocation)
  const currentStep = useWizardStore((s) => s.currentStep)
  const completeStep = useWizardStore((s) => s.completeStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const [confirmed, setConfirmed] = useState(false)

  // Keep the map view stable while the pin is edited, and remember the original spot for reset.
  const initialCenter = useRef<[number, number] | null>(null)
  const originalLocation = useRef<{ longitude: number; latitude: number } | null>(null)
  if (selectedCourse && initialCenter.current === null) {
    initialCenter.current = [selectedCourse.location.longitude, selectedCourse.location.latitude]
    originalLocation.current = { ...selectedCourse.location }
  }

  useEffect(() => {
    setCurrentStepIsValid(confirmed && !!selectedCourse)
    if (confirmed && selectedCourse) completeStep(currentStep)
  }, [confirmed, selectedCourse, setCurrentStepIsValid, completeStep, currentStep])

  if (!selectedCourse) return <div style={{ color: colors.error }}>Please select a course first.</div>

  const { longitude, latitude } = selectedCourse.location
  const moved = originalLocation.current
    ? Math.abs(longitude - originalLocation.current.longitude) > 1e-6 || Math.abs(latitude - originalLocation.current.latitude) > 1e-6
    : false

  const setPin = (lng: number, lat: number) => setCourseLocation(selectedCourse.id, lng, lat)
  const resetPin = () => {
    if (originalLocation.current) setPin(originalLocation.current.longitude, originalLocation.current.latitude)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Summary card */}
      <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.ink }}>{selectedCourse.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 13, color: colors.gray500 }}>
            <Icons.Pin size={14} /> {formatLocation(selectedCourse)}
            <span>·</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedCourse.id}</span>
          </div>
        </div>
        <EnvBadge env={selectedCourse.environment} />
      </div>

      {/* Edit hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.body, padding: '11px 14px', background: colors.gray50, borderRadius: 10 }}>
        <Icons.Pin size={15} style={{ color: colors.toroRed, flexShrink: 0 }} />
        <span><strong style={{ color: colors.ink }}>Drag the pin</strong> — or click anywhere on the map — to set where you think the center of the course is.</span>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.gray200}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <MapboxCanvas
          center={initialCenter.current ?? [longitude, latitude]}
          zoom={14}
          markerPosition={{ lng: longitude, lat: latitude }}
          draggableMarker
          onMarkerDragEnd={({ lng, lat }) => setPin(lng, lat)}
          onClick={({ lng, lat }) => setPin(lng, lat)}
          height={440}
          initialLoad
        />
      </div>

      {/* Coordinates row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13, color: colors.gray500 }}>
        <div><strong style={{ color: colors.ink }}>Latitude</strong> &nbsp;<span style={{ fontFamily: 'var(--font-mono)' }}>{latitude.toFixed(5)}</span></div>
        <div><strong style={{ color: colors.ink }}>Longitude</strong> &nbsp;<span style={{ fontFamily: 'var(--font-mono)' }}>{longitude.toFixed(5)}</span></div>
        {moved && (
          <Button variant="ghost" size="sm" onClick={resetPin} iconLeft={<Icons.X size={14} />} style={{ marginLeft: 'auto' }}>
            Reset to original
          </Button>
        )}
      </div>

      {/* Confirm */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '16px 18px',
        borderRadius: 14, border: `1.5px solid ${confirmed ? colors.success : colors.gray200}`,
        background: confirmed ? colors.successTint : colors.white, transition: 'all 0.18s ease',
      }}>
        <input type="checkbox" className="toro-check" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>
          This is the correct course and map location.
        </span>
      </label>
    </div>
  )
}

export default Step2ConfirmTargetMap
