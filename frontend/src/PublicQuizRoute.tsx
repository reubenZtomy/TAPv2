import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PublicQuizApp } from './PublicQuizApp'
import { QuizUnavailableScreen } from './screens/QuizUnavailableScreen'
import type { IntroLayout } from './admin/layoutTypes'
import type { QuizContent } from './types/quizContent'
import type { QuizCustomFont } from './utils/quizFont'

export type PublicQuestionOption = {
  option_key: string
  labels: Record<string, string>
}

export type PublicQuestionLayout = {
  id: number
  question_key: string
  layout_type: string
  layout: Record<string, unknown>
  options?: PublicQuestionOption[]
}

export type PublicQuizPayload = {
  available: boolean
  reason?: string
  slug?: string
  quiz_name?: string | null
  unavailable?: { title?: string; message?: string }
  quiz?: { id: number; name: string; result_engine_type?: string }
  languages?: string[]
  default_language?: string
  allow_language_selection?: boolean
  content?: QuizContent
  contents?: Record<string, QuizContent>
  question_order?: string[]
  intro_layout?: IntroLayout
  custom_font?: QuizCustomFont | null
  questions_layout?: PublicQuestionLayout[]
  custom_results?: unknown[]
}

export function PublicQuizRoute() {
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<PublicQuizPayload | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    void fetch(`/api/public/quizzes/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = (await res.json()) as PublicQuizPayload
        setPayload(data)
      })
      .catch(() => setPayload({ available: false, reason: 'not_found' }))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="app-root">
        <div className="quiz-unavailable-screen">
          <p className="typo-body">Loading quiz…</p>
        </div>
      </div>
    )
  }

  if (!payload?.available) {
    return (
      <QuizUnavailableScreen
        reason={payload?.reason}
        quizName={payload?.quiz_name}
        title={payload?.unavailable?.title}
        message={payload?.unavailable?.message}
      />
    )
  }

  return <PublicQuizApp publicQuiz={payload} />
}
