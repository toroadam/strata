import { create } from 'zustand'

export interface AccuracyChecklist {
  cartPathsAligned: boolean;
  greensAligned: boolean;
  teeBoxesAligned: boolean;
  bunkersAligned: boolean;
  waterFeaturesAligned: boolean;
  surroundingRoadsAligned: boolean;
  doesNotCoverWrongProperty: boolean;
  correctCourseTarget: boolean;
  sourceApproved: boolean;
}

interface ChecklistState {
  checklist: AccuracyChecklist;
  updateCheck: (key: keyof AccuracyChecklist) => void;
  resetChecklist: () => void;
}

const INITIAL_CHECKLIST: AccuracyChecklist = {
  cartPathsAligned: false,
  greensAligned: false,
  teeBoxesAligned: false,
  bunkersAligned: false,
  waterFeaturesAligned: false,
  surroundingRoadsAligned: false,
  doesNotCoverWrongProperty: false,
  correctCourseTarget: false,
  sourceApproved: false,
}

export const useChecklistStore = create<ChecklistState>((set) => ({
  checklist: INITIAL_CHECKLIST,
  updateCheck: (key) => set((state) => ({ checklist: { ...state.checklist, [key]: !state.checklist[key] } })),
  resetChecklist: () => set({ checklist: INITIAL_CHECKLIST }),
}))

export const isChecklistComplete = (checklist: AccuracyChecklist): boolean => {
  return Object.values(checklist).every(Boolean)
}
