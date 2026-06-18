import electron from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { app, BrowserWindow } = electron
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL
  
  if (isDev) {
    // Explicitly load the Vite dev server in development mode
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load Vite dev server:', err)
    })
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
