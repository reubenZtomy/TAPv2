import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type TreasureScreenProps = {
  onBack: () => void
  onConfirm: (budgetKey: string) => void
}

const options = [
  { key: 'under_25k', label: 'Small Fortune - Under AUD 25k' },
  { key: '25_35k', label: 'Well Stocked - AUD 25k - 35k' },
  { key: '35_45k', label: 'Treasure Trove - AUD 35k - 45k' },
  { key: 'over_45k', label: 'Endless Gold - Over AUD 45k' },
]

export function TreasureScreen({ onBack, onConfirm }: TreasureScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const bagSrc = useMemo(() => {
    // Use bag-only variants from Quiz-4 (Treasure Bag-*.png)
    switch (selected) {
      case 'under_25k':
        return '/asq/treasure4/Treasure Bag-1.png'
      case '25_35k':
        return '/asq/treasure4/Treasure Bag-2.png'
      case '35_45k':
        return '/asq/treasure4/Treasure Bag-3.png'
      case 'over_45k':
        return '/asq/treasure4/Treasure Bag-4.png'
      default:
        return '/asq/treasure4/Treasure Bag.png'
    }
  }, [selected])

  return (
    <div className="screen treasure-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title className="treasure-title">What’s your treasure chest looking for this Aussie quest?</Title>
        <div className="treasure-hero treasure-hero--small" aria-hidden="true">
          {bagSrc ? (
            <img key={bagSrc} src={bagSrc} alt="" className="treasure-hero-variant" draggable={false} />
          ) : null}
        </div>
        <div className="treasure-options">
          {options.map((opt) => (
            <button
              key={opt.key}
              className={['treasure-option', selected === opt.key ? 'is-selected' : ''].join(' ')}
              onClick={() => setSelected(opt.key)}
              aria-pressed={selected === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="screen-footer treasure-footer">
        <Button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          fullWidth
          aria-label="Confirm"
        >
          Confirm
        </Button>
        <div className="treasure-instruction">Select Answer then Confirm</div>
      </div>
    </div>
  )
}
