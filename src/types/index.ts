// Mapbox API response types
export interface MapboxStyle {
  id: string;
  name: string;
  url?: string;
  thumbnail_url?: string;
}

export interface MapboxUpload {
  id: string;
  name: string;
  state: string;
  url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

// Wizard step types
export type WizardStep = 'setup' | 'import' | 'georeference' | 'review' | 'process' | 'upload' | 'complete';

// Georeference types
export interface ControlPoint {
  id: number;
  imageX: number; // pixel coords in drone image
  imageY: number;
  lng: number;    // map coordinates
  lat: number;
}

export interface GeotiffInfo {
  width: number;
  height: number;
  crs: string;
  bands: number;
  hasAlpha: boolean;
  fileSizeBytes: number;
}

// Wizard state
export interface DroneImageInfo {
  name: string;
  dimensions: string;
  fileSizeMB: number;
  sizeStr: string;
  filePath: string;
  width: number;
  height: number;
}

export interface WizardState {
  currentStep: WizardStep;

  // Setup
  mapboxSecretToken: string;
  mapboxAccessToken: string;
  targetStyleId: string;
  targetStyleName: string;
  gdalInstalled: boolean | null;
  gdalPath: string | null;

  // Import
  droneImageFile: File | null;
  droneImagePreviewUrl: string | null;
  droneImageInfo: DroneImageInfo | null;

  // Georeference
  controlPoints: ControlPoint[];
  georefMatrix: number[][] | null;

  // Process
  processingProgress: number; // 0-100
  processingLog: string[];

  // Upload
  uploadId: string | null;
  uploadState: 'pending' | 'uploading' | 'tiling' | 'complete' | 'failed';
  uploadError: string | null;
  uploadProgress: number; // 0-100

  // Complete
  tilesetId: string | null;

  // Actions
  setCurrentStep: (step: WizardStep) => void;
  setMapboxSecretToken: (token: string) => void;
  setMapboxAccessToken: (token: string) => void;
  setTargetStyleId: (id: string) => void;
  setTargetStyleName: (name: string) => void;
  setGdalStatus: (installed: boolean | null, path?: string | null) => void;
  setDroneImageFile: (file: File | null) => void;
  setDroneImagePreviewUrl: (url: string | null) => void;
  setDroneImageInfo: (info: DroneImageInfo | null) => void;
  addControlPoint: (point: ControlPoint) => void;
  clearControlPoints: () => void;
  removeControlPoint: (id: number) => void;
  setGeorefMatrix: (matrix: number[][] | null) => void;
  setProcessingProgress: (progress: number) => void;
  addProcessingLog: (message: string) => void;
  clearProcessingLog: () => void;
  setUploadingState: (state: 'pending' | 'uploading' | 'tiling' | 'complete' | 'failed') => void;
  setUploadError: (error: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploadingId: (id: string) => void;
  resetWizard: () => void;
}
