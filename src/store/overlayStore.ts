import { create } from 'zustand'

export type LngLat = [longitude: number, latitude: number]

export interface CourseImageOverlay {
  id: string;
  opacity: number;
  coordinates: {
    topLeft: LngLat;
    topRight: LngLat;
    bottomRight: LngLat;
    bottomLeft: LngLat;
  };
  rotationDegrees?: number;
  accuracyLabel: 'rough_placement' | 'visually_aligned' | 'reviewed' | 'ready_to_publish';
  notes?: string;
  updatedAt: string;
}

interface OverlayState {
  overlay: CourseImageOverlay | null;
  setOverlay: (overlay: CourseImageOverlay) => void;
  updateOpacity: (opacity: number) => void;
  updateCoordinates: (coordinates: CourseImageOverlay['coordinates']) => void;
  updateNotes: (notes: string) => void;
  resetOverlay: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  updateOpacity: (opacity) => set((state) => state.overlay ? { overlay: { ...state.overlay, opacity } } : state),
  updateCoordinates: (coordinates) => set((state) => state.overlay ? { overlay: { ...state.overlay, coordinates } } : state),
  updateNotes: (notes) => set((state) => state.overlay ? { overlay: { ...state.overlay, notes } } : state),
  resetOverlay: () => set({ overlay: null }),
}))
