import React from 'react'

interface AudioLevelMeterProps {
  level: number
  isRecording: boolean
  className?: string
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({ 
  level, 
  isRecording, 
  className = '' 
}) => {
  if (!isRecording && level === 0) {
    return null
  }

  const normalizedLevel = Math.min(Math.max(level * 100, 0), 100)
  const segments = 20
  const activeSegments = Math.round((normalizedLevel / 100) * segments)

  return (
    <div className={`audio-level-meter ${isRecording ? 'recording' : ''} ${className}`}>
      <div className="meter-label">Audio Level</div>
      <div className="meter-container">
        <div className="meter-bar">
          {Array.from({ length: segments }, (_, i) => {
            const isActive = i < activeSegments
            const intensity = isActive ? Math.min(1, (i + 1) / segments) : 0
            
            return (
              <div
                key={i}
                className={`meter-segment ${isActive ? 'active' : ''}`}
                style={{
                  opacity: isActive ? 0.3 + (intensity * 0.7) : 0.1,
                  backgroundColor: isActive 
                    ? `hsl(${120 - (intensity * 60)}, 70%, 50%)` 
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              />
            )
          })}
        </div>
        <div className="meter-percentage">
          {Math.round(normalizedLevel)}%
        </div>
      </div>
    </div>
  )
}
