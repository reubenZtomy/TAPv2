import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type AdventureScreenProps = {
  onBack: () => void
  onConfirm: (choice: string | null) => void
}

type Card = { key: string; label: string; img: string }

const cards: Card[] = [
  { key: 'surf', label: 'Surf the Waves', img: '/asq/adventure8/Surf the Waves.png' },
  { key: 'wildlife', label: 'Wildlife Watcher', img: '/asq/adventure8/Wildlife Watcher.png' },
  { key: 'hike', label: 'Hike the Outback', img: '/asq/adventure8/Hike the Outback.png' },
  { key: 'city', label: 'City Explorer', img: '/asq/adventure8/City Explorer.png' },
]

export function AdventureScreen({ onBack, onConfirm }: AdventureScreenProps) {
  const [stack, setStack] = useState<Card[]>(cards)
  const [selected, setSelected] = useState<string | null>(null)
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const top = stack[0]
  const threshold = 60
  const rotation = useMemo(() => Math.max(-15, Math.min(15, drag.x / 6)), [drag.x])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY }
  }, [])
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setDrag({ x: dx, y: dy })
  }, [])
  const onPointerUp = useCallback(() => {
    // Decide action based on horizontal delta
    if (!top) return
    if (drag.x > threshold) {
      // Right swipe: select but KEEP the card (snap back)
      setSelected(top.key)
      setDrag({ x: 0, y: 0 })
    } else if (drag.x < -threshold) {
      // Left swipe: skip and REMOVE top card with quick off-screen animation
      setDrag({ x: -window.innerWidth, y: drag.y })
      setTimeout(() => {
        setStack((prev) => prev.slice(1))
        setDrag({ x: 0, y: 0 })
      }, 160)
    } else {
      // Not enough movement → snap back
      setDrag({ x: 0, y: 0 })
    }
    dragRef.current = null
  }, [drag.x, drag.y, top])

  const onPointerCancel = useCallback(() => {
    setDrag({ x: 0, y: 0 })
    dragRef.current = null
  }, [])

  // Touch fallback (for browsers that don't fully support Pointer Events)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    dragRef.current = { startX: t.clientX, startY: t.clientY }
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - dragRef.current.startX
    const dy = t.clientY - dragRef.current.startY
    setDrag({ x: dx, y: dy })
  }, [])
  const onTouchEnd = useCallback(() => {
    // Reuse pointer-up decision logic
    if (!top) return
    if (drag.x > threshold) {
      setSelected(top.key)
      setDrag({ x: 0, y: 0 })
    } else if (drag.x < -threshold) {
      setDrag({ x: -window.innerWidth, y: drag.y })
      setTimeout(() => {
        setStack((prev) => prev.slice(1))
        setDrag({ x: 0, y: 0 })
      }, 160)
    } else {
      setDrag({ x: 0, y: 0 })
    }
    dragRef.current = null
  }, [drag.x, drag.y, top])

  return (
    <div className="screen adventure-screen">
      <div className="screen-header">
        <Button variant="secondary" onClick={onBack} aria-label="Back">
          Back
        </Button>
      </div>
      <div className="screen-content">
        <Title className="adventure-title">How will you level up during your Aussie quest downtime?</Title>
        <div className="adventure-stack">
          {stack.slice(0, 3).map((c, idx) => {
            const isTop = idx === 0
            const style: React.CSSProperties = isTop
              ? {
                  transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
                  transition: dragRef.current ? 'none' : 'transform 150ms ease',
                  zIndex: 3,
                }
              : {
                  transform: `translateY(${idx * 10}px) scale(${1 - idx * 0.03})`,
                  zIndex: 1,
                }
            return (
              <div
                key={c.key}
                className={['adventure-card', isTop ? 'is-top' : ''].join(' ')}
                style={style}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerCancel : undefined}
                onTouchStart={isTop ? onTouchStart : undefined}
                onTouchMove={isTop ? onTouchMove : undefined}
                onTouchEnd={isTop ? onTouchEnd : undefined}
                onClick={isTop ? () => setSelected(c.key) : undefined}
              >
                <img src={c.img} alt={c.label} className="adventure-card-img" draggable={false} />
              </div>
            )
          })}
        </div>
        <div className="adventure-caption">{top ? top.label : ''}</div>
      </div>
      <div className="screen-footer adventure-footer">
        <Button onClick={() => onConfirm(selected)} disabled={!selected} fullWidth aria-label="Confirm">
          Confirm
        </Button>
        <div className="adventure-instruction">Swipe right to select, left to skip</div>
      </div>
    </div>
  )
}
