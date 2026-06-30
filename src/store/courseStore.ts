import { create } from 'zustand'
import { MAPBOX_TOKEN } from '../mapbox/mapboxConfig'

export type CourseStatus = 'ready' | 'in_progress' | 'published'

/** A drone-imagery overlay attached to a course. */
export interface CourseOverlay {
  id: string;
  name: string;
  imageUrl: string;
  capturedAt?: string;
  opacity: number;          // 0..1
  enabled: boolean;         // toggled on/off on the live map
  coordinates: [number, number][]; // 4 corners: TL, TR, BR, BL ([lng, lat])
  status: 'draft' | 'published';
  createdAt: string;
}

export type ActivityKind = 'created' | 'uploaded' | 'aligned' | 'published' | 'toggled' | 'updated';
export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  at: string;               // ISO
  actor?: string;
}

export interface Course {
  id: string;
  name: string;
  customerId?: string;
  location: { longitude: number; latitude: number };
  environment: 'sandbox' | 'staging' | 'production';
  city?: string;
  state?: string;
  holes?: number;
  acres?: number;
  status: CourseStatus;
  lastPublished?: string; // ISO date
  overlays: CourseOverlay[];
  activity: ActivityEvent[];
  hasPendingChanges?: boolean;
}

interface CourseState {
  selectedCourse: Course | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectCourse: (course: Course) => void;
  clearCourse: () => void;
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'status' | 'overlays' | 'activity'> & { status?: CourseStatus }) => Course;
  addOverlay: (courseId: string, overlay: Omit<CourseOverlay, 'id' | 'createdAt' | 'status' | 'enabled'> & { status?: CourseOverlay['status']; enabled?: boolean }) => CourseOverlay;
  toggleOverlay: (courseId: string, overlayId: string) => void;
  setOverlayOpacity: (courseId: string, overlayId: string, opacity: number) => void;
  publishCourse: (courseId: string) => void;
  markPublished: (courseId: string) => void;
  setCourseLocation: (courseId: string, longitude: number, latitude: number) => void;
  addActivity: (courseId: string, event: Omit<ActivityEvent, 'id' | 'at'> & { at?: string }) => void;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

/** Build a 4-corner overlay box centered on a point, sized for the image aspect. */
export const overlayBox = (lng: number, lat: number, aspect = 1.5, base = 0.0045): [number, number][] => {
  const cos = Math.max(0.2, Math.cos((lat * Math.PI) / 180))
  let halfLng: number, halfLat: number
  if (aspect >= 1) { halfLat = base; halfLng = (base * aspect) / cos }
  else { halfLng = base / cos; halfLat = base / aspect }
  return [
    [lng - halfLng, lat + halfLat],
    [lng + halfLng, lat + halfLat],
    [lng + halfLng, lat - halfLat],
    [lng - halfLng, lat - halfLat],
  ]
}

/** A satellite still that stands in as captured drone imagery for seeded overlays. */
const mockOverlayImage = (lng: number, lat: number, zoom = 16) =>
  MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${zoom},0/600x400@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`
    : ''

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

const seedPublished = (lng: number, lat: number, name: string, capturedDaysAgo: number): CourseOverlay => ({
  id: uid('ov'),
  name,
  imageUrl: mockOverlayImage(lng, lat),
  capturedAt: daysAgo(capturedDaysAgo),
  opacity: 0.85,
  enabled: true,
  coordinates: overlayBox(lng, lat, 1.5),
  status: 'published',
  createdAt: daysAgo(capturedDaysAgo),
})

const MOCK_COURSES: Course[] = [
  {
    id: 'TC-1042', name: 'Wicker Point Golf Club', customerId: 'acc-10042',
    location: { longitude: -85.953, latitude: 32.933 }, environment: 'production',
    city: 'Alexander City', state: 'AL', holes: 18, acres: 230, status: 'published', lastPublished: daysAgo(12),
    overlays: [seedPublished(-85.953, 32.933, 'Aerial survey — Spring 2026', 12)],
    activity: [
      { id: uid('a'), kind: 'published', message: 'Published imagery to production', at: daysAgo(12), actor: 'You' },
      { id: uid('a'), kind: 'aligned', message: 'Overlay aligned and reviewed', at: daysAgo(12), actor: 'You' },
      { id: uid('a'), kind: 'uploaded', message: 'Uploaded aerial-survey-spring.tif', at: daysAgo(13), actor: 'You' },
      { id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(40) },
    ],
  },
  {
    id: 'TC-0987', name: 'TPC Twin Cities', customerId: 'acc-09870',
    location: { longitude: -93.214, latitude: 45.178 }, environment: 'production',
    city: 'Blaine', state: 'MN', holes: 18, acres: 245, status: 'published', lastPublished: daysAgo(31),
    overlays: [seedPublished(-93.214, 45.178, 'Course flyover — May 2026', 31)],
    activity: [
      { id: uid('a'), kind: 'published', message: 'Published imagery to production', at: daysAgo(31), actor: 'You' },
      { id: uid('a'), kind: 'uploaded', message: 'Uploaded course-flyover-may.tif', at: daysAgo(32), actor: 'You' },
      { id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(60) },
    ],
  },
  {
    id: 'TC-0761', name: 'Pinehurst No. 4', customerId: 'acc-07610',
    location: { longitude: -79.471, latitude: 35.192 }, environment: 'staging',
    city: 'Pinehurst', state: 'NC', holes: 18, acres: 210, status: 'in_progress',
    overlays: [{
      id: uid('ov'), name: 'Drone capture — draft', imageUrl: mockOverlayImage(-79.471, 35.192),
      capturedAt: daysAgo(2), opacity: 0.7, enabled: true, coordinates: overlayBox(-79.471, 35.192, 1.5),
      status: 'draft', createdAt: daysAgo(2),
    }],
    hasPendingChanges: true,
    activity: [
      { id: uid('a'), kind: 'aligned', message: 'Overlay alignment in progress', at: daysAgo(2), actor: 'You' },
      { id: uid('a'), kind: 'uploaded', message: 'Uploaded drone-capture-0418.tif', at: daysAgo(2), actor: 'You' },
      { id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(9) },
    ],
  },
  {
    id: 'TC-0654', name: 'Whistling Straits — Straits', customerId: 'acc-06540',
    location: { longitude: -87.726, latitude: 43.852 }, environment: 'staging',
    city: 'Kohler', state: 'WI', holes: 18, acres: 560, status: 'ready', overlays: [],
    activity: [{ id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(5) }],
  },
  {
    id: 'TC-0532', name: 'Bandon Dunes', customerId: 'acc-05320',
    location: { longitude: -124.391, latitude: 43.184 }, environment: 'sandbox',
    city: 'Bandon', state: 'OR', holes: 18, acres: 290, status: 'ready', overlays: [],
    activity: [{ id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(3) }],
  },
  {
    id: 'TC-0488', name: 'Erin Hills', customerId: 'acc-04880',
    location: { longitude: -88.300, latitude: 43.232 }, environment: 'sandbox',
    city: 'Erin', state: 'WI', holes: 18, acres: 652, status: 'ready', overlays: [],
    activity: [{ id: uid('a'), kind: 'created', message: 'Course added to Strata', at: daysAgo(1) }],
  },
]

// Clone so mutations don't affect the module-level constant
let _courses = MOCK_COURSES.map((c) => ({ ...c }))

export const useCourseStore = create<CourseState>((set, get) => {
  // Apply a transform to one course in both the working array and selectedCourse.
  const updateCourse = (courseId: string, fn: (c: Course) => Course) => {
    let updated: Course | null = null
    _courses = _courses.map((c) => {
      if (c.id !== courseId) return c
      updated = fn(c)
      return updated
    })
    set((state) => ({
      courses: _courses,
      selectedCourse: state.selectedCourse?.id === courseId ? updated : state.selectedCourse,
    }))
    return updated
  }

  const pushActivity = (c: Course, ev: Omit<ActivityEvent, 'id' | 'at'> & { at?: string }): ActivityEvent[] =>
    [{ id: uid('a'), at: new Date().toISOString(), ...ev }, ...c.activity].slice(0, 60)

  return {
    selectedCourse: null,
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    selectCourse: (course) => set({ selectedCourse: course }),
    clearCourse: () => set({ selectedCourse: null, searchQuery: '' }),
    courses: _courses,

    addCourse: (newCourse) => {
      const seq = String(_courses.length + 1).padStart(4, '0')
      const id = `TC-${seq}`
      const course: Course = {
        status: 'ready', overlays: [], hasPendingChanges: false,
        ...newCourse, id,
        activity: [{ id: uid('a'), kind: 'created', message: 'Course added to Strata', at: new Date().toISOString(), actor: 'You' }],
      }
      _courses = [course, ..._courses]
      set({ courses: _courses })
      return course
    },

    addOverlay: (courseId, ov) => {
      const overlay: CourseOverlay = {
        id: uid('ov'), createdAt: new Date().toISOString(), status: 'draft', enabled: true,
        ...ov,
      }
      updateCourse(courseId, (c) => ({
        ...c,
        overlays: [overlay, ...c.overlays],
        hasPendingChanges: true,
        status: c.status === 'ready' ? 'in_progress' : c.status,
        activity: pushActivity(c, { kind: 'uploaded', message: `Added imagery “${overlay.name}”`, actor: 'You' }),
      }))
      return overlay
    },

    toggleOverlay: (courseId, overlayId) => {
      updateCourse(courseId, (c) => {
        const target = c.overlays.find((o) => o.id === overlayId)
        const next = !(target?.enabled ?? false)
        return {
          ...c,
          overlays: c.overlays.map((o) => (o.id === overlayId ? { ...o, enabled: next } : o)),
          hasPendingChanges: true,
          activity: pushActivity(c, { kind: 'toggled', message: `${next ? 'Enabled' : 'Hid'} overlay “${target?.name ?? ''}”`, actor: 'You' }),
        }
      })
    },

    setOverlayOpacity: (courseId, overlayId, opacity) => {
      updateCourse(courseId, (c) => ({
        ...c,
        overlays: c.overlays.map((o) => (o.id === overlayId ? { ...o, opacity } : o)),
        hasPendingChanges: true,
      }))
    },

    publishCourse: (courseId) => {
      const now = new Date().toISOString()
      updateCourse(courseId, (c) => ({
        ...c,
        status: 'published',
        lastPublished: now,
        hasPendingChanges: false,
        overlays: c.overlays.map((o) => ({ ...o, status: 'published' as const })),
        activity: pushActivity(c, { kind: 'published', message: `Published changes to ${c.environment}`, actor: 'You' }),
      }))
    },

    markPublished: (courseId) => get().publishCourse(courseId),

    setCourseLocation: (courseId, longitude, latitude) => {
      updateCourse(courseId, (c) => ({ ...c, location: { longitude, latitude } }))
    },

    addActivity: (courseId, ev) => {
      updateCourse(courseId, (c) => ({ ...c, activity: pushActivity(c, ev) }))
    },
  }
})

export const getCourse = (id: string | null | undefined) =>
  id ? useCourseStore.getState().courses.find((c) => c.id === id) ?? null : null

export const getFilteredCourses = (query: string) => {
  const courses = useCourseStore.getState().courses
  if (!query) return courses
  const lower = query.toLowerCase()
  return courses.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.id.toLowerCase().includes(lower) ||
    (c.customerId && c.customerId.toLowerCase().includes(lower)) ||
    (c.city && c.city.toLowerCase().includes(lower)) ||
    (c.state && c.state.toLowerCase().includes(lower))
  )
}

export const getCourseStats = () => {
  const courses = useCourseStore.getState().courses
  return {
    total: courses.length,
    active: courses.filter(c => c.status === 'in_progress').length,
    published: courses.filter(c => c.status === 'published').length,
  }
}

export interface RecentActivityItem extends ActivityEvent {
  courseId: string;
  courseName: string;
}

/** Activity across all courses, newest first. */
export const getRecentActivity = (limit = 8): RecentActivityItem[] => {
  const courses = useCourseStore.getState().courses
  const all: RecentActivityItem[] = []
  for (const c of courses) {
    for (const ev of c.activity) all.push({ ...ev, courseId: c.id, courseName: c.name })
  }
  all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return all.slice(0, limit)
}

/** Satellite thumbnail for a course via the Mapbox Static Images API. */
export const courseThumb = (course: Course, w = 480, h = 300, zoom = 14) => {
  const { longitude, latitude } = course.location
  if (!MAPBOX_TOKEN) return ''
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},${zoom},0/${w}x${h}@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`
}

export const formatLocation = (course: Course) =>
  [course.city, course.state].filter(Boolean).join(', ') || `${course.location.latitude.toFixed(3)}, ${course.location.longitude.toFixed(3)}`
