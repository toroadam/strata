import React from 'react'
import { useTheme } from '../styles/tokens'

interface Props {
  message?: string;
}

const LoadingState: React.FC<Props> = ({ message = 'Loading...' }) => {
  const { colors } = useTheme()
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: `3px solid ${colors.gray200}`, borderTop: `3px solid ${colors.toroRed}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ margin: 0, color: colors.gray700, fontSize: '0.875rem' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default LoadingState
