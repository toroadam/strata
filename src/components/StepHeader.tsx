import React from 'react'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

interface Props {
  title: string;
  description?: string;
}

const StepHeader: React.FC<Props> = ({ title, description }) => {
  const { currentStep } = useWizardStore()
  const { colors } = useTheme()

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.5rem 0', color: colors.charcoal, fontSize: '1.5rem' }}>
        Step {currentStep} of 8: {title}
      </h2>
      {description && (
        <p style={{ margin: 0, color: colors.gray500, fontSize: '0.95rem' }}>{description}</p>
      )}
    </div>
  )
}

export default StepHeader
