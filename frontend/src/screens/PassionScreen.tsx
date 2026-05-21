import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'

type PassionItem = {
  key: string
  label: string
  img?: string
  isFullCard?: boolean
}

type PassionScreenProps = {
  onBack: () => void
  onNext: (selected: string | null) => void
  questionText?: string
  backText?: string
  confirmText?: string
  resetText?: string
  swipeTextStart?: string
  swipeTextEnd?: string
  swipeTextMiddle?: string
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
  { key: 'education', label: 'EDUCATION', img: '/asq/passion/Education.png', isFullCard: true },
  { key: 'social_work', label: 'SOCIAL WORK', img: '/asq/passion/Social Work.png', isFullCard: true },
  { key: 'other', label: 'OTHER', img: '/asq/passion/Other.png', isFullCard: true },
]

export function PassionScreen({
  onBack,
  onNext,
  questionText = 'Choose your path to your Aussie knowledge mastery!',
  backText = 'Back',
  confirmText = 'Confirm',
  resetText = 'I changed my mind!',
  swipeTextStart = 'Swipe to the right for more options',
  swipeTextEnd = 'Swipe to the right',
  swipeTextMiddle = 'Swipe left or right',
}: PassionScreenProps) {
  const [selected, setSelected] = useState<string | null>(defaultPassions[0]?.key ?? null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null)

  const syncCurrentCard = useCallback(() => {
    const root = carouselRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.stack-card'))
    if (!cards.length) return
    const viewportCenter = root.scrollLeft + root.clientWidth / 2
    let nearestIdx = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(cardCenter - viewportCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIdx = idx
      }
    })
    setCurrentIndex(nearestIdx)
    setSelected(defaultPassions[nearestIdx]?.key ?? null)
  }, [])

  const scrollToNearestCard = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const root = carouselRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.stack-card'))
    if (!cards.length) return
    const viewportCenter = root.scrollLeft + root.clientWidth / 2
    let nearestCard: HTMLElement | undefined
    let nearestDistance = Number.POSITIVE_INFINITY
    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(cardCenter - viewportCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestCard = card
      }
    })
    if (nearestCard === undefined) return
    const targetLeft = nearestCard.offsetLeft - (root.clientWidth - nearestCard.offsetWidth) / 2
    root.scrollTo({ left: Math.max(0, targetLeft), behavior })
  }, [])

  const onCarouselScroll = useCallback(() => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    rafRef.current = window.requestAnimationFrame(syncCurrentCard)
  }, [syncCurrentCard])

  const onCarouselPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = carouselRef.current
    if (!root) return
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: root.scrollLeft,
    }
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
    const firstCard = root?.querySelector<HTMLElement>('.stack-card')
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
      : currentIndex === defaultPassions.length - 1
        ? swipeTextEnd
        : swipeTextMiddle

  return (
    <div className="screen passion-screen">
      <button className="passion-back-link" type="button" onClick={onBack} aria-label="Back">
        &lt;&lt;{backText}
      </button>
      <div className="screen-content">
        <div className="passion-heading">{questionText}</div>
        <div
          className="stack-carousel"
          ref={carouselRef}
          onScroll={onCarouselScroll}
          onPointerDown={onCarouselPointerDown}
          onPointerMove={onCarouselPointerMove}
          onPointerUp={endCarouselDrag}
          onPointerCancel={endCarouselDrag}
        >
          <div className="stack-spacer" aria-hidden="true" />
          {defaultPassions.map((item) => (
            <div
              key={item.key}
              className={['stack-card', item.isFullCard ? 'stack-card--image' : 'stack-card--framed', selected === item.key ? 'is-selected' : ''].join(' ')}
            >
              {item.isFullCard ? (
                <img src={item.img} alt="" className="stack-card-full" draggable={false} />
              ) : (
                <div className="stack-card-frame">
                  <div className="stack-card-corner tl" />
                  <div className="stack-card-corner br" />
                  {item.img ? <img src={item.img} alt="" className="stack-card-img" draggable={false} /> : null}
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
          ))}
          <div className="stack-spacer" aria-hidden="true" />
        </div>
        <div className="passion-instruction" aria-live="polite">
          {swipeInstruction}
        </div>
      </div>
      <div className="screen-footer passion-footer">
        <Button
          onClick={() => onNext(selected)}
          disabled={!selected}
          fullWidth
          aria-label="Confirm"
        >
          {confirmText}
        </Button>
        <button
          className="passion-reset"
          type="button"
          onClick={() => setSelected(null)}
          aria-label="I changed my mind"
        >
          {resetText}
        </button>
      </div>
    </div>
  )
}
