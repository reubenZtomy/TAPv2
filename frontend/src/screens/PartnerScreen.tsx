import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type PartnerScreenProps = {
  onBack: () => void
  onFinish: () => void
  questionText?: string
  optionLabels?: Record<string, string>
  backText?: string
  confirmText?: string
  instructionText?: string
  emptySelectionText?: string
}

const partners = [
  { key: 'koala', label: 'Koala Chill', thumb: '/asq/PARTNER_-_KOALA.png', img: '/asq/PARTNER_-_KOALA.png' },
  { key: 'kangaroo', label: 'Kangaroo Jumper', thumb: '/asq/PARTNER_-_KANGAROO.png', img: '/asq/PARTNER_-_KANGAROO.png' },
  { key: 'wombat', label: 'Wombat Warrior', thumb: '/asq/PARTNER_-_WOMBAT.png', img: '/asq/PARTNER_-_WOMBAT.png' },
  { key: 'crocodile', label: 'Crocodile Survivor', thumb: '/asq/PARTNER_-_CROCODILE.png', img: '/asq/PARTNER_-_CROCODILE.png' },
]

export function PartnerScreen({
  onBack,
  onFinish,
  questionText = 'Who’s your wild partner on this epic journey through Australia?',
  optionLabels = {},
  backText = 'Back',
  confirmText = 'Confirm',
  instructionText = 'Select Character then Confirm',
  emptySelectionText = 'Pick a Character!',
}: PartnerScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const localizedPartners = useMemo(
    () =>
      partners.map((partner) => ({
        ...partner,
        label: optionLabels[partner.key] ?? partner.label,
      })),
    [optionLabels]
  )
  const current = useMemo(() => localizedPartners.find((p) => p.key === selected) || null, [localizedPartners, selected])
  return (
    <div className="screen partner-screen">
      <button className="passion-back-link" type="button" onClick={onBack} aria-label="Back">
        &lt;&lt;{backText}
      </button>
      <div className="screen-content">
        <p className="partner-heading">{questionText}</p>
        <div className="partner-choices">
          {localizedPartners.map((p) => (
            <button
              key={p.key}
              className={['partner-avatar', selected === p.key ? 'is-selected' : ''].join(' ')}
              onClick={() => setSelected(p.key)}
              aria-pressed={selected === p.key}
              aria-label={`Choose ${p.label}`}
            >
              <img src={p.thumb} alt="" draggable={false} />
            </button>
          ))}
        </div>
        <div className="partner-hero">
          {current ? <img src={current.img} alt="" draggable={false} /> : null}
        </div>
        <div className="partner-title">{current ? current.label : emptySelectionText}</div>
      </div>
      <div className="screen-footer partner-footer">
        <Button onClick={onFinish} disabled={!selected} fullWidth aria-label="Confirm">
          {confirmText}
        </Button>
        <div className="partner-instruction">{instructionText}</div>
      </div>
    </div>
  )
}
