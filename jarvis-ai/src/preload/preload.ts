import { contextBridge, ipcRenderer } from 'electron'

// Define the API interface
export interface JarvisAPI {
  // Window management
  hideWindow: () => Promise<void>
  onWindowActivated: (callback: () => void) => () => void
  
  // Backend communication
  getBackendUrl: () => Promise<string | null>
  onBackendUrl: (callback: (url: string | null) => void) => () => void
  
  // App information
  getAppVersion: () => Promise<string>
  quitApp: () => Promise<void>
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: JarvisAPI = {
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  
  onWindowActivated: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('window:activated', listener)
    return () => ipcRenderer.removeListener('window:activated', listener)
  },
  
  getBackendUrl: () => ipcRenderer.invoke('backend:url'),
  
  onBackendUrl: (callback: (url: string | null) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, url: string | null) => {
      callback(url)
    }
    ipcRenderer.on('backend:url', listener)
    return () => ipcRenderer.removeListener('backend:url', listener)
  },
  
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  quitApp: () => ipcRenderer.invoke('app:quit')
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('jarvisAPI', api)

// Type declaration for the global window object
declare global {
  interface Window {
    jarvisAPI: JarvisAPI
  }
}
