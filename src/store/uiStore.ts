import { create } from 'zustand'

export type AppView = 'dashboard' | 'course'

interface UIState {
  /** When true, the dashboard mounts with the Add Course drawer open. */
  addCourseOpen: boolean
  openAddCourse: () => void
  closeAddCourse: () => void

  /** Top-level view outside the wizard. */
  view: AppView
  activeCourseId: string | null
  /** Where to return after the wizard finishes (a course workspace), if any. */
  returnToCourseId: string | null

  openCourse: (id: string) => void
  goDashboard: () => void
  setReturnToCourse: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  addCourseOpen: false,
  openAddCourse: () => set({ addCourseOpen: true }),
  closeAddCourse: () => set({ addCourseOpen: false }),

  view: 'dashboard',
  activeCourseId: null,
  returnToCourseId: null,

  openCourse: (id) => set({ view: 'course', activeCourseId: id, addCourseOpen: false }),
  goDashboard: () => set({ view: 'dashboard', activeCourseId: null }),
  setReturnToCourse: (id) => set({ returnToCourseId: id }),
}))
