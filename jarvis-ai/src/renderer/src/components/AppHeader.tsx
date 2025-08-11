import React from 'react'

interface AppHeaderProps {
  className?: string
}

export const AppHeader: React.FC<AppHeaderProps> = ({ className = '' }) => {
  return (
    <div className={`app-header ${className}`}>
      <div className="app-title">
        <span className="app-icon">🤖</span>
        <span className="app-name">Jarvis AI</span>
      </div>
      <div className="app-subtitle">
        Voice Assistant
      </div>
    </div>
  )
}
