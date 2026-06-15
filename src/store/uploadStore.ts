import { create } from 'zustand'

export interface UploadedImage {
  id: string;
  originalFileName: string;
  previewUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  sizeBytes: number;
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
