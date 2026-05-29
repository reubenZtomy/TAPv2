import type { QuizContent } from '../types/quizContent'

export type QuizScreenId =
  | 'login'
  | 'register'
  | 'title'
  | 'passion'
  | 'partner'
  | 'treasure'
  | 'fun'
  | 'basecamp'
  | 'adventure'
  | 'recharge'
  | 'graduation'
  | 'dynamic'
  | 'results'
  | 'personalityResult'
  | 'done'

export const TAP_QUESTION_ORDER = [
  'passion',
  'partner',
  'treasure',
  'fun',
  'basecamp',
  'adventure',
  'recharge',
  'graduation',
] as const

const KEY_TO_SCREEN: Record<string, QuizScreenId> = {
  passion: 'passion',
  partner: 'partner',
  treasure: 'treasure',
  fun: 'fun',
  basecamp: 'basecamp',
  adventure: 'adventure',
  recharge: 'recharge',
  graduation: 'graduation',
}

export function screenForQuestionKey(key: string): QuizScreenId {
  return KEY_TO_SCREEN[key] ?? 'dynamic'
}

export function nextQuestionKey(order: string[], currentKey: string): string | null {
  const idx = order.indexOf(currentKey)
  if (idx < 0) return order[0] ?? null
  return order[idx + 1] ?? null
}

export function prevQuestionKey(order: string[], currentKey: string): string | null {
  const idx = order.indexOf(currentKey)
  if (idx <= 0) return null
  return order[idx - 1] ?? null
}

export function firstQuestionScreen(order: string[]): QuizScreenId {
  const first = order[0]
  return first ? screenForQuestionKey(first) : 'passion'
}

export function getQuestionText(content: QuizContent | null, key: string, fallback: string) {
  return content?.questions?.[key]?.question || fallback
}

export function getOptionLabels(content: QuizContent | null, key: string) {
  return Object.fromEntries(
    (content?.questions?.[key]?.options || []).map((option) => [option.key, option.label])
  )
}
