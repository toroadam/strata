import { create } from 'zustand'

export interface MapboxDestination {
  /** Full style id, e.g. "toroadam/clxyz123" or "mapbox/satellite-streets-v12" */
  styleId: string
  /** Human-friendly name shown in the UI */
  styleName: string
  /** mapbox://styles/... URL used as the alignment basemap + publish target */
  styleUrl: string
  /** Optional account/owner the style belongs to */
  owner?: string
  /** Whether this came from the account API (true) or the built-in fallback list (false) */
  fromAccount: boolean
}

interface DestinationState {
  destination: MapboxDestination | null
  setDestination: (destination: MapboxDestination | null) => void
  reset: () => void
}

export const useDestinationStore = create<DestinationState>((set) => ({
  destination: null,
  setDestination: (destination) => set({ destination }),
  reset: () => set({ destination: null }),
}))
