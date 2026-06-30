export interface StepMeta {
  key: string
  num: number
  /** short label for the sidebar stepper */
  label: string
  /** small caption under the sidebar label */
  caption: string
  /** eyebrow shown above the step title */
  eyebrow: string
  /** large step title */
  title: string
  /** supporting subtitle under the title */
  subtitle: string
}

export const STEPS: StepMeta[] = [
  { key: 'Step1SelectCourse', num: 1, label: 'Select course', caption: 'Choose a course',
    eyebrow: 'Step 1 of 8', title: 'Select a course',
    subtitle: 'Pick the golf course you want to publish drone imagery for. Search by name, ID, customer, or location.' },
  { key: 'Step2ConfirmTargetMap', num: 2, label: 'Confirm target', caption: 'Verify the location',
    eyebrow: 'Step 2 of 8', title: 'Confirm the target map',
    subtitle: 'Make sure the satellite location matches the course before you upload imagery.' },
  { key: 'Step3UploadImagery', num: 3, label: 'Upload imagery', caption: 'Add your image',
    eyebrow: 'Step 3 of 8', title: 'Upload drone imagery',
    subtitle: 'Drag in a high-resolution PNG or JPEG of the course. Up to 50 MB, at least 2000px on the long edge.' },
  { key: 'Step4AlignImagery', num: 4, label: 'Align imagery', caption: 'Position overlay',
    eyebrow: 'Step 4 of 8', title: 'Align the overlay',
    subtitle: 'Adjust opacity and nudge the imagery until course features line up with the satellite basemap.' },
  { key: 'Step5AccuracyCheck', num: 5, label: 'Accuracy check', caption: 'Verify alignment',
    eyebrow: 'Step 5 of 8', title: 'Verify alignment accuracy',
    subtitle: 'Confirm each feature aligns with the satellite imagery. All items must be checked to continue.' },
  { key: 'Step6PreviewFinalMap', num: 6, label: 'Preview', caption: 'Review result',
    eyebrow: 'Step 6 of 8', title: 'Preview the final map',
    subtitle: 'Toggle before and after to see exactly how your imagery will appear once published.' },
  { key: 'Step7Publish', num: 7, label: 'Publish', caption: 'Send it live',
    eyebrow: 'Step 7 of 8', title: 'Review & publish',
    subtitle: 'Double-check the details below, then publish your imagery to the selected environment.' },
  { key: 'Step8Success', num: 8, label: 'Done', caption: 'Published',
    eyebrow: 'All done', title: 'Imagery published',
    subtitle: 'Your course imagery is live. Start a new pipeline or export the publish package.' },
]
