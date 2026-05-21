import React, { useEffect, useState } from 'react'
import { Button } from '../components/Button'

type ResultsRevealScreenProps = {
  onContinue: () => void
  mainText?: string
  subtitleText?: string
  buttonText?: string
}

export function ResultsRevealScreen({
  onContinue,
  mainText = 'Gathering results...',
  subtitleText = 'I wonder where you will go?',
  buttonText = 'Click to find out!',
}: ResultsRevealScreenProps) {
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const subtitleTimer = window.setTimeout(() => setShowSubtitle(true), 1100)
    const buttonTimer = window.setTimeout(() => setShowButton(true), 2200)
    return () => {
      window.clearTimeout(subtitleTimer)
      window.clearTimeout(buttonTimer)
    }
  }, [])

  return (
    <div className="screen results-screen">
      <div className="screen-content results-content">
        <div className="results-main">{mainText}</div>
        {showSubtitle && <div className="results-sub">{subtitleText}</div>}
      </div>
      <div className="screen-footer results-footer">
        {showButton && (
          <Button onClick={onContinue} fullWidth aria-label="Click to find out">
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  )
}
