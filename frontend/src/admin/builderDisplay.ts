import { LAYOUT_TYPE_OPTIONS, type QuizQuestion } from './builderTypes'
import type { LayoutElement, ScreenBackgroundSettings } from './layoutTypes'
import {
  applyScreenBackgroundToLayout,
  DEFAULT_SCREEN_BACKGROUND,
  getLayoutElements,
  getScreenBackgroundSettings,
} from './layoutTypes'

export function isLayoutTypeSet(layoutType: string | null | undefined): boolean {
  return Boolean(layoutType?.trim())
}

export function questionLayoutTypeLabel(layoutType: string | null | undefined): string {
  const value = layoutType?.trim()
  if (!value) return 'Not Set'
  const match = LAYOUT_TYPE_OPTIONS.find((o) => o.value === value)
  return match?.label ?? value.replace(/_/g, ' ')
}

/** True when the question has a saved custom screen design (elements and/or background). */
export function isQuestionScreenDesigned(question: QuizQuestion): boolean {
  if (getLayoutElements(question.layout).length > 0) return true
  const bg = getScreenBackgroundSettings(question.layout)
  if (bg.backgroundImage?.trim()) return true
  if (bg.backgroundFill === 'linear') return true
  const color = bg.backgroundColor?.trim().toLowerCase()
  if (color && color !== DEFAULT_SCREEN_BACKGROUND.toLowerCase()) return true
  return false
}

/** Persist elements and screen background settings for the question layout. */
export function buildQuestionLayoutJson(
  question: QuizQuestion,
  elements: LayoutElement[],
  screenBackground?: ScreenBackgroundSettings
): Record<string, unknown> {
  const layoutType = question.layout_type?.trim()
  const base: Record<string, unknown> = layoutType
    ? {
        ...question.layout,
        elements,
        template: (question.layout?.template as string) || layoutType,
      }
    : { ...question.layout, elements }
  if (question.layout?.i18n && typeof question.layout.i18n === 'object') {
    base.i18n = question.layout.i18n
  }
  if (screenBackground) {
    applyScreenBackgroundToLayout(base, screenBackground)
  }
  return base
}
export function questionDisplayName(q: QuizQuestion, languageCode: string): string {
  const titled = q.translations[languageCode]?.title?.trim()
  if (titled) return titled
  const fallback = Object.values(q.translations).find((t) => t.title?.trim())
  if (fallback?.title?.trim()) return fallback.title.trim()
  return q.question_key
}
