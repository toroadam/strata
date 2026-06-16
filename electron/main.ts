import { app, BrowserWindow } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // Robustly handle Vite dev server URL for Electron
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  
  mainWindow.loadURL(devUrl).catch(err => {
    console.error('Failed to load Vite dev server:', err)
    // Fallback to built app if dev server is unreachable
    mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
