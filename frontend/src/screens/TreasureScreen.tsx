import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type TreasureScreenProps = {
  onBack: () => void
  onConfirm: (budgetKey: string) => void
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

type BagType = 'bag' | 'bag2'
type BagSlots = {
  topLeft: BagType | null
  top: BagType | null
  topRight: BagType | null
  bottom: BagType | null
}

export function TreasureScreen({
  onBack,
  onConfirm,
  questionText = 'What’s your treasure chest looking for this Aussie quest?',
  optionLabels = {},
  backText = 'Back',
  confirmText = 'Confirm',
  instructionText = 'Select Answer then Confirm',
}: TreasureScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const localizedOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        label: optionLabels[option.key] ?? option.label,
      })),
    [optionLabels]
  )

  const bagSlots = useMemo<BagSlots | null>(() => {
    switch (selected) {
      case 'under_25k':
        return { bottom: 'bag', topLeft: 'bag2', top: 'bag2', topRight: 'bag2' }
      case '25_35k':
        return { bottom: 'bag', topLeft: 'bag2', top: 'bag2', topRight: 'bag' }
      case '35_45k':
        return { bottom: 'bag', topLeft: 'bag', top: 'bag2', topRight: 'bag' }
      case 'over_45k':
        return { bottom: 'bag', topLeft: 'bag', top: 'bag', topRight: 'bag' }
      default:
        return null
    }
  }, [selected])

  const getBagSrc = (bagType: BagType) =>
    bagType === 'bag' ? '/asq/treasure4/Treasure Bag.png' : '/asq/treasure4/Treasure Bag-2.png'
  return (
    <div className="screen treasure-screen">
      <button className="passion-back-link" type="button" onClick={onBack} aria-label="Back">
        &lt;&lt;{backText}
      </button>
      <div className="screen-content">
        <Title className="treasure-title">{questionText}</Title>
        <div className="treasure-hero treasure-hero--small" aria-hidden="true" key={selected ?? 'default'}>
          {!bagSlots ? (
            <img src="/asq/treasure4/Group 52.png" alt="" className="treasure-hero-default" draggable={false} />
          ) : (
            <div className="treasure-bag-scene">
              {bagSlots.topLeft ? (
                <img src={getBagSrc(bagSlots.topLeft)} alt="" className="treasure-slot treasure-slot-top-left" draggable={false} />
              ) : null}
              {bagSlots.top ? (
                <img src={getBagSrc(bagSlots.top)} alt="" className="treasure-slot treasure-slot-top" draggable={false} />
              ) : null}
              {bagSlots.topRight ? (
                <img src={getBagSrc(bagSlots.topRight)} alt="" className="treasure-slot treasure-slot-top-right" draggable={false} />
              ) : null}
              {bagSlots.bottom ? (
                <img src={getBagSrc(bagSlots.bottom)} alt="" className="treasure-slot treasure-slot-bottom" draggable={false} />
              ) : null}
            </div>
          )}
        </div>
        <div className="treasure-options">
          {localizedOptions.map((opt) => (
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
          {confirmText}
        </Button>
        <div className="treasure-instruction">{instructionText}</div>
      </div>
    </div>
  )
}
