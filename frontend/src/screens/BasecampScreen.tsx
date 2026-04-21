import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type BasecampScreenProps = {
  onBack: () => void
  onConfirm: (choice: string) => void
}

const options = [
  { key: 'big_creative', label: 'Big and Creative' },
  { key: 'fast_exciting', label: 'Fast-paced and Exciting' },
  { key: 'quiet_relaxed', label: 'Quiet and Relaxed' },
  { key: 'mix_city_nature', label: 'A mix of City and Nature' },
]

export function BasecampScreen({ onBack, onConfirm }: BasecampScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const heroSrc = useMemo(() => {
    switch (selected) {
      case 'big_creative':
        return '/asq/quiz6/IMG_1090.png'
      case 'fast_exciting':
        return '/asq/quiz6/IMG_1097.png'
      case 'quiet_relaxed':
        return '/asq/quiz6/IMG_1098.png'
      case 'mix_city_nature':
        return '/asq/quiz6/IMG_1099.png'
      default:
        return '/asq/quiz6/IMG_1099.png'
    }
  }, [selected])
  return (
    <div className="screen basecamp-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title className="basecamp-title">Where will you set up your basecamp for learning?</Title>
        <div className="basecamp-hero" aria-hidden="true">
          <img src={heroSrc} alt="" draggable={false} />
        </div>
        <div className="basecamp-options">
          {options.map((opt) => (
            <button
              key={opt.key}
              className={['basecamp-option', selected === opt.key ? 'is-selected' : ''].join(' ')}
              onClick={() => setSelected(opt.key)}
              aria-pressed={selected === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="screen-footer basecamp-footer">
        <Button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          fullWidth
          aria-label="Confirm"
        >
          Confirm
        </Button>
        <div className="basecamp-instruction">Select Answer then Confirm</div>
      </div>
    </div>
  )
}
