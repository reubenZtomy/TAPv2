import React, { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type PartnerScreenProps = {
  onBack: () => void
  onFinish: () => void
}

const partners = [
  { key: 'koala', label: 'Koala Chill', thumb: '/asq/PARTNER_-_KOALA.png', img: '/asq/PARTNER_-_KOALA.png' },
  { key: 'kangaroo', label: 'Kangaroo Jumper', thumb: '/asq/PARTNER_-_KANGAROO.png', img: '/asq/PARTNER_-_KANGAROO.png' },
  { key: 'wombat', label: 'Wombat Warrior', thumb: '/asq/PARTNER_-_WOMBAT.png', img: '/asq/PARTNER_-_WOMBAT.png' },
  { key: 'crocodile', label: 'Crocodile Survivor', thumb: '/asq/PARTNER_-_CROCODILE.png', img: '/asq/PARTNER_-_CROCODILE.png' },
]

export function PartnerScreen({ onBack, onFinish }: PartnerScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const current = useMemo(() => partners.find((p) => p.key === selected) || null, [selected])
  return (
    <div className="screen partner-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Go back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <p className="partner-heading">Who’s your wild partner on this epic journey through Australia?</p>
        <div className="partner-choices">
          {partners.map((p) => (
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
        <div className="partner-title">{current ? current.label : 'Pick a Character!'}</div>
      </div>
      <div className="screen-footer partner-footer">
        <Button onClick={onFinish} disabled={!selected} fullWidth aria-label="Confirm">
          Confirm
        </Button>
        <div className="partner-instruction">Select Character then Confirm</div>
      </div>
    </div>
  )
}
