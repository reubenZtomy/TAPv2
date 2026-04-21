import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type FunStudiesScreenProps = {
  onNext: () => void
  onBack: () => void
}

const choices = [
  { key: 'all_work', label: 'All Work,\nNo Play', img: '/asq/fun5/IMG_1088.png' },
  { key: 'balanced', label: 'Balanced\nAdventurer', img: '/asq/fun5/IMG_1085.png' },
  { key: 'relaxed', label: 'Relaxed\nScholar', img: '/asq/fun5/IMG_1087.png' },
  { key: 'party', label: 'Party\nExpert', img: '/asq/fun5/IMG_1086.png' },
]

export function FunStudiesScreen({ onNext, onBack }: FunStudiesScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="screen fun-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title className="fun-title">How will you judge fun and studies on your journey?</Title>
        <div className="fun-grid">
          {choices.map((c) => (
            <button
              key={c.key}
              className={['fun-card', selected === c.key ? 'is-selected' : ''].join(' ')}
              onClick={() => setSelected(c.key)}
              aria-pressed={selected === c.key}
            >
              <img src={c.img} alt="" className="fun-card-img" draggable={false} />
              <span className="fun-card-label">
                {c.label.split('\n').map((line, i) => (
                  <span key={i} className="fun-card-line">
                    {line}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="screen-footer">
        <Button onClick={() => selected && onNext()} disabled={!selected} fullWidth aria-label="Confirm">
          Confirm
        </Button>
        <div className="fun-instruction">Select Image then Confirm</div>
      </div>
    </div>
  )
}
