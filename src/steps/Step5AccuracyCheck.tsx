import React, { useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore, isChecklistComplete, type AccuracyChecklist } from '../store/checklistStore'
import { useWizardStore } from '../store/wizardStore'
import { colors } from '../styles/tokens'
import { Icons } from '../components/ui'

const CHECKLIST_ITEMS: { key: keyof AccuracyChecklist; label: string; group: string }[] = [
  { key: 'cartPathsAligned', label: 'Cart paths align', group: 'Course features' },
  { key: 'greensAligned', label: 'Greens align', group: 'Course features' },
  { key: 'teeBoxesAligned', label: 'Tee boxes align', group: 'Course features' },
  { key: 'bunkersAligned', label: 'Bunkers align', group: 'Course features' },
  { key: 'waterFeaturesAligned', label: 'Water features align', group: 'Course features' },
  { key: 'surroundingRoadsAligned', label: 'Surrounding roads & landmarks align', group: 'Course features' },
  { key: 'doesNotCoverWrongProperty', label: 'Image does not cover unrelated property', group: 'Validation' },
  { key: 'correctCourseTarget', label: 'Overlay is assigned to the correct course', group: 'Validation' },
  { key: 'sourceApproved', label: 'Image source is approved for internal use', group: 'Validation' },
]

const Step5AccuracyCheck: React.FC = () => {
  const { overlay, setOverlay } = useOverlayStore()
  const { checklist, updateCheck } = useChecklistStore()
  const completeStep = useWizardStore((s) => s.completeStep)
  const currentStep = useWizardStore((s) => s.currentStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)

  useEffect(() => {
    const isValid = isChecklistComplete(checklist)
    setCurrentStepIsValid(isValid)
    if (isValid) completeStep(currentStep)
  }, [checklist, setCurrentStepIsValid, completeStep, currentStep])

  if (!overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const done = Object.values(checklist).filter(Boolean).length
  const total = CHECKLIST_ITEMS.length
  const complete = done === total
  const groups = Array.from(new Set(CHECKLIST_ITEMS.map(i => i.group)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Progress */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>
            {complete ? 'All checks verified' : `${done} of ${total} verified`}
          </span>
          <span style={{ fontSize: 13, color: complete ? colors.success : colors.gray500, fontWeight: 600 }}>
            {Math.round((done / total) * 100)}%
          </span>
        </div>
        <div style={{ height: 8, background: colors.gray100, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: complete ? colors.success : colors.toroRed, borderRadius: 999, transition: 'width 0.35s cubic-bezier(.2,.8,.3,1)' }} />
        </div>
      </div>

      {/* Checklist grouped */}
      {groups.map((group) => (
        <div key={group}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: colors.gray400, margin: '4px 0 8px' }}>{group}</div>
          <div className="card" style={{ padding: 6 }}>
            {CHECKLIST_ITEMS.filter(i => i.group === group).map((item) => {
              const checked = checklist[item.key]
              return (
                <label key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px',
                  borderRadius: 10, transition: 'background 0.15s ease',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.gray50)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checked ? colors.success : colors.white,
                    border: checked ? 'none' : `1.5px solid ${colors.gray300}`,
                    color: '#fff', transition: 'all 0.15s ease',
                  }}>
                    {checked && <Icons.Check size={15} strokeWidth={3} />}
                  </span>
                  <input type="checkbox" checked={checked} onChange={() => updateCheck(item.key)} style={{ display: 'none' }} />
                  <span style={{ fontSize: 14, color: checked ? colors.ink : colors.body, fontWeight: checked ? 600 : 500 }}>{item.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div>
        <label className="field-label">Reviewer notes <span style={{ color: colors.gray400, fontWeight: 500 }}>· optional</span></label>
        <textarea className="textarea" value={overlay.notes || ''} onChange={(e) => setOverlay({ ...overlay, notes: e.target.value })} placeholder="Anything worth noting about this alignment…" />
      </div>
    </div>
  )
}

export default Step5AccuracyCheck
