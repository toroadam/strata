import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win === null) createWindow();
});

// IPC: Open file dialog to select drone image
ipcMain.handle('dialog:openFile', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'tif'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// IPC: Check if GDAL is installed
ipcMain.handle('gdal:checkVersion', async (_event, gdalPath: string): Promise<{ version: string | null; error: string | null }> => {
  try {
    const result = await execFileAsync(gdalPath || 'gdalinfo', ['--version']);
    const version = result.stdout.split('\n')[0]?.trim() || null;
    return { version, error: null };
  } catch (err: any) {
    return { version: null, error: err.message };
  }
});

// IPC: Run gdalinfo on a file
ipcMain.handle('gdal:info', async (_event, gdalPath: string, filePath: string): Promise<{ output: string | null; error: string | null }> => {
  try {
    const result = await execFileAsync(gdalPath || 'gdalinfo', [filePath], { timeout: 60000 });
    return { output: result.stdout, error: null };
  } catch (err: any) {
    return { output: null, error: err.message || 'gdalinfo command failed' };
  }
});

// IPC: Run gdal_translate with options
ipcMain.handle('gdal:translate', async (_event, gdalPath: string, args: string[]): Promise<{ success: boolean; error: string | null }> => {
  try {
    await execFileAsync(gdalPath || 'gdal_translate', args, { timeout: 300000 });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'gdal_translate command failed' };
  }
});

// IPC: Run a gdalwarp reprojection
ipcMain.handle('gdal:warp', async (_event, gdalPath: string, args: string[]): Promise<{ success: boolean; error: string | null }> => {
  try {
    await execFileAsync(gdalPath || 'gdalwarp', args, { timeout: 300000 });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'gdalwarp command failed' };
  }
});
