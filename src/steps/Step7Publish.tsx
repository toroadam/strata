import React from 'react'
import { useTheme } from '../styles/tokens'

const Step7Publish: React.FC = () => {
  const { colors } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '4rem', border: `2px dashed ${colors.gray300}`, borderRadius: '8px' }}>
      <h3 style={{ color: colors.charcoal }}>Publish</h3>
      <p style={{ color: colors.gray500 }}>Publish adapter & export (Phase 9)</p>
    </div>
  )
}

export default Step7Publish
