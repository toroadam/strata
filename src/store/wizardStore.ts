import { create } from 'zustand'

export type StepId = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8'

interface WizardState {
  currentStep: number;
  completedSteps: Set<StepId>;
  setCurrentStep: (step: number) => void;
  completeStep: (stepId: StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStep: 1,
  completedSteps: new Set(),
  setCurrentStep: (step) => set({ currentStep: step }),
  completeStep: (stepId) => {
    const state = get()
    const newCompleted = new Set(state.completedSteps).add(stepId)
    set({ completedSteps: newCompleted })
  },
  nextStep: () => {
    const state = get()
    if (state.currentStep < 8) {
      set({ currentStep: state.currentStep + 1 })
    }
  },
  prevStep: () => {
    const state = get()
    if (state.currentStep > 1) {
      set({ currentStep: state.currentStep - 1 })
    }
  },
  resetWizard: () => set({ currentStep: 1, completedSteps: new Set() }),
}))
