import React from 'react'
import { useTheme } from '../styles/tokens'

const Step5AccuracyCheck: React.FC = () => {
  const { colors } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '4rem', border: `2px dashed ${colors.gray300}`, borderRadius: '8px' }}>
      <h3 style={{ color: colors.charcoal }}>Accuracy Check</h3>
      <p style={{ color: colors.gray500 }}>Validation checklist (Phase 7)</p>
    </div>
  )
}

export default Step5AccuracyCheck
