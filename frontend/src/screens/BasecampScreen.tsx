import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type BasecampScreenProps = {
  onBack: () => void
  onConfirm: (choice: string) => void
  questionText?: string
  optionLabels?: Record<string, string>
  backText?: string
  confirmText?: string
  instructionText?: string
}

const options = [
  { key: 'under_25k', label: 'Small Fortune - Under AUD 25k' },
  { key: '25_35k', label: 'Well Stocked - AUD 25k - 35k' },
  { key: '35_45k', label: 'Treasure Trove - AUD 35k - 45k' },
  { key: 'over_45k', label: 'Endless Gold - Over AUD 45k' },
]

export function BasecampScreen({
  onBack,
  onConfirm,
  questionText = 'Where will you set up your basecamp for learning?',
  optionLabels = {},
  backText = 'Back',
  confirmText = 'Confirm',
  instructionText = 'Select Answer then Confirm',
}: BasecampScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const localizedOptions = options.map((option) => ({
    ...option,
    label: optionLabels[option.key] ?? option.label,
  }))
  const heroSrc = useMemo(() => {
    switch (selected) {
      case 'under_25k':
        return '/asq/quiz6/IMG_1096.png'
      case '25_35k':
        return '/asq/quiz6/IMG_1097.png'
      case '35_45k':
        return '/asq/quiz6/IMG_1098.png'
      case 'over_45k':
        return '/asq/quiz6/IMG_1099.png'
      default:
        return '/asq/quiz6/IMG_1090.png'
    }
  }, [selected])

  return (
    <div className="screen basecamp-screen">
      <button className="passion-back-link" type="button" onClick={onBack} aria-label="Back">
        &lt;&lt;{backText}
      </button>
      <div className="screen-content">
        <Title className="basecamp-title">{questionText}</Title>
        <div className="basecamp-hero" aria-hidden="true">
          <img src={heroSrc} alt="" draggable={false} />
        </div>
        <div className="basecamp-options">
          {localizedOptions.map((opt) => (
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
          {confirmText}
        </Button>
        <div className="basecamp-instruction">{instructionText}</div>
      </div>
    </div>
  )
}
