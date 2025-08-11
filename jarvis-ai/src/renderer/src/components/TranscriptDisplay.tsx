import React, { useEffect, useState } from 'react'

interface TranscriptDisplayProps {
  transcript: string
  className?: string
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ 
  transcript, 
  className = '' 
}) => {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (transcript) {
      setIsAnimating(true)
      setDisplayText('')
      
      // Typewriter effect
      let index = 0
      const interval = setInterval(() => {
        if (index < transcript.length) {
          setDisplayText(transcript.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
          setIsAnimating(false)
        }
      }, 30)

      return () => clearInterval(interval)
    } else {
      setDisplayText('')
      setIsAnimating(false)
    }
  }, [transcript])

  if (!transcript && !displayText) {
    return null
  }

  return (
    <div className={`transcript-display ${isAnimating ? 'animating' : ''} ${className}`}>
      <div className="transcript-content">
        <div className="transcript-icon">💬</div>
        <div className="transcript-text">
          {displayText}
          {isAnimating && <span className="cursor">|</span>}
        </div>
      </div>
    </div>
  )
}
