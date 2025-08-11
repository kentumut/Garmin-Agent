export interface VoiceRecorderOptions {
  onAudioLevel?: (level: number) => void
  onStatusChange?: (status: string) => void
  vadThreshold?: number
  silenceDuration?: number
  maxRecordingTime?: number
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private stream: MediaStream | null = null
  
  private isRecording = false
  private audioChunks: Blob[] = []
  private silenceStart: number | null = null
  private animationFrame: number | null = null
  
  private options: Required<VoiceRecorderOptions>

  constructor(options: VoiceRecorderOptions = {}) {
    this.options = {
      onAudioLevel: options.onAudioLevel || (() => {}),
      onStatusChange: options.onStatusChange || (() => {}),
      vadThreshold: options.vadThreshold || 0.1,
      silenceDuration: options.silenceDuration || 1500,
      maxRecordingTime: options.maxRecordingTime || 30000
    }
  }

  async recordUntilSilence(): Promise<Blob> {
    try {
      await this.startRecording()
      return await this.waitForSilenceOrTimeout()
    } catch (error) {
      this.cleanup()
      throw error
    }
  }

  private async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording')
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      // Set up audio analysis
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      
      this.microphone = this.audioContext.createMediaStreamSource(this.stream)
      this.microphone.connect(this.analyser)

      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // Start recording
      this.mediaRecorder.start(100) // Collect data every 100ms
      this.isRecording = true
      this.silenceStart = null
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring()
      
      this.options.onStatusChange('Recording started')
      
    } catch (error) {
      this.cleanup()
      throw new Error(`Failed to start recording: ${error}`)
    }
  }

  private startAudioLevelMonitoring(): void {
    const updateAudioLevel = () => {
      if (!this.isRecording || !this.analyser || !this.dataArray) {
        return
      }

      this.analyser.getByteFrequencyData(this.dataArray)
      
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i] * this.dataArray[i]
      }
      const rms = Math.sqrt(sum / this.dataArray.length)
      const level = rms / 255 // Normalize to 0-1

      this.options.onAudioLevel(level)

      // Voice Activity Detection
      this.detectVoiceActivity(level)

      this.animationFrame = requestAnimationFrame(updateAudioLevel)
    }

    updateAudioLevel()
  }

  private detectVoiceActivity(level: number): void {
    const now = Date.now()
    
    if (level > this.options.vadThreshold) {
      // Voice detected, reset silence timer
      this.silenceStart = null
    } else {
      // Silence detected
      if (this.silenceStart === null) {
        this.silenceStart = now
      }
    }
  }

  private async waitForSilenceOrTimeout(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkForEnd = () => {
        if (!this.isRecording) {
          reject(new Error('Recording stopped unexpectedly'))
          return
        }

        const now = Date.now()
        const recordingDuration = now - startTime
        
        // Check for maximum recording time
        if (recordingDuration > this.options.maxRecordingTime) {
          this.options.onStatusChange('Max recording time reached')
          this.stopRecording().then(resolve).catch(reject)
          return
        }

        // Check for silence timeout
        if (this.silenceStart && (now - this.silenceStart) > this.options.silenceDuration) {
          this.options.onStatusChange('Silence detected')
          this.stopRecording().then(resolve).catch(reject)
          return
        }

        // Continue checking
        setTimeout(checkForEnd, 100)
      }

      checkForEnd()
    })
  }

  private async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (error) => {
        this.cleanup()
        reject(error)
      }

      this.isRecording = false
      this.mediaRecorder.stop()
    })
  }

  cleanup(): void {
    this.isRecording = false
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.mediaRecorder = null
    this.analyser = null
    this.microphone = null
    this.dataArray = null
    this.audioChunks = []
    this.silenceStart = null
    
    this.options.onAudioLevel(0)
  }
}
