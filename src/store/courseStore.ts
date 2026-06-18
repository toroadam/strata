import { create } from 'zustand'

export interface Course {
  id: string;
  name: string;
  customerId?: string;
  location: { longitude: number; latitude: number };
  environment: 'sandbox' | 'staging' | 'production';
}

interface CourseState {
  selectedCourse: Course | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectCourse: (course: Course) => void;
  clearCourse: () => void;
}

const MOCK_COURSES: Course[] = [
  { id: 'c-001', name: 'Wicker Point Golf Club', customerId: 'acc-123', location: { longitude: -93.265, latitude: 44.978 }, environment: 'sandbox' },
  { id: 'c-002', name: 'Toro Valley Resort', customerId: 'acc-456', location: { longitude: -118.243, latitude: 34.052 }, environment: 'staging' },
  { id: 'c-003', name: 'Pinehurst Course 4', customerId: 'acc-789', location: { longitude: -79.512, latitude: 35.186 }, environment: 'production' },
]

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectCourse: (course) => set({ selectedCourse: course }),
  clearCourse: () => set({ selectedCourse: null, searchQuery: '' }),
}))

export const getFilteredCourses = (query: string) => {
  if (!query) return MOCK_COURSES
  const lower = query.toLowerCase()
  return MOCK_COURSES.filter(c => 
    c.name.toLowerCase().includes(lower) || 
    c.id.toLowerCase().includes(lower) || 
    (c.customerId && c.customerId.toLowerCase().includes(lower))
  )
}
