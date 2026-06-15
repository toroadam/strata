import React from 'react'
import { useTheme } from '../styles/tokens'

const Step4AlignImagery: React.FC = () => {
  const { colors } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '4rem', border: `2px dashed ${colors.gray300}`, borderRadius: '8px' }}>
      <h3 style={{ color: colors.charcoal }}>Align Imagery</h3>
      <p style={{ color: colors.gray500 }}>Mapbox sandbox & alignment tools (Phase 5-6)</p>
    </div>
  )
}

export default Step4AlignImagery
