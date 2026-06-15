import React from 'react'
import { useTheme } from '../styles/tokens'

const Step6PreviewFinalMap: React.FC = () => {
  const { colors } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '4rem', border: `2px dashed ${colors.gray300}`, borderRadius: '8px' }}>
      <h3 style={{ color: colors.charcoal }}>Preview Final Map</h3>
      <p style={{ color: colors.gray500 }}>Before/After comparison (Phase 8)</p>
    </div>
  )
}

export default Step6PreviewFinalMap
