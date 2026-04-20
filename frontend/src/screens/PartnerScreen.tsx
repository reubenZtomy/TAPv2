import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type PartnerScreenProps = {
  onBack: () => void
  onFinish: () => void
}

const partners = [
  { key: 'koala', label: 'Koala', img: '/asq/PARTNER_-_KOALA.png' },
  { key: 'kangaroo', label: 'Kangaroo', img: '/asq/PARTNER_-_KANGAROO.png' },
  { key: 'wombat', label: 'Wombat', img: '/asq/PARTNER_-_WOMBAT.png' },
  { key: 'crocodile', label: 'Crocodile', img: '/asq/PARTNER_-_CROCODILE.png' },
]

export function PartnerScreen({ onBack, onFinish }: PartnerScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="screen partner-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title>Select your study partner</Title>
        <div className="partner-grid">
          {partners.map((p) => (
            <button
              key={p.key}
              className={['partner-card', selected === p.key ? 'is-selected' : ''].join(' ')}
              onClick={() => setSelected(p.key)}
              aria-pressed={selected === p.key}
              aria-label={`Choose ${p.label}`}
            >
              <img src={p.img} alt="" className="partner-img" draggable={false} />
              <span className="partner-label">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="screen-footer">
        <Button onClick={onFinish} disabled={!selected} fullWidth aria-label="Finish">
          Finish
        </Button>
      </div>
    </div>
  )
}
