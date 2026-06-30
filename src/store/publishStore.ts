import { create } from 'zustand'

export interface PublishResult {
  id: string;
  status: 'success' | 'failed';
  publishedAt: string;
  destination?: string;
  errorMessage?: string;
}

interface PublishState {
  result: PublishResult | null;
  setResult: (result: PublishResult) => void;
}

export const usePublishStore = create<PublishState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}))
