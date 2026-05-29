import type { QuizBuilderPayload, QuizQuestion } from './builderTypes'
import {
  collectQuestionOptionChoices,
  type QuestionOptionChoice,
} from './customResults'
import {
  extractLayoutStrings,
  getIntroI18n,
  getLayoutI18n,
  type IntroI18nEntry,
  type LayoutElementI18n,
} from './layoutI18n'
import { getLayoutElements } from './layoutTypes'

/** Matches legacy TAP language files (e.g. English.txt). */
export type QuizLanguageFileQuestion = {
  question: string
  subtitle?: string
  options: Array<{ key: string; label: string }>
}

export type QuizLanguageFile = {
  title: {
    heading: string
    subtitle: string
    startButton: string
  }
  ui: Record<string, string>
  questions: Record<string, QuizLanguageFileQuestion>
}

/** Optional wrapper from older builder exports — still accepted on upload. */
export type QuizLanguageJsonMeta = {
  version?: number
  source_language?: string
  target_language: string
  target_language_name?: string
  instructions?: string
}

export type QuizLanguageImportPayload = QuizLanguageFile & {
  _language?: QuizLanguageJsonMeta
}

export const DEFAULT_UI_STRINGS: Record<string, string> = {
  back: 'Back',
  confirm: 'Confirm',
  passionReset: 'I changed my mind!',
  partnerEmptySelection: 'Pick a Character!',
  partnerInstruction: 'Select Character then Confirm',
  answerInstruction: 'Select Answer then Confirm',
  imageInstruction: 'Select Image then Confirm',
  graduationInstruction: 'Select an option to confirm',
  passionSwipeStart: 'Swipe to the right for more options',
  passionSwipeMiddle: 'Swipe left or right',
  passionSwipeEnd: 'Swipe to the right',
  adventureSwipeStart: 'Swipe right for more options or press confirm',
  adventureSwipeMiddle: 'Swipe left or right',
  adventureSwipeEnd: 'Swipe left',
  resultsMain: 'Gathering results...',
  resultsSubtitle: 'I wonder where you will go?',
  resultsButton: 'Click to find out!',
}

function sortedQuestions(quiz: QuizBuilderPayload): QuizQuestion[] {
  return [...quiz.questions].sort((a, b) => a.order_index - b.order_index)
}

function questionStrings(
  question: QuizQuestion,
  languageCode: string,
  defaultLanguage: string
): { question: string; subtitle?: string } {
  const trans = question.translations[languageCode]
  if (trans?.title?.trim()) {
    return {
      question: trans.title.trim(),
      subtitle: trans.subtitle?.trim() || undefined,
    }
  }
  if (languageCode !== defaultLanguage) {
    const fallback = question.translations[defaultLanguage]
    if (fallback?.title?.trim()) {
      return {
        question: fallback.title.trim(),
        subtitle: fallback.subtitle?.trim() || undefined,
      }
    }
  }
  const any = Object.values(question.translations).find((t) => t.title?.trim())
  return {
    question: any?.title?.trim() || question.question_key,
    subtitle: any?.subtitle?.trim() || undefined,
  }
}

function optionLabel(
  question: QuizQuestion,
  optionKey: string,
  languageCode: string,
  defaultLanguage: string,
  choices: QuestionOptionChoice[]
): string {
  const opt = question.options.find((o) => o.option_key === optionKey)
  const fromDb = opt?.labels[languageCode]?.trim() || opt?.labels[defaultLanguage]?.trim()
  if (fromDb) return fromDb
  const fromLayout = choices.find((c) => c.key === optionKey)?.label
  return fromLayout || optionKey
}

function introStringsForLanguage(
  quiz: QuizBuilderPayload,
  languageCode: string,
  defaultLanguage: string
): { heading: string; subtitle: string; startButton: string } {
  const intro = quiz.intro_layout ?? {}
  const base = {
    heading: (intro.heading || '').trim(),
    subtitle: (intro.subtitle || '').trim(),
    startButton: (intro.startButton || 'Tap to Start').trim(),
  }
  if (languageCode === defaultLanguage) return base
  const entry = getIntroI18n(intro)[languageCode]
  if (!entry) return base
  return {
    heading: entry.heading?.trim() || base.heading,
    subtitle: entry.subtitle?.trim() || base.subtitle,
    startButton: entry.startButton?.trim() || base.startButton,
  }
}

export function buildQuizLanguageFile(
  quiz: QuizBuilderPayload,
  sourceLanguage: string
): QuizLanguageFile {
  const defaultLanguage =
    quiz.languages.find((l) => l.is_default)?.language_code ||
    quiz.languages[0]?.language_code ||
    sourceLanguage

  const introCopy = introStringsForLanguage(quiz, sourceLanguage, defaultLanguage)

  const questionsOut: Record<string, QuizLanguageFileQuestion> = {}
  for (const q of sortedQuestions(quiz)) {
    const strings = questionStrings(q, sourceLanguage, defaultLanguage)
    const choices = collectQuestionOptionChoices(q, sourceLanguage)
    const optionKeys = new Map<string, true>()
    const options: Array<{ key: string; label: string }> = []
    for (const opt of q.options) {
      optionKeys.set(opt.option_key, true)
      options.push({
        key: opt.option_key,
        label: optionLabel(q, opt.option_key, sourceLanguage, defaultLanguage, choices),
      })
    }
    for (const choice of choices) {
      if (optionKeys.has(choice.key)) continue
      options.push({ key: choice.key, label: choice.label })
    }

    questionsOut[q.question_key] = {
      question: strings.question,
      ...(strings.subtitle ? { subtitle: strings.subtitle } : {}),
      options,
    }
  }

  return {
    title: {
      heading: introCopy.heading,
      subtitle: introCopy.subtitle,
      startButton: introCopy.startButton,
    },
    ui: { ...DEFAULT_UI_STRINGS },
    questions: questionsOut,
  }
}

export function downloadQuizLanguageJson(
  quiz: QuizBuilderPayload,
  sourceLanguage: string,
  targetLanguage: string,
  _targetLanguageName?: string
): void {
  const payload = buildQuizLanguageFile(quiz, sourceLanguage)
  const langSlug =
    targetLanguage.trim().replace(/[^\w.-]+/g, '_').replace(/^_|_$/g, '') || 'Language'
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${langSlug}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseQuizLanguageJson(
  raw: unknown,
  languageCodeHint?: string
): { payload: QuizLanguageFile; languageCode: string; languageName?: string } {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON file')
  }
  const data = raw as QuizLanguageImportPayload
  if (!data.questions || typeof data.questions !== 'object') {
    throw new Error('Missing questions object in JSON file')
  }
  if (!data.title || typeof data.title !== 'object') {
    throw new Error('Missing title object in JSON file')
  }

  const meta = data._language
  const languageCode = (
    languageCodeHint?.trim() ||
    meta?.target_language?.trim() ||
    ''
  ).trim()
  if (!languageCode) {
    throw new Error('Set the new language code before uploading, or include _language.target_language in the file')
  }

  const normalizedQuestions: Record<string, QuizLanguageFileQuestion & { layout_strings?: Record<string, LayoutElementI18n> }> =
    {}
  for (const [questionKey, qRaw] of Object.entries(data.questions)) {
    if (!qRaw || typeof qRaw !== 'object') continue
    const q = qRaw as Record<string, unknown>
    const optionsRaw = Array.isArray(q.options) ? q.options : []
    const options = optionsRaw
      .filter((opt): opt is Record<string, unknown> => Boolean(opt && typeof opt === 'object'))
      .map((opt) => ({
        key: String(opt.key ?? opt.option_key ?? '').trim(),
        label: String(opt.label ?? '').trim(),
      }))
      .filter((opt) => opt.key && opt.label)

    normalizedQuestions[questionKey] = {
      question: String(q.question ?? q.title ?? '').trim(),
      ...(typeof q.subtitle === 'string' && q.subtitle.trim() ? { subtitle: q.subtitle.trim() } : {}),
      options,
      ...(q.layout_strings && typeof q.layout_strings === 'object'
        ? { layout_strings: q.layout_strings as Record<string, LayoutElementI18n> }
        : {}),
    }
  }

  const payload: QuizLanguageFile & {
    questions: Record<string, QuizLanguageFileQuestion & { layout_strings?: Record<string, LayoutElementI18n> }>
  } = {
    title: {
      heading: String(data.title.heading ?? ''),
      subtitle: String(data.title.subtitle ?? ''),
      startButton: String(data.title.startButton ?? ''),
    },
    ui: { ...(data.ui && typeof data.ui === 'object' ? data.ui : {}) },
    questions: normalizedQuestions,
  }

  return {
    payload,
    languageCode,
    languageName: meta?.target_language_name?.trim() || languageCode,
  }
}

/** Convert parsed file to backend import shape (supports layout_strings extension). */
export function toBackendImportPayload(
  parsed: QuizLanguageFile & {
    questions: Record<
      string,
      QuizLanguageFileQuestion & { layout_strings?: Record<string, LayoutElementI18n> }
    >
  }
): Record<string, unknown> {
  const questions: Record<string, unknown> = {}
  for (const [key, q] of Object.entries(parsed.questions)) {
    questions[key] = {
      question: q.question,
      ...(q.subtitle ? { subtitle: q.subtitle } : {}),
      options: q.options.map((opt) => ({ key: opt.key, label: opt.label })),
      ...(q.layout_strings ? { layout_strings: q.layout_strings } : {}),
    }
  }
  return {
    title: parsed.title,
    ui: parsed.ui,
    questions,
  }
}

export function getQuizFirstScreenTarget(quiz: QuizBuilderPayload): { type: 'intro' | 'question'; questionId?: number } {
  const intro = quiz.intro_layout
  const hasIntroText = Boolean(
    intro?.heading?.trim() || intro?.subtitle?.trim() || intro?.startButton?.trim()
  )
  const hasIntroElements = getLayoutElements(intro?.elements).length > 0
  if (hasIntroText || hasIntroElements) return { type: 'intro' }
  const first = sortedQuestions(quiz)[0]
  if (first) return { type: 'question', questionId: first.id }
  return { type: 'intro' }
}

export type { IntroI18nEntry, LayoutElementI18n }
