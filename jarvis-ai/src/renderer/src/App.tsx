import React, { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceRecorder } from './components/VoiceRecorder'
import { StatusDisplay } from './components/StatusDisplay'
import { TranscriptDisplay } from './components/TranscriptDisplay'
import { AudioLevelMeter } from './components/AudioLevelMeter'
import { AppHeader } from './components/AppHeader'
import './styles/App.css'

interface TranscriptionResult {
  text: string
  language?: string
  confidence?: number
}

export default function App() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [transcript, setTranscript] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [backendUrl, setBackendUrl] = useState<string | null>(null)
  const [isBackendReady, setIsBackendReady] = useState<boolean>(false)
  
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize backend connection
  useEffect(() => {
    const initBackend = async () => {
      try {
        // Get initial backend URL
        const url = await window.jarvisAPI.getBackendUrl()
        setBackendUrl(url)
        setIsBackendReady(!!url)
        setStatus(url ? 'Ready - Press ⌘⇧Space to start' : 'Starting backend...')

        // Listen for backend URL changes
        const unsubscribe = window.jarvisAPI.onBackendUrl((url) => {
          setBackendUrl(url)
          setIsBackendReady(!!url)
          setStatus(url ? 'Ready - Press ⌘⇧Space to start' : 'Backend disconnected')
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to initialize backend:', error)
        setStatus('Failed to connect to backend')
        return () => {}
      }
    }

    const cleanup = initBackend()
    return () => {
      cleanup.then(unsubscribe => unsubscribe())
    }
  }, [])

  // Initialize voice recorder
  useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder({
      onAudioLevel: setAudioLevel,
      onStatusChange: setStatus,
      vadThreshold: 0.1,
      silenceDuration: 1500
    })

    return () => {
      voiceRecorderRef.current?.cleanup()
    }
  }, [])

  // Listen for window activation
  useEffect(() => {
    const unsubscribe = window.jarvisAPI.onWindowActivated(() => {
      if (isBackendReady && !isRecording) {
        startRecording()
      }
    })

    return unsubscribe
  }, [isBackendReady, isRecording])

  // Handle animation frame cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!isBackendReady || !backendUrl || !voiceRecorderRef.current) {
      setStatus('Backend not ready')
      return
    }

    try {
      setIsRecording(true)
      setTranscript('')
      setStatus('Listening...')

      const audioBlob = await voiceRecorderRef.current.recordUntilSilence()
      
      setStatus('Transcribing...')
      
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')

      const response = await fetch(`${backendUrl}/transcribe`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: TranscriptionResult = await response.json()
      
      setTranscript(result.text || 'No speech detected')
      setStatus('Complete')
      
      // Auto-hide after showing result
      setTimeout(() => {
        window.jarvisAPI.hideWindow()
        setStatus('Ready - Press ⌘⇧Space to start')
        setTranscript('')
      }, 5000)

    } catch (error) {
      console.error('Recording failed:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => {
        setStatus('Ready - Press ⌘⇧Space to start')
      }, 3000)
    } finally {
      setIsRecording(false)
      setAudioLevel(0)
    }
  }, [isBackendReady, backendUrl, isRecording])

  const handleManualStart = useCallback(() => {
    if (!isRecording) {
      startRecording()
    }
  }, [startRecording, isRecording])

  return (
    <div className="app">
      <div className="spotlight-panel">
        <AppHeader />
        
        <div className="content">
          <StatusDisplay 
            status={status}
            isRecording={isRecording}
            hasTranscript={!!transcript}
          />
          
          <TranscriptDisplay transcript={transcript} />
          
          <AudioLevelMeter 
            level={audioLevel}
            isRecording={isRecording}
          />
          
          <div className="controls">
            <button 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={handleManualStart}
              disabled={!isBackendReady || isRecording}
              title="Click to start recording or use ⌘⇧Space"
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
          </div>
          
          <div className="shortcut-hint">
            Press <kbd>⌘⇧Space</kbd> anywhere to activate
          </div>
        </div>
      </div>
    </div>
  )
}
