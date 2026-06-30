import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Kept for backward compatibility with imports elsewhere.
export type StepId = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8'

interface WizardState {
  currentStep: number;
  completedSteps: number[];
  pipelineStarted: boolean;
  currentStepIsValid: boolean;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStepIsValid: (val: boolean) => void;
  resetWizard: () => void;
  setPipelineStarted: (val: boolean) => void;
}

if (typeof window !== 'undefined') {
  try { localStorage.removeItem('wizard-store') } catch {}
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      completedSteps: [],
      pipelineStarted: false,
      currentStepIsValid: false,

      setCurrentStep: (step) => set({ currentStep: step, currentStepIsValid: false }),

      completeStep: (step) => {
        const state = get()
        if (!state.completedSteps.includes(step)) {
          set({ completedSteps: [...state.completedSteps, step] })
        }
      },

      nextStep: () => {
        const state = get()
        if (state.currentStep < 8) set({ currentStep: state.currentStep + 1, currentStepIsValid: false })
      },

      prevStep: () => {
        const state = get()
        if (state.currentStep > 1) set({ currentStep: state.currentStep - 1, currentStepIsValid: true })
      },

      setCurrentStepIsValid: (val) => set({ currentStepIsValid: val }),

      resetWizard: () => set({
        currentStep: 0,
        completedSteps: [],
        pipelineStarted: false,
        currentStepIsValid: false,
      }),

      setPipelineStarted: (val) => set({ pipelineStarted: val }),
    }),
    {
      name: 'wizard-store',
      version: 3,
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.setPipelineStarted(false)
      }
    }
  )
)
