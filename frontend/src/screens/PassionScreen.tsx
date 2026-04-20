import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type PassionItem = {
  key: string
  label: string
  img?: string
  isFullCard?: boolean
}

type PassionScreenProps = {
  onBack: () => void
  onNext: (selected: string | null) => void
}

// Cards per your list (icon placeholders used from local assets where available)
const defaultPassions: PassionItem[] = [
  { key: 'business', label: 'BUSINESS', img: '/asq/passion/Business.png', isFullCard: true },
  { key: 'engineering', label: 'ENGINEERING', img: '/asq/passion/Engineering.png', isFullCard: true },
  { key: 'health_science', label: 'HEALTH SCIENCE', img: '/asq/passion/Health Science.png', isFullCard: true },
  { key: 'art_humanities', label: 'ART &\nHUMANITIES', img: '/asq/passion/Art & Humanities.png', isFullCard: true },
  { key: 'environmental_studies', label: 'ENVIRONMENTAL\nSTUDIES', img: '/asq/passion/Environmental Studies.png', isFullCard: true },
  { key: 'it_cs', label: 'IT & COMPUTER\nSCIENCE', img: '/asq/passion/IT & Computer Science.png', isFullCard: true },
  { key: 'design_creative', label: 'DESIGN &\nCREATIVE ARTS', img: '/asq/passion/Design & Creative Arts.png', isFullCard: true },
  { key: 'law', label: 'LAW', img: '/asq/passion/Law.png', isFullCard: true },
  { key: 'nursing', label: 'NURSING', img: '/asq/passion/Nursing.png', isFullCard: true },
  { key: 'education', label: 'EDUCATION', img: '/asq/passion/Rectangle 72.png', isFullCard: true },
  { key: 'social_work', label: 'SOCIAL WORK', img: '/asq/passion/Social Work.png', isFullCard: true },
  { key: 'other', label: 'OTHER', img: '/asq/passion/Other.png', isFullCard: true },
]

export function PassionScreen({ onBack, onNext }: PassionScreenProps) {
  const [cards, setCards] = useState<PassionItem[]>(defaultPassions)
  const [selected, setSelected] = useState<string | null>(null)
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number; rotating: number }>({
    x: 0,
    y: 0,
    rotating: 0,
  })

  const topCard = cards[0]
  const restCount = cards.length - 1

  const threshold = 80
  const rotation = useMemo(() => Math.max(-15, Math.min(15, drag.x / 6)), [drag.x])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setDrag({ x: dx, y: dy, rotating: rotation })
  }, [rotation])

  const finishSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!topCard) return
      if (direction === 'right') {
        // Select current top card, snap back to center (do not remove)
        setSelected(topCard.key)
        setDrag({ x: 0, y: 0, rotating: 0 })
      } else {
        // Skip: remove top card and reset selection if it pointed to this key
        const removedKey = topCard.key
        const offX = -window.innerWidth
        setDrag({ x: offX, y: drag.y, rotating: -20 })
        setTimeout(() => {
          setCards((prev) => prev.slice(1))
          setDrag({ x: 0, y: 0, rotating: 0 })
          setSelected((prevSel) => (prevSel === removedKey ? null : prevSel))
        }, 160)
      }
    },
    [topCard, drag.y]
  )

  const onPointerUp = useCallback(() => {
    if (Math.abs(drag.x) > threshold) {
      finishSwipe(drag.x > 0 ? 'right' : 'left')
    } else {
      setDrag({ x: 0, y: 0, rotating: 0 })
    }
    dragRef.current = null
  }, [drag.x, finishSwipe])

  return (
    <div className="screen passion-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Back">
          Back
        </Button>
        <div className="passion-count" aria-live="polite">
          {topCard ? `${restCount + 1} cards` : '0 cards'}
        </div>
      </div>
      <div className="screen-content">
        <div className="passion-heading">Choose your path to your Aussie knowledge mastery!</div>
        <div className="stack">
          {cards
            .slice(0, 4)
            .map((item, idx) => {
              const isTop = idx === 0
              const style: React.CSSProperties = isTop
                ? {
                    transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
                    transition: dragRef.current ? 'none' : 'transform 150ms ease',
                  }
                : {
                    transform: `translateY(${idx * 8}px) scale(${1 - idx * 0.03})`,
                  }
              const isFull = !!item.isFullCard
              return (
                <div
                  key={item.key}
                  className={[
                    'stack-card',
                    isFull ? 'stack-card--image' : 'stack-card--framed',
                    isTop ? 'is-top' : '',
                    selected === item.key ? 'is-selected' : '',
                  ].join(' ')}
                  style={style}
                  onPointerDown={isTop ? onPointerDown : undefined}
                  onPointerMove={isTop ? onPointerMove : undefined}
                  onPointerUp={isTop ? onPointerUp : undefined}
                >
                  {isFull ? (
                    <img src={item.img} alt="" className="stack-card-full" draggable={false} />
                  ) : (
                    <div className="stack-card-frame">
                      <div className="stack-card-corner tl" />
                      <div className="stack-card-corner br" />
                      {/* Decorative numerals could be injected here if using framed mode */}
                      {item.img ? (
                        <img src={item.img} alt="" className="stack-card-img" draggable={false} />
                      ) : null}
                      <div className="stack-card-label" aria-label={item.label}>
                        {item.label.split('\n').map((line, i) => (
                          <span key={i} className="stack-card-label-line">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
            .reverse()}
        </div>
      </div>
      <div className="screen-footer passion-footer">
        <Button
          onClick={() => onNext(selected)}
          disabled={!selected}
          fullWidth
          aria-label="Confirm"
        >
          Confirm
        </Button>
        <button
          className="passion-reset"
          type="button"
          onClick={() => setSelected(null)}
          aria-label="I changed my mind"
        >
          I changed my mind!
        </button>
        <div className="passion-instruction" aria-hidden="true">
          Swipe to Select Card then Confirm
        </div>
      </div>
    </div>
  )
}
