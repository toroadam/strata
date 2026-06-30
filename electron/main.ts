import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const { app, BrowserWindow } = await import('electron')
  
    let mainWindow = null

    const { screen } = await import('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    function createWindow() {
      // Calculate window size at 80% of screen width, with sensible min/max bounds
      const minWidth = Math.min(Math.max(1440, screenWidth * 0.8), screenWidth * 0.9)
      const minHeight = Math.min(Math.max(900, screenHeight * 0.75), screenHeight - 50)
      
      mainWindow = new BrowserWindow({
        width: minWidth,
        height: minHeight,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

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
}

main()
