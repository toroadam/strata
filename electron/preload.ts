import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // GDAL operations
  checkGdalVersion: (gdalPath: string) => ipcRenderer.invoke('gdal:checkVersion', gdalPath),
  getGdalInfo: (gdalPath: string, filePath: string) => ipcRenderer.invoke('gdal:info', gdalPath, filePath),
  runGdalTranslate: (gdalPath: string, args: string[]) => ipcRenderer.invoke('gdal:translate', gdalPath, args),
  runGdalWarp: (gdalPath: string, args: string[]) => ipcRenderer.invoke('gdal:warp', gdalPath, args),
});
