import React, { useState, useEffect } from 'react'
import { useCourseStore, getFilteredCourses, courseThumb, formatLocation, type Course } from '../store/courseStore'
import { useWizardStore } from '../store/wizardStore'
import { useUIStore } from '../store/uiStore'
import { colors } from '../styles/tokens'
import { Icons, EnvBadge } from '../components/ui'

const Step1SelectCourse: React.FC = () => {
  const { selectCourse, selectedCourse } = useCourseStore()
  const currentStep = useWizardStore((s) => s.currentStep)
  const completeStep = useWizardStore((s) => s.completeStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const resetWizard = useWizardStore((s) => s.resetWizard)
  const openAddCourse = useUIStore((s) => s.openAddCourse)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(selectedCourse?.id ?? null)

  const courses = getFilteredCourses(query)

  useEffect(() => {
    if (selectedCourse) {
      setSelectedId(selectedCourse.id)
      setCurrentStepIsValid(true)
      completeStep(currentStep)
    }
  }, [selectedCourse]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (course: Course) => {
    setSelectedId(course.id)
    selectCourse(course)
    setCurrentStepIsValid(true)
    completeStep(currentStep)
  }

  // Leave the wizard and open the dashboard's Add Course panel.
  const handleAddNewCourse = () => {
    openAddCourse()
    resetWizard()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 460 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, display: 'flex' }}>
            <Icons.Search size={18} />
          </span>
          <input
            className="search-input"
            placeholder="Search by name, ID, customer, or city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleAddNewCourse}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Icons.Plus size={17} /> Add a new course
        </button>
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {courses.map((course) => {
          const active = selectedId === course.id
          const thumb = courseThumb(course, 320, 180, 14)
          return (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="card-hover"
              style={{
                textAlign: 'left', padding: 0, overflow: 'hidden', borderRadius: 16, cursor: 'pointer',
                background: colors.white,
                border: `2px solid ${active ? colors.toroRed : colors.gray200}`,
                boxShadow: active ? '0 8px 24px rgba(215,25,32,0.16)' : undefined,
              }}
            >
              <div style={{ position: 'relative', height: 132, background: colors.gray100 }}>
                {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', top: 10, left: 10 }}><EnvBadge env={course.environment} /></div>
                {active && (
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 999, background: colors.toroRed, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                    <Icons.Check size={15} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{course.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 13, color: colors.gray500 }}>
                  <Icons.Pin size={14} /> {formatLocation(course)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 12, color: colors.gray400 }}>
                  <span style={{ fontFamily: colors.toroRed ? 'var(--font-mono)' : undefined }}>{course.id}</span>
                  <span>·</span>
                  <span>{course.holes ?? 18} holes</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {courses.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>No courses match “{query}”.</div>
      )}
    </div>
  )
}

export default Step1SelectCourse
