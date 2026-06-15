import React from 'react';
import { useWizardStore } from '@/store/wizard-store';
import WizardShell from '@/components/WizardShell';
import SetupStep from '@/components/wizard/SetupStep';
import ImportStep from '@/components/wizard/ImportStep';
import GeoreferenceStep from '@/components/wizard/GeoreferenceStep';
import ReviewStep from '@/components/wizard/ReviewStep';
import ProcessStep from '@/components/wizard/ProcessStep';
import UploadStep from '@/components/wizard/UploadStep';
import CompleteStep from '@/components/wizard/CompleteStep';

const STEPS: { id: string; label: string }[] = [
  { id: 'setup', label: 'Setup' },
  { id: 'import', label: 'Import' },
  { id: 'georeference', label: 'Georeference' },
  { id: 'review', label: 'Review' },
  { id: 'process', label: 'Process' },
  { id: 'upload', label: 'Upload' },
  { id: 'complete', label: 'Complete' },
];

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  setup: SetupStep,
  import: ImportStep,
  georeference: GeoreferenceStep,
  review: ReviewStep,
  process: ProcessStep,
  upload: UploadStep,
  complete: CompleteStep,
};

const App: React.FC = () => {
  const { currentStep } = useWizardStore();
  const StepComponent = STEP_COMPONENTS[currentStep] || SetupStep;
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-toro-50 via-white to-toro-100 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1B3A5C" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <WizardShell currentStep={currentStep} stepIndex={stepIndex}>
        {/* Step content */}
        <StepComponent />
      </WizardShell>
    </div>
  );
};

export default App;
