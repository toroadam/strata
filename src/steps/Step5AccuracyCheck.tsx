import React from 'react'
import { useCourseStore } from '../store/courseStore'
import { useUploadStore } from '../store/uploadStore'
import { useOverlayStore } from '../store/overlayStore'
import { useChecklistStore, isChecklistComplete } from '../store/checklistStore'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

const CHECKLIST_ITEMS = [
  { key: 'cartPathsAligned', label: 'Cart paths align' },
  { key: 'greensAligned', label: 'Greens align' },
  { key: 'teeBoxesAligned', label: 'Tee boxes align' },
  { key: 'bunkersAligned', label: 'Bunkers align' },
  { key: 'waterFeaturesAligned', label: 'Water features align' },
  { key: 'surroundingRoadsAligned', label: 'Surrounding roads or landmarks align' },
  { key: 'doesNotCoverWrongProperty', label: 'Image does not cover unrelated properties' },
  { key: 'correctCourseTarget', label: 'Overlay is assigned to the correct course' },
  { key: 'sourceApproved', label: 'Image source is approved for internal use' },
] as const

const Step5AccuracyCheck: React.FC = () => {
  const { colors } = useTheme()
  const { selectedCourse } = useCourseStore()
  const { uploadedImage } = useUploadStore()
  const { overlay, setOverlay } = useOverlayStore()
  const { checklist, updateCheck } = useChecklistStore()
  const completeStep = useWizardStore((s) => s.completeStep)

  if (!selectedCourse || !uploadedImage || !overlay) return <div style={{ color: colors.error }}>Please complete previous steps first.</div>

  const handleContinue = () => {
    if (isChecklistComplete(checklist)) {
      setOverlay({ ...overlay, accuracyLabel: 'reviewed', notes: overlay.notes || '' })
      completeStep('step5')
      useWizardStore.getState().nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '1.5rem', backgroundColor: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal }}>Check the alignment</h3>
        <p style={{ margin: 0, color: colors.gray500 }}>Review the overlay against the existing course map. Confirm each item before continuing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CHECKLIST_ITEMS.map((item) => (
          <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', backgroundColor: checklist[item.key] ? `${colors.success}15` : 'transparent' }}>
            <input 
              type="checkbox" 
              checked={checklist[item.key]} 
              onChange={() => updateCheck(item.key)}
              style={{ width: '18px', height: '18px', accentColor: colors.toroRed }}
            />
            <span style={{ color: checklist[item.key] ? colors.charcoal : colors.gray700 }}>{item.label}</span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: colors.charcoal, fontWeight: 500 }}>Accuracy Status</label>
        <select 
          value={overlay.accuracyLabel} 
          onChange={(e) => setOverlay({ ...overlay, accuracyLabel: e.target.value as any })}
          style={{ padding: '0.75rem', borderRadius: '6px', border: `1px solid ${colors.gray300}`, backgroundColor: colors.white }}
        >
          <option value="rough_placement">Rough placement</option>
          <option value="visually_aligned">Visually aligned</option>
          <option value="reviewed">Reviewed</option>
          <option value="ready_to_publish">Ready to publish</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: colors.charcoal, fontWeight: 500 }}>Notes (Optional)</label>
        <textarea 
          value={overlay.notes || ''}
          onChange={(e) => setOverlay({ ...overlay, notes: e.target.value })}
          placeholder="Add any alignment notes or observations..."
          style={{ padding: '0.75rem', borderRadius: '6px', border: `1px solid ${colors.gray300}`, backgroundColor: colors.white, minHeight: '80px', resize: 'vertical' }}
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={!isChecklistComplete(checklist)}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: isChecklistComplete(checklist) ? colors.toroRed : colors.gray300, color: isChecklistComplete(checklist) ? colors.white : colors.gray700, border: 'none', borderRadius: '6px', cursor: isChecklistComplete(checklist) ? 'pointer' : 'not-allowed', fontWeight: 600 }}
      >
        Continue to Preview
      </button>
    </div>
  )
}

export default Step5AccuracyCheck
