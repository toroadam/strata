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

  // Explicitly detect development mode to prevent falling back to missing dist files
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV !== 'production'
  
  if (isDev) {
    console.log('[Electron] Loading Vite dev server at http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('[Electron] Failed to load Vite dev server:', err)
    })
  } else {
    console.log('[Electron] Loading production build from dist/')
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
