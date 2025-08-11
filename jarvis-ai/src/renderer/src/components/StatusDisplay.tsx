import React from 'react'

interface StatusDisplayProps {
  status: string
  isRecording: boolean
  hasTranscript: boolean
  className?: string
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
  status, 
  isRecording, 
  hasTranscript, 
  className = '' 
}) => {
  const getStatusClass = () => {
    if (isRecording) return 'recording'
    if (hasTranscript) return 'success'
    if (status.toLowerCase().includes('error')) return 'error'
    if (status.toLowerCase().includes('ready')) return 'ready'
    return 'default'
  }

  return (
    <div className={`status-display ${getStatusClass()} ${className}`}>
      <div className="status-text">
        {status}
      </div>
      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
        </div>
      )}
    </div>
  )
}
