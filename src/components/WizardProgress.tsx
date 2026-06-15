import React from 'react'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

const WizardProgress: React.FC = () => {
  const { currentStep, completedSteps } = useWizardStore()
  const { colors } = useTheme()
  const totalSteps = 8

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          style={{
            width: '40px',
            height: '6px',
            backgroundColor: step === currentStep ? colors.toroRed : completedSteps.has(`step${step}` as any) ? colors.success : colors.gray200,
            borderRadius: '3px',
            transition: 'background-color 0.3s ease'
          }}
        />
      ))}
    </div>
  )
}

export default WizardProgress
