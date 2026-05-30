import type { QuizRecord } from './api'
import type { CustomResultRule } from './customResults'
import type { IntroLayout } from './layoutTypes'

export type QuizLanguage = {
  id: number
  quiz_id: number
  language_code: string
  language_name: string
  is_default: boolean
}

export type QuestionTranslation = {
  title: string
  subtitle?: string | null
  helper_text?: string | null
}

export type QuizOption = {
  id: number
  question_id: number
  option_key: string
  order_index: number
  image_url?: string | null
  value?: string | null
  metadata?: Record<string, unknown>
  labels: Record<string, string>
}

export type QuizQuestion = {
  id: number
  quiz_id: number
  question_key: string
  order_index: number
  layout_type: string
  is_required: boolean
  translations: Record<string, QuestionTranslation>
  options: QuizOption[]
  layout: Record<string, unknown>
}

export type PublishValidation = {
  can_publish: boolean
  missing_question_keys: string[]
}

export type QuizBuilderPayload = QuizRecord & {
  languages: QuizLanguage[]
  questions: QuizQuestion[]
  intro_layout: IntroLayout
  publish_validation: PublishValidation
  custom_results?: CustomResultRule[]
}

export const LAYOUT_TYPE_OPTIONS = [
  { value: 'swipe_carousel', label: 'Swipe carousel' },
  { value: 'image_cards', label: 'Image cards' },
  { value: 'character_choice', label: 'Character choice' },
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multi select' },
  { value: 'budget_slider', label: 'Budget slider' },
  { value: 'result_reveal', label: 'Result reveal' },
  { value: 'text_input', label: 'Text input' },
] as const

export const TAP_REQUIRED_KEYS = [
  'passion',
  'partner',
  'treasure',
  'fun',
  'basecamp',
  'adventure',
  'recharge',
  'graduation',
] as const
