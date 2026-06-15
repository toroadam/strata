export interface UploadValidationResult {
  isValid: boolean;
  error?: string;
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
export const SUPPORTED_TYPES = ['image/png', 'image/jpeg']
export const MIN_DIMENSION = 2000
export const MAX_DIMENSION = 10000

export async function validateImageFile(file: File): Promise<UploadValidationResult> {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Unsupported file type. Please upload a PNG or JPEG image.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 50 MB.` }
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
        resolve({ isValid: false, error: `Image dimensions (${img.width}x${img.height}) are too small. Minimum recommended is ${MIN_DIMENSION}px.` })
      } else if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        resolve({ isValid: false, error: `Image dimensions (${img.width}x${img.height}) exceed maximum allowed (${MAX_DIMENSION}px).` })
      } else {
        resolve({ isValid: true })
      }
    }
    img.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read image file. The file may be corrupted.' })
    }
    img.src = URL.createObjectURL(file)
  })
}
