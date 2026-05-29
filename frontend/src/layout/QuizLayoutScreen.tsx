import React, { useEffect, useMemo, useState } from 'react'
import {
  CANVAS_H,
  CANVAS_W,
  getLayoutElements,
  getScreenBackgroundSettings,
  supportsActions,
  type ElementAction,
  type LayoutElement,
  type ScreenBackgroundSettings,
} from '../admin/layoutTypes'
import { QuizLayoutFontRoot } from './QuizLayoutFontRoot'
import { layoutElementStyle } from './layoutElementStyle'
import { RuntimeLayoutElement } from './RuntimeLayoutElement'
import { ScreenBackgroundLayer } from './ScreenBackgroundLayer'
import type { QuizCustomFont } from '../utils/quizFont'

export type QuizLayoutScreenProps = {
  elements: LayoutElement[] | Record<string, unknown> | undefined
  screenBackground?: ScreenBackgroundSettings
  customFont?: QuizCustomFont | null
  base?: React.ReactNode
  onElementAction?: (action: ElementAction, element: LayoutElement) => void
}

export function QuizLayoutScreen({
  elements,
  screenBackground,
  customFont,
  base,
  onElementAction,
}: QuizLayoutScreenProps) {
  const normalized = Array.isArray(elements) ? elements : getLayoutElements(elements)
  const layoutRecord = elements && !Array.isArray(elements) ? elements : undefined
  const bgSettings = screenBackground ?? getScreenBackgroundSettings(layoutRecord)
  const [selectedOptionElementId, setSelectedOptionElementId] = useState<string | null>(null)
  const resolveOptionKey = (el: LayoutElement): string =>
    (el.optionKey || el.action?.recordOption || `option_${el.id.replace(/[^a-zA-Z0-9_]/g, '_')}`).trim()

  const elementSignature = useMemo(
    () => normalized.map((el) => `${el.id}:${el.optionKey || ''}:${el.isOption ? '1' : '0'}`).join('|'),
    [normalized]
  )

  useEffect(() => {
    setSelectedOptionElementId(null)
  }, [elementSignature])

  const handleClick = (el: LayoutElement) => {
    if (el.isOption) {
      const key = resolveOptionKey(el)
      if (key) setSelectedOptionElementId(el.id)
    }
    if (!supportsActions(el.type) || !el.action || el.action.type === 'none') return
    onElementAction?.(el.action, el)
  }

  return (
    <QuizLayoutFontRoot customFont={customFont} className="quiz-layout-screen">
      <div className="quiz-layout-canvas">
        <ScreenBackgroundLayer settings={bgSettings} fillParent />
        <div className="quiz-layout-canvas-base">{base}</div>
        <div className="quiz-layout-canvas-overlay">
          {normalized.map((el) => {
            const hasAction = Boolean(el.action?.type && el.action.type !== 'none')
            const isOption = Boolean(el.isOption)
            const interactive = (hasAction || isOption) && supportsActions(el.type)
            return (
              <div
                key={el.id}
                className={`ql-element ql-element--${el.type} ${interactive ? 'ql-element--interactive' : ''}`}
                style={{
                  ...layoutElementStyle(el),
                  ...(isOption
                    ? {
                        backgroundColor:
                          selectedOptionElementId &&
                          el.id === selectedOptionElementId
                            ? (el.optionActiveColor || el.backgroundColor)
                            : (el.optionInactiveColor || el.backgroundColor),
                      }
                    : {}),
                  ...(el.type === 'shape' && el.shapeVariant === 'circle'
                    ? { borderRadius: '50%' }
                    : {}),
                }}
                onClick={interactive ? () => handleClick(el) : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick(el)
                        }
                      }
                    : undefined
                }
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
              >
                <RuntimeLayoutElement element={el} />
              </div>
            )
          })}
        </div>
      </div>
    </QuizLayoutFontRoot>
  )
}

export { CANVAS_W, CANVAS_H }
