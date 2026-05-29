import type { QuizQuestion } from './builderTypes'
import {
  applyScreenBackgroundToLayout,
  DEFAULT_SCREEN_BACKGROUND,
  getLayoutElements,
  getScreenBackgroundSettings,
  isLayoutAnswerChoice,
  layoutElementOptionKey,
  type LayoutElement,
  type ScreenBackgroundSettings,
} from './layoutTypes'

export type QuestionOptionChoice = { key: string; label: string }

export {
  defaultLayoutElementOptionKey,
  isLayoutAnswerChoice,
  isNavigationOnlyButton,
  layoutElementOptionKey,
  normalizeLayoutAnswerKeys,
} from './layoutTypes'

export function resolveLayoutAnswerKey(el: LayoutElement): string {
  return layoutElementOptionKey(el)
}

function uniqueDbOptionKey(
  opt: { id: number; option_key: string },
  used: Set<string>
): string {
  const base = opt.option_key?.trim() || `db_${opt.id}`
  if (!used.has(base)) return base
  const fallback = `db_${opt.id}`
  return used.has(fallback) ? `db_${opt.id}_${used.size}` : fallback
}

/** Unique option keys for result conditions (layout + DB). */
export function collectQuestionOptionChoices(
  question: Pick<QuizQuestion, 'options' | 'layout'>,
  lang: string
): QuestionOptionChoice[] {
  const byKey = new Map<string, QuestionOptionChoice>()
  const used = new Set<string>()
  const add = (key: string, label: string) => {
    const k = key.trim()
    if (!k || byKey.has(k)) return
    used.add(k)
    byKey.set(k, { key: k, label: label.trim() || k })
  }
  for (const opt of question.options) {
    add(uniqueDbOptionKey(opt, used), opt.labels[lang] || opt.option_key)
  }
  for (const el of getLayoutElements(question.layout)) {
    if (!isLayoutAnswerChoice(el)) continue
    const key = layoutElementOptionKey(el)
    const label = el.content?.trim() || el.placeholder?.trim() || key
    add(key, label)
  }
  return Array.from(byKey.values())
}

export function resolveConditionOptionKey(
  selected: string,
  options: QuestionOptionChoice[]
): string {
  const trimmed = selected.trim()
  if (trimmed && options.some((o) => o.key === trimmed)) return trimmed
  return options[0]?.key ?? ''
}

export type CustomResultCondition = {
  questionKey: string
  optionKey: string
  /** When set, this rule only matches when the student selected this quiz language. */
  languageCode?: string
}

/** Legacy shape stored before layout-based result screens. */
type LegacyResultScreen = {
  heading?: string
  subtitle?: string
  body?: string
  ctaLabel?: string
  backgroundColor?: string
}

export type CustomResultRule = {
  id: string
  name: string
  resultTitle: string
  resultDescription: string
  conditions: CustomResultCondition[]
  /** Layout JSON (elements + screen background), same structure as question layouts. */
  layout: Record<string, unknown>
  /** Optional per-language result screen layouts. */
  layoutByLanguage?: Record<string, Record<string, unknown>>
}

type StoredRule = CustomResultRule & { resultScreen?: LegacyResultScreen }

export function customResultsStorageKey(quizId: number): string {
  return `asq_custom_results_${quizId}`
}

function normalizeRule(raw: StoredRule): CustomResultRule {
  const layout = raw.layout && typeof raw.layout === 'object' ? { ...raw.layout } : {}
  const legacy = raw.resultScreen
  if (legacy && getLayoutElements(layout).length === 0) {
    const heading = legacy.heading?.trim() || raw.resultTitle?.trim() || ''
    const body = legacy.body?.trim() || raw.resultDescription?.trim() || ''
    const elements: LayoutElement[] = []
    if (heading) {
      elements.push({
        id: 'legacy-heading',
        type: 'text',
        x: 24,
        y: 80,
        width: 327,
        height: 48,
        content: heading,
      })
    }
    if (legacy.subtitle?.trim()) {
      elements.push({
        id: 'legacy-subtitle',
        type: 'text',
        x: 24,
        y: heading ? 136 : 80,
        width: 327,
        height: 40,
        content: legacy.subtitle.trim(),
      })
    }
    if (body) {
      elements.push({
        id: 'legacy-body',
        type: 'text',
        x: 24,
        y: heading ? 188 : 128,
        width: 327,
        height: 120,
        content: body,
      })
    }
    if (legacy.ctaLabel?.trim()) {
      elements.push({
        id: 'legacy-cta',
        type: 'button',
        x: 24,
        y: 520,
        width: 327,
        height: 48,
        content: legacy.ctaLabel.trim(),
      })
    }
    layout.elements = elements
    if (legacy.backgroundColor?.trim()) {
      applyScreenBackgroundToLayout(layout, {
        backgroundFill: 'solid',
        backgroundColor: legacy.backgroundColor.trim(),
      })
    }
  }
  return {
    id: raw.id,
    name: raw.name ?? '',
    resultTitle: raw.resultTitle ?? '',
    resultDescription: raw.resultDescription ?? '',
    conditions: Array.isArray(raw.conditions) ? raw.conditions : [],
    layout,
    layoutByLanguage:
      raw.layoutByLanguage && typeof raw.layoutByLanguage === 'object' ? raw.layoutByLanguage : undefined,
  }
}

export function loadCustomResults(quizId: number): CustomResultRule[] {
  const key = customResultsStorageKey(quizId)
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? (JSON.parse(raw) as StoredRule[]) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeRule)
  } catch {
    return []
  }
}

export function saveCustomResults(quizId: number, rules: CustomResultRule[]): void {
  localStorage.setItem(customResultsStorageKey(quizId), JSON.stringify(rules))
}

export function isResultScreenDesigned(rule: CustomResultRule): boolean {
  if (getLayoutElements(rule.layout).length > 0) return true
  const bg = getScreenBackgroundSettings(rule.layout)
  if (bg.backgroundImage?.trim()) return true
  if (bg.backgroundFill === 'linear') return true
  const color = bg.backgroundColor?.trim().toLowerCase()
  if (color && color !== DEFAULT_SCREEN_BACKGROUND.toLowerCase()) return true
  return false
}

export function buildResultLayoutJson(
  elements: LayoutElement[],
  screenBackground?: ScreenBackgroundSettings
): Record<string, unknown> {
  const base: Record<string, unknown> = { elements }
  if (screenBackground) {
    applyScreenBackgroundToLayout(base, screenBackground)
  }
  return base
}

export function updateResultLayoutInList(
  rules: CustomResultRule[],
  resultId: string,
  layout: Record<string, unknown>
): CustomResultRule[] {
  return rules.map((r) => (r.id === resultId ? { ...r, layout } : r))
}

export function updateResultLayoutForLanguage(
  rules: CustomResultRule[],
  resultId: string,
  languageCode: string,
  layout: Record<string, unknown>,
  defaultLanguage?: string
): CustomResultRule[] {
  return rules.map((r) => {
    if (r.id !== resultId) return r
    if (!languageCode.trim() || (defaultLanguage && languageCode === defaultLanguage)) {
      return { ...r, layout }
    }
    return {
      ...r,
      layoutByLanguage: { ...(r.layoutByLanguage || {}), [languageCode]: layout },
    }
  })
}

export function resolveResultLayoutSource(
  rule: CustomResultRule,
  languageCode: string,
  defaultLanguage?: string
): Record<string, unknown> {
  if (!languageCode.trim() || (defaultLanguage && languageCode === defaultLanguage)) {
    return rule.layout
  }
  return rule.layoutByLanguage?.[languageCode] || rule.layout
}

export function normalizeAnswerKey(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

/** Map preview selections (by question id) to answer keys used by result rules. */
export function answersFromQuestionIds(
  questions: Array<{ id: number; question_key: string }>,
  selectionsByQuestionId: Record<number, string>
): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const q of questions) {
    const choice = selectionsByQuestionId[q.id]?.trim()
    if (choice) answers[q.question_key] = choice
  }
  return answers
}

/** Same matching order as the public quiz: most conditions first, all must match. */
export function matchCustomResultRule(
  rules: CustomResultRule[],
  answers: Record<string, string>,
  selectedLanguage?: string
): CustomResultRule | null {
  const normalizeLang = (value: string | undefined) => (value || '').trim().toLowerCase()
  const conditionMatches = (questionKey: string, expected: string | undefined) =>
    normalizeAnswerKey(answers[questionKey]) === normalizeAnswerKey(expected)

  return (
    [...rules]
      .sort((a, b) => b.conditions.length - a.conditions.length)
      .find(
        (rule) =>
          rule.conditions.length > 0 &&
          rule.conditions.every((cond) => {
            if (cond.languageCode?.trim()) {
              if (normalizeLang(selectedLanguage) !== normalizeLang(cond.languageCode)) return false
            }
            return conditionMatches(cond.questionKey, cond.optionKey)
          })
      ) ?? null
  )
}

export function resolveResultLayoutForLanguage(
  rule: CustomResultRule,
  languageCode?: string
): Record<string, unknown> {
  const code = languageCode?.trim()
  if (code && rule.layoutByLanguage?.[code]) return rule.layoutByLanguage[code]
  return rule.layout
}

export function sanitizeResultRuleConditions(
  rule: CustomResultRule,
  questions: QuizQuestion[],
  lang: string
): CustomResultRule {
  return {
    ...rule,
    conditions: rule.conditions.map((c) => {
      const q = questions.find((x) => x.question_key === c.questionKey)
      const options = q ? collectQuestionOptionChoices(q, lang) : []
      return {
        questionKey: c.questionKey,
        optionKey: resolveConditionOptionKey(c.optionKey, options),
        languageCode: c.languageCode?.trim() || undefined,
      }
    }),
  }
}
