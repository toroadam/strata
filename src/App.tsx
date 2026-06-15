import React from 'react'
import { useWizardStore } from './store/wizardStore'
import { ThemeProvider, useTheme } from './styles/tokens'
import WizardProgress from './components/WizardProgress'
import WizardFooter from './components/WizardFooter'
import * as Steps from './steps'

const stepComponents = {
  Step1SelectCourse: Steps.Step1SelectCourse,
  Step2ConfirmTargetMap: Steps.Step2ConfirmTargetMap,
  Step3UploadImagery: Steps.Step3UploadImagery,
  Step4AlignImagery: Steps.Step4AlignImagery,
  Step5AccuracyCheck: Steps.Step5AccuracyCheck,
  Step6PreviewFinalMap: Steps.Step6PreviewFinalMap,
  Step7Publish: Steps.Step7Publish,
  Step8Success: Steps.Step8Success,
} as const

const AppContent: React.FC = () => {
  const { currentStep } = useWizardStore()
  const { colors } = useTheme()

  const ComponentKey = `Step${currentStep}` as keyof typeof stepComponents
  const StepComponent = stepComponents[ComponentKey]

  if (!StepComponent) return <div style={{ padding: '2rem', color: colors.error }}>Step not found</div>

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: colors.gray50,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <WizardProgress />
        <StepComponent />
      </div>
      <WizardFooter currentStep={currentStep} totalSteps={8} />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
