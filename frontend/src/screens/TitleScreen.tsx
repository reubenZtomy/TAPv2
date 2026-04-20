import React from 'react'
import { Button } from '../components/Button'
import { Title, Subtitle } from '../components/Typography'

type TitleScreenProps = {
  onStart: () => void
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="screen title-screen">
      <div className="title-illustration">
        <img
          src="/asq/ASQ Title - Final Ver.png"
          alt=""
          className="title-illustration-img"
          draggable={false}
        />
      </div>
      <div className="title-content">
        <h1 className="asq-title">AUSTRALIA STUDY QUIZ</h1>
        <p className="asq-subtitle">Where do you belong?</p>
      </div>
      <div className="title-actions">
        <button className="asq-cta" onClick={onStart} aria-label="Tap to Start" data-testid="cta-start">
          Tap to Start
        </button>
      </div>
    </div>
  )
}
