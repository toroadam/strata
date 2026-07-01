import React, { useState } from 'react'
import { useWizardStore } from './store/wizardStore'
import { useUIStore } from './store/uiStore'
import { getCourse } from './store/courseStore'
import { ThemeProvider } from './styles/tokens'
import { colors } from './styles/tokens'
import WizardFooter from './components/WizardFooter'
import WizardSidebar from './components/WizardSidebar'
import Dashboard from './layout/Dashboard'
import CourseWorkspace from './layout/CourseWorkspace'
import LoadingScreen from './components/LoadingScreen'
import LoginScreen from './components/LoginScreen'
import { StepTitle, Button, Icons } from './components/ui'
import { STEPS } from './steps/stepMeta'
import logoSvg from './assets/Toro-Logo2.svg'
import * as Steps from './steps'

const stepComponents = [
  Steps.Step1SelectCourse,
  Steps.Step2ChooseDestination,
  Steps.Step2ConfirmTargetMap,
  Steps.Step3UploadImagery,
  Steps.Step4AlignImagery,
  Steps.Step5AccuracyCheck,
  Steps.Step6PreviewFinalMap,
  Steps.Step7Publish,
  Steps.Step8Success,
] as const

const WizardShell: React.FC = () => {
  const { currentStep, currentStepIsValid, completedSteps, resetWizard, setCurrentStep } = useWizardStore()
  const StepComponent = stepComponents[currentStep - 1]
  const meta = STEPS[currentStep - 1]
  const isSuccess = currentStep === 9

  const handleBackToHome = () => {
    resetWizard()
  }

  if (!StepComponent || !meta) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: colors.canvas }}>
      {/* Top bar */}
      <header style={{
        height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: colors.white, borderBottom: `1px solid ${colors.gray200}`, zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoSvg} alt="Toro" style={{ width: 26, height: 26 }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: colors.ink, letterSpacing: '-0.01em' }}>Strata</span>
          <span style={{ width: 1, height: 18, background: colors.gray200, margin: '0 2px' }} />
          <span style={{ fontSize: 14, color: colors.gray500, fontWeight: 500 }}>Course Imagery Publisher</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBackToHome} iconLeft={<Icons.X size={16} />}>
          Exit pipeline
        </Button>
      </header>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <WizardSidebar currentStep={currentStep} completedSteps={completedSteps} onJump={(n) => setCurrentStep(n)} />

        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div
            key={currentStep}
            className="animate-fade-up"
            style={{
              maxWidth: isSuccess ? 720 : (currentStep === 4 ? 1320 : (currentStep === 5 ? 1180 : 880)),
              margin: '0 auto',
              padding: '40px 40px 48px',
              width: '100%',
            }}
          >
            {!isSuccess && <div style={{ marginBottom: 28 }}><StepTitle eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} /></div>}
            <StepComponent />
          </div>
        </main>
      </div>

      <WizardFooter currentStep={currentStep} totalSteps={9} isValid={currentStepIsValid} onFinish={handleBackToHome} />
    </div>
  )
}

const AppContent: React.FC = () => {
  const [showApp, setShowApp] = useState(false)
  const [authed, setAuthed] = useState(() => {
    try { return sessionStorage.getItem('strata-auth') === '1' } catch { return false }
  })
  const { currentStep, pipelineStarted } = useWizardStore()
  const view = useUIStore((s) => s.view)
  const activeCourseId = useUIStore((s) => s.activeCourseId)

  if (!showApp) return <LoadingScreen duration={2100} onComplete={() => setShowApp(true)} />

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />

  const inWizard = currentStep >= 1 || pipelineStarted
  if (inWizard) return <WizardShell />

  if (view === 'course' && activeCourseId && getCourse(activeCourseId)) {
    return <CourseWorkspace courseId={activeCourseId} />
  }

  return <Dashboard onStart={() => useWizardStore.getState().setCurrentStep(1)} />
}

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
)

export default App
