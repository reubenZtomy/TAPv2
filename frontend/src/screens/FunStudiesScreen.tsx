import React from 'react'
import { Button } from '../components/Button'
import { Title, Body } from '../components/Typography'

type FunStudiesScreenProps = {
  onNext: () => void
  onBack: () => void
}

export function FunStudiesScreen({ onNext, onBack }: FunStudiesScreenProps) {
  return (
    <div className="screen fun-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title>Fun and Studies</Title>
        <Body align="center">
          Balance your fun time and studies to discover your learning vibe.
        </Body>
        <div className="card-grid">
          <div className="card">
            <img src="/asq/Adventurous_Scholar.png" alt="" className="card-img" draggable={false} />
            <Body align="center">Adventurous Scholar</Body>
          </div>
          <div className="card">
            <img src="/asq/Dynamic_Explorer.png" alt="" className="card-img" draggable={false} />
            <Body align="center">Dynamic Explorer</Body>
          </div>
        </div>
      </div>
      <div className="screen-footer">
        <Button onClick={onNext} fullWidth aria-label="Next">
          Next
        </Button>
      </div>
    </div>
  )
}
