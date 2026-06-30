import React from 'react'
import { STEPS } from '../steps/stepMeta'
import { colors } from '../styles/tokens'
import { Icons, EnvBadge } from './ui'
import { useCourseStore, courseThumb, formatLocation } from '../store/courseStore'

interface Props {
  currentStep: number
  completedSteps: number[] // 1-based step numbers
  onJump?: (step: number) => void
}

const WizardSidebar: React.FC<Props> = ({ currentStep, completedSteps, onJump }) => {
  const selectedCourse = useCourseStore((s) => s.selectedCourse)

  return (
    <aside style={{ width: 296, flexShrink: 0, borderRight: `1px solid ${colors.gray200}`, background: colors.white, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.gray400, marginBottom: 4 }}>
          Publishing pipeline
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.ink }}>Course imagery</div>
      </div>

      <nav style={{ padding: '4px 12px', flex: 1, overflowY: 'auto' }}>
        {STEPS.map((s) => {
          const isCurrent = s.num === currentStep
          const isDone = completedSteps.includes(s.num) && !isCurrent
          const isReachable = isDone || s.num < currentStep
          return (
            <button
              key={s.key}
              onClick={() => isReachable && onJump?.(s.num)}
              style={{
                width: '100%', display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left',
                padding: '12px 12px', borderRadius: 12, border: 'none', position: 'relative',
                background: isCurrent ? colors.toroRedTint : 'transparent',
                cursor: isReachable ? 'pointer' : 'default',
                transition: 'background 0.18s ease',
              }}
            >
              {/* connector line */}
              {s.num < STEPS.length && (
                <span style={{ position: 'absolute', left: 27, top: 38, bottom: -4, width: 2, background: isDone ? colors.success : colors.gray200 }} />
              )}
              <span style={{
                width: 30, height: 30, borderRadius: 999, flexShrink: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: isCurrent ? colors.toroRed : isDone ? colors.success : colors.white,
                color: isCurrent || isDone ? '#fff' : colors.gray500,
                border: isCurrent || isDone ? 'none' : `1.5px solid ${colors.gray300}`,
                boxShadow: isCurrent ? '0 2px 8px rgba(215,25,32,0.35)' : 'none',
              }}>
                {isDone ? <Icons.Check size={16} strokeWidth={2.5} /> : s.num}
              </span>
              <span style={{ paddingTop: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? colors.toroRedDark : colors.ink }}>{s.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: colors.gray500, marginTop: 2 }}>{s.caption}</span>
              </span>
            </button>
          )
        })}
      </nav>

      {selectedCourse && (
        <div style={{ padding: 16, borderTop: `1px solid ${colors.gray200}` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: colors.gray100, flexShrink: 0 }}>
              {courseThumb(selectedCourse, 96, 96, 13) && (
                <img src={courseThumb(selectedCourse, 96, 96, 13)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCourse.name}</div>
              <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{formatLocation(selectedCourse)}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <EnvBadge env={selectedCourse.environment} />
          </div>
        </div>
      )}
    </aside>
  )
}

export default WizardSidebar
