import React from 'react'
import { useWizardStore } from '../store/wizardStore'
import { useTheme } from '../styles/tokens'

interface Props {
  currentStep: number;
  totalSteps: number;
}

const WizardFooter: React.FC<Props> = ({ currentStep, totalSteps }) => {
  const { colors } = useTheme()
  const { prevStep, nextStep } = useWizardStore()
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: colors.gray50, borderTop: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <button
        onClick={prevStep}
        disabled={isFirstStep}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: isFirstStep ? colors.gray300 : colors.white, border: `1px solid ${colors.gray300}`, borderRadius: '6px', cursor: isFirstStep ? 'not-allowed' : 'pointer', fontWeight: 500 }}
      >
        Back
      </button>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {isLastStep ? (
          <button
            onClick={() => alert('Workflow complete. Application ready for next session.')}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: colors.toroRed, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Finish
          </button>
        ) : (
          <button
            onClick={nextStep}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: colors.toroRed, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  )
}

export default WizardFooter
