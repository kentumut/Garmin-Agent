import { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme, shell } from 'electron'
import { spawn, ChildProcess } from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit()
  }
} catch (error) {
  // electron-squirrel-startup is optional, ignore if not available
  console.log('electron-squirrel-startup not available (this is fine for development)')
}

class JarvisApp {
  private mainWindow: BrowserWindow | null = null
  private backendProcess: ChildProcess | null = null
  private backendUrl: string | null = null
  private isDevelopment = process.env.NODE_ENV === 'development'

  constructor() {
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    app.on('ready', () => this.onReady())
    app.on('window-all-closed', () => this.onWindowAllClosed())
    app.on('activate', () => this.onActivate())
    app.on('before-quit', () => this.cleanup())
    app.on('will-quit', () => this.cleanup())
    
    // Ensure cleanup on process termination
    process.on('exit', () => this.cleanup())
    process.on('SIGINT', () => this.cleanup())
    process.on('SIGTERM', () => this.cleanup())
  }

  private async onReady(): Promise<void> {
    // Set app theme
    nativeTheme.themeSource = 'dark'
    
    // Create main window
    this.createMainWindow()
    
    // Start backend process
    await this.startBackend()
    
    // Register global shortcuts
    this.registerGlobalShortcuts()
    
    // Setup IPC handlers
    this.setupIpcHandlers()
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 600,
      height: 400,
      show: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      titleBarStyle: 'hidden',
      vibrancy: 'under-window',
      visualEffectState: 'active',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        webSecurity: true
      }
    })

    // Center window on screen
    this.centerWindow()

    // Load the app
    if (this.isDevelopment) {
      this.mainWindow.loadURL('http://localhost:5173')
      // this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    // Hide window when it loses focus (disabled for debugging)
    // this.mainWindow.on('blur', () => {
    //   if (this.mainWindow && this.mainWindow.isVisible()) {
    //     this.mainWindow.hide()
    //   }
    // })

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  private centerWindow(): void {
    if (!this.mainWindow) return
    
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const windowBounds = this.mainWindow.getBounds()
    
    this.mainWindow.setPosition(
      Math.round((width - windowBounds.width) / 2),
      Math.round((height - windowBounds.height) / 3)
    )
  }

  private registerGlobalShortcuts(): void {
    const success = globalShortcut.register('CommandOrControl+Shift+Space', () => {
      this.toggleWindow()
    })

    if (!success) {
      console.error('Failed to register global shortcut')
    }
  }

  private toggleWindow(): void {
    if (!this.mainWindow) return

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide()
    } else {
      this.mainWindow.show()
      this.mainWindow.focus()
      this.centerWindow()
      
      // Notify renderer that window was activated
      this.mainWindow.webContents.send('window:activated')
    }
  }

  private async startBackend(): Promise<void> {
    if (this.backendProcess) {
      console.log('Backend already running')
      return
    }

    const backendPath = this.findBackendBinary()
    if (!backendPath) {
      console.error('Backend binary not found')
      return
    }

    console.log(`Starting backend from: ${backendPath}`)
    
    // Spawn the backend process
    this.backendProcess = spawn(backendPath, ['--port', '0'], {
      stdio: ['ignore', 'pipe', 'inherit']
    })

    // Parse backend output for port information
    this.backendProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      console.log('Backend:', output.trim())
      
      const portMatch = output.match(/PORT (\d+)/)
      if (portMatch) {
        const port = portMatch[1]
        this.backendUrl = `http://127.0.0.1:${port}`
        console.log(`Backend URL: ${this.backendUrl}`)
        
        // Notify renderer of backend URL
        this.mainWindow?.webContents.send('backend:url', this.backendUrl)
      }
    })

    this.backendProcess.on('exit', (code, signal) => {
      console.log(`Backend exited with code ${code}, signal ${signal}`)
      this.backendProcess = null
      this.backendUrl = null
      this.mainWindow?.webContents.send('backend:url', null)
    })

    this.backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error)
      this.backendProcess = null
      this.backendUrl = null
      this.mainWindow?.webContents.send('backend:url', null)
    })
  }

  private findBackendBinary(): string | null {
    const candidates = [
      // Development mode with shell script
      process.env.JARVIS_BACKEND_BIN,
      path.join(process.cwd(), '../backend/start-backend.sh'),
      
      // Production mode
      path.join(process.resourcesPath, 'backend', 'jarvis-backend'),
      path.join(__dirname, '../../backend/jarvis-backend'),
      path.join(process.cwd(), 'dist', 'backend', 'jarvis-backend')
    ].filter(Boolean) as string[]

    for (const candidate of candidates) {
      if (this.isDevelopment && candidate.endsWith('.sh')) {
        // In development, check if shell script exists
        if (fs.existsSync(candidate)) {
          return candidate
        }
      } else if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate
      }
    }

    return null
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('window:hide', () => {
      this.mainWindow?.hide()
    })

    ipcMain.handle('backend:url', () => {
      return this.backendUrl
    })

    ipcMain.handle('app:version', () => {
      return app.getVersion()
    })

    ipcMain.handle('app:quit', () => {
      app.quit()
    })
  }

  private cleanup(): void {
    if (this.backendProcess && !this.backendProcess.killed) {
      console.log('Stopping backend process...')
      this.backendProcess.kill('SIGTERM')
      this.backendProcess = null
    }
    
    globalShortcut.unregisterAll()
  }

  private onWindowAllClosed(): void {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }

  private onActivate(): void {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow()
    }
  }
}

// Initialize the application
new JarvisApp()
