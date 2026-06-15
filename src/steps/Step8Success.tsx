import React from 'react'
import { useTheme } from '../styles/tokens'

const Step8Success: React.FC = () => {
  const { colors } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '4rem', border: `2px dashed ${colors.gray300}`, borderRadius: '8px' }}>
      <h3 style={{ color: colors.charcoal }}>Success</h3>
      <p style={{ color: colors.gray500 }}>Confirmation & next actions (Phase 10)</p>
    </div>
  )
}

export default Step8Success
