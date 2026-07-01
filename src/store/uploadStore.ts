import { create } from 'zustand'
import type { AerialSourceId, OverlayCorners } from '../services/imagerySources'

export interface UploadedImage {
  id: string;
  originalFileName: string;
  previewUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  sizeBytes: number;
  /** How the imagery got here: a user upload, or a capture from a public aerial source. */
  source: 'upload' | AerialSourceId;
  /**
   * For captured imagery only: the exact georeferenced corners of the still. Present means
   * the overlay can be dropped in already aligned — no manual warping needed.
   */
  capturedCorners?: OverlayCorners;
  /** Attribution for captured public-domain imagery. */
  attribution?: string;
}

interface UploadState {
  uploadedImage: UploadedImage | null;
  setUploadedImage: (image: UploadedImage) => void;
  clearUploadedImage: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploadedImage: null,
  setUploadedImage: (image) => set({ uploadedImage: image }),
  clearUploadedImage: () => set({ uploadedImage: null }),
}))
