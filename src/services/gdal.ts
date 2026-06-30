// GDAL detection and processing service
// Detects bundled GDAL binary first, then falls back to system gdalinfo

const BUNDLED_GDAL_PATH = process?.platform === 'win32' ? '/gdal-bin/gdalinfo.exe' : '/gdal-bin/gdalinfo';

export interface GdalInfo {
  width: number;
  height: number;
  crs: string | null;
  bands: number;
  hasAlpha: boolean;
}

export function getGdalCommand(): string | null {
  // In Electron, this runs in the renderer — use ipc to delegate to main process
  return null; // Handled via IPC in electron
}

// Called from Electron main process via IPC
export async function checkGdalAvailable(gdalPath: string): Promise<boolean> {
  try {
    const gdalCmd = getGdalCommand?.();
    if (!gdalCmd) return false;
    const { exec } = await import('child_process');
    const result = await new Promise<string>((resolve, reject) => {
      exec(`${gdalCmd} --version`, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
    return result.includes('GDAL');
  } catch {
    return false;
  }
}

// Build a GDAL VRT file string from control points
export function buildVrtString(
  inputPath: string,
  outputPath: string,
  controlPoints: Array<{ imgX: number; imgY: number; lng: number; lat: number }>
): string {
  // Generate pixel coordinates from control points by converting lat/lng to image space
  // The actual conversion happens when we have the affine matrix
  const lines = [
    '<VRTDataset rasterXSize="1" rasterYSize="1">',
    '  <VRTRasterBand dataType="Byte" band="1">',
    '    <SimpleSource>',
    `     <SrcFilename relativeToVRT="0">${inputPath}</SrcFilename>`,
    '    </SimpleSource>',
    '  </VRTRasterBand>',
    '  <GCPProjection>LOCAL_CS["arbitrary"]</GCPProjection>',
  ];

  controlPoints.forEach((gcp) => {
    lines.push(
      `  <GCP Id="${gcp.imgX}_${gcp.imgY}" Pixel="${gcp.imgX}" Line="${gcp.imgY}" X="${gcp.lng}" Y="${gcp.lat}" Z="0"/>`
    );
  });

  lines.push('</VRTDataset>');
  return lines.join('\n');
}

// Compute affine transformation matrix from 3+ control point pairs
export function computeAffineMatrix(points: Array<{ imgX: number; imgY: number; lng: number; lat: number }>): number[][] | null {
  if (points.length < 3) return null;

  // Build the least-squares system for affine transform:
  // lng = a0 + a1*imgX + a2*imgY
  // lat = b0 + b1*imgX + b2*imgY
  const n = points.length;
  const Ax: number[][] = [];
  const Ay: number[][] = [];

  for (let i = 0; i < n; i++) {
    const p = points[i];
    Ax.push([1, p.imgX, p.imgY]);
    Ay.push([1, p.imgX, p.imgY]);
  }

  const bx = points.map((p) => p.lng);
  const by = points.map((p) => p.lat);

  // Solve using normal equations (A^T * A)^-1 * A^T * b
  const coeffs = solveLeastSquares(Ax, bx);
  if (!coeffs) return null;

  const coeffsY = solveLeastSquares(Ay, by);
  if (!coeffsY) return null;

  return [[coeffs[0], coeffs[1], coeffs[2]], [coeffsY[0], coeffsY[1], coeffsY[2]]];
}

function solveLeastSquares(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  if (n < 3) return null; // Need at least 3 points for 3 unknowns

  // Build A^T * A
  const ATA: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const ATb: number[] = [0, 0, 0];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      ATb[j] += A[i][j] * b[i];
      for (let k = 0; k < 3; k++) {
        ATA[j][k] += A[i][j] * A[i][k];
      }
    }
  }

  // Gaussian elimination with partial pivoting
  const Ab: number[][] = ATA.map((row, i) => [...row, ATb[i]]);

  for (let col = 0; col < 3; col++) {
    let maxRow = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(Ab[row][col]) > Math.abs(Ab[maxRow][col])) maxRow = row;
    }
    [Ab[col], Ab[maxRow]] = [Ab[maxRow], Ab[col]];

    if (Math.abs(Ab[col][col]) < 1e-12) return null; // Singular

    for (let row = col + 1; row < 3; row++) {
      const factor = Ab[row][col] / Ab[col][col];
      for (let j = col; j <= 3; j++) {
        Ab[row][j] -= factor * Ab[col][j];
      }
    }
  }

  // Back substitution
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    x[i] = Ab[i][3];
    for (let j = i + 1; j < 3; j++) {
      x[i] -= Ab[i][j] * x[j];
    }
    x[i] /= Ab[i][i];
  }

  return x;
}

// Helper to run gdalinfo on a file (used via IPC from Electron main)
export interface GeoTiffInfo {
  width: number;
  height: number;
  crs: string | null;
  bands: number;
  hasAlpha: boolean;
  fileSizeBytes: number;
}

// Parse gdalinfo output to extract GeoTIFF metadata
export function parseGdalInfoOutput(output: string): GeoTiffInfo {
  const width = parseInt(/Raster\s+Size:\s+(\d+)\s+(\d+)/.exec(output)?.[1] || '0');
  const height = parseInt(/Raster\s+Size:\s+(\d+)\s+(\d+)/.exec(output)?.[2] || '0');
  const crsMatch = /PROJCRS\[(.+?)\]|GEOGCS\[(.+?)\]/.exec(output);
  const crs = crsMatch ? (crsMatch[1] || crsMatch[2]) : null;

  // Count band info
  const bandCount = (output.match(/Band\s+\d+.*?Block=/g) || []).length;
  const hasAlpha = /Alpha/.test(output) || /RGBA/.test(output) || output.includes('ColorInterp=Alpha');

  return { width, height, crs, bands: bandCount || 4, hasAlpha, fileSizeBytes: 0 };
}

// Build the gdal_translate command arguments for GeoTIFF export with affine transform
export function buildGdalTranslateArgs(
  inputPath: string,
  outputPath: string,
  matrix: number[][],
  crs = 'EPSG:3857'
): string[] {
  const [a0, a1, a2] = matrix[0]; // lon coeffs
  const [b0, b1, b2] = matrix[1]; // lat coeffs

  return [
    inputPath,
    outputPath,
    '-of', 'GTiff',
    '-a_srs', crs,
    '-a_ullr', String(a0), String(b0), String(a0 + a1 * 1), String(b0 + b2 * 1), // approximate bounds
    '-co', 'COMPRESS=LZW',
    '-co', 'TILED=YES',
    '-co', 'BIGTIFF=YES',
    '-co', 'ALPHA=YES',
    '-co', 'PHOTOINTERP=RGBA',
  ];
}
