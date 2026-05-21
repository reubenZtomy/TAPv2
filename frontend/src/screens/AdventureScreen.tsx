import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Title } from '../components/Typography'

type AdventureScreenProps = {
  onBack: () => void
  onConfirm: (choice: string | null) => void
  questionText?: string
  backText?: string
  confirmText?: string
  swipeTextStart?: string
  swipeTextEnd?: string
  swipeTextMiddle?: string
}

type Card = { key: string; label: string; img: string }

const cards: Card[] = [
  { key: 'surf', label: 'Surf the Waves', img: '/asq/adventure8/Surf the Waves.png' },
  { key: 'wildlife', label: 'Wildlife Watcher', img: '/asq/adventure8/Wildlife Watcher.png' },
  { key: 'hike', label: 'Hike the Outback', img: '/asq/adventure8/Hike the Outback.png' },
  { key: 'city', label: 'City Explorer', img: '/asq/adventure8/City Explorer.png' },
]

export function AdventureScreen({
  onBack,
  onConfirm,
  questionText = 'How will you level up during your Aussie quest downtime?',
  backText = 'Back',
  confirmText = 'Confirm',
  swipeTextStart = 'Swipe right for more options or press confirm',
  swipeTextEnd = 'Swipe left',
  swipeTextMiddle = 'Swipe left or right',
}: AdventureScreenProps) {
  const [selected, setSelected] = useState<string | null>(cards[0]?.key ?? null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null)

  const syncCurrentCard = useCallback(() => {
    const root = carouselRef.current
    if (!root) return
    const cardEls = Array.from(root.querySelectorAll<HTMLElement>('.adventure-card'))
    if (!cardEls.length) return
    const viewportCenter = root.scrollLeft + root.clientWidth / 2
    let nearestIdx = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    cardEls.forEach((card, idx) => {
      const center = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(center - viewportCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIdx = idx
      }
    })
    setCurrentIndex(nearestIdx)
    setSelected(cards[nearestIdx]?.key ?? null)
  }, [])

  const onCarouselScroll = useCallback(() => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    rafRef.current = window.requestAnimationFrame(syncCurrentCard)
  }, [syncCurrentCard])

  const scrollToNearestCard = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const root = carouselRef.current
    if (!root) return
    const cardEls = Array.from(root.querySelectorAll<HTMLElement>('.adventure-card'))
    if (!cardEls.length) return
    const viewportCenter = root.scrollLeft + root.clientWidth / 2
    let nearestCard: HTMLElement | undefined
    let nearestDistance = Number.POSITIVE_INFINITY
    cardEls.forEach((card) => {
      const center = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(center - viewportCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestCard = card
      }
    })
    if (!nearestCard) return
    const targetLeft = nearestCard.offsetLeft - (root.clientWidth - nearestCard.offsetWidth) / 2
    root.scrollTo({ left: Math.max(0, targetLeft), behavior })
  }, [])

  const onCarouselPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = carouselRef.current
    if (!root) return
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startScrollLeft: root.scrollLeft }
    root.setPointerCapture(e.pointerId)
    root.classList.add('is-dragging')
  }, [])

  const onCarouselPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = carouselRef.current
    const drag = dragRef.current
    if (!root || !drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    root.scrollLeft = drag.startScrollLeft - dx
  }, [])

  const endCarouselDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = carouselRef.current
    const drag = dragRef.current
    if (!root || !drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    root.classList.remove('is-dragging')
    if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId)
    scrollToNearestCard('smooth')
  }, [scrollToNearestCard])

  useEffect(() => {
    const root = carouselRef.current
    const firstCard = root?.querySelector<HTMLElement>('.adventure-card')
    if (root && firstCard) {
      window.requestAnimationFrame(() => {
        const targetLeft = firstCard.offsetLeft - (root.clientWidth - firstCard.offsetWidth) / 2
        root.scrollTo({ left: Math.max(0, targetLeft), behavior: 'auto' })
        syncCurrentCard()
      })
    }
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [syncCurrentCard])

  const swipeInstruction =
    currentIndex === 0
      ? swipeTextStart
      : currentIndex === cards.length - 1
        ? swipeTextEnd
        : swipeTextMiddle

  return (
    <div className="screen adventure-screen">
      <button className="passion-back-link" type="button" onClick={onBack} aria-label="Back">
        &lt;&lt;{backText}
      </button>
      <div className="screen-content">
        <Title className="adventure-title">{questionText}</Title>
        <div
          className="adventure-carousel"
          ref={carouselRef}
          onScroll={onCarouselScroll}
          onPointerDown={onCarouselPointerDown}
          onPointerMove={onCarouselPointerMove}
          onPointerUp={endCarouselDrag}
          onPointerCancel={endCarouselDrag}
        >
          <div className="adventure-spacer" aria-hidden="true" />
          {cards.map((c, idx) => (
            <div
              key={c.key}
              className={['adventure-card', selected === c.key ? 'is-selected' : '', currentIndex === idx ? 'is-active' : ''].join(' ')}
            >
              <img src={c.img} alt={c.label} className="adventure-card-img" draggable={false} />
            </div>
          ))}
          <div className="adventure-spacer" aria-hidden="true" />
        </div>
      </div>
      <div className="screen-footer adventure-footer">
        <Button onClick={() => onConfirm(selected)} disabled={!selected} fullWidth aria-label="Confirm">
          {confirmText}
        </Button>
        <div className="adventure-instruction" aria-live="polite">{swipeInstruction}</div>
      </div>
    </div>
  )
}
