import React from 'react'
import { useWizardStore } from '../store/wizardStore'
import { useUIStore } from '../store/uiStore'
import { colors } from '../styles/tokens'
import { Button, Icons } from './ui'

interface Props {
  currentStep: number
  totalSteps: number
  isValid?: boolean
  onFinish?: () => void
}

const hintByStep: Record<number, string> = {
  1: 'Select a course to continue',
  2: 'Confirm the target to continue',
  3: 'Upload an image to continue',
  4: 'Place your imagery on the map',
  5: 'Check every item to continue',
  6: 'Confirm the preview to continue',
  7: 'Confirm, then publish',
}

const ctaByStep: Record<number, string> = {
  1: 'Continue', 2: 'Continue', 3: 'Continue', 4: 'Continue',
  5: 'Continue', 6: 'Continue to publish', 7: 'Continue',
}

const WizardFooter: React.FC<Props> = ({ currentStep, totalSteps, isValid = true, onFinish }) => {
  const { nextStep, prevStep } = useWizardStore()
  const view = useUIStore((s) => s.view)
  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1
  const isPublishStep = currentStep === 7
  const isNextDisabled = !isValid && !isLastStep

  if (isLastStep) {
    return (
      <div style={footerStyle}>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="lg" onClick={onFinish} iconRight={<Icons.ArrowRight size={18} />}>
          {view === 'course' ? 'Go to course workspace' : 'Back to dashboard'}
        </Button>
      </div>
    )
  }

  return (
    <div style={footerStyle}>
      <div style={{ flex: 1, display: 'flex' }}>
        {!isFirstStep && (
          <Button variant="secondary" onClick={prevStep} iconLeft={<Icons.ArrowLeft size={18} />}>
            Back
          </Button>
        )}
      </div>

      <div style={{ fontSize: 13, color: colors.gray500, fontWeight: 500 }}>
        {isNextDisabled ? hintByStep[currentStep] : `Step ${currentStep} of ${totalSteps}`}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {!isPublishStep && (
          <Button
            variant="primary"
            size="lg"
            disabled={isNextDisabled}
            onClick={() => nextStep()}
            iconRight={<Icons.ArrowRight size={18} />}
          >
            {ctaByStep[currentStep] || 'Continue'}
          </Button>
        )}
      </div>
    </div>
  )
}

const footerStyle: React.CSSProperties = {
  padding: '16px 32px',
  background: colors.white,
  borderTop: `1px solid ${colors.gray200}`,
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  flexShrink: 0,
}

export default WizardFooter
