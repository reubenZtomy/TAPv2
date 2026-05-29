import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchQuizBuilder, publishQuiz, saveQuizDraft } from '../api'
import type { QuizBuilderPayload } from '../builderTypes'
import { AdminQuizBuilderTabs } from '../components/AdminQuizBuilderTabs'
import { IntroScreenDesigner, type IntroScreenDesignerHandle } from '../components/IntroScreenDesigner'

export function AdminIntroDesignPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const quizId = Number(id)
  const [quiz, setQuiz] = useState<QuizBuilderPayload | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const seedLanguageSwitch = searchParams.get('seedLanguageSwitch') === '1'
  const designerRef = useRef<IntroScreenDesignerHandle | null>(null)

  const load = useCallback(async () => {
    if (!quizId || Number.isNaN(quizId)) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchQuizBuilder(quizId)
      setQuiz(data.quiz)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !quiz) {
    return <p className="admin-pagination-text">Loading designer…</p>
  }

  if (!quiz || Number.isNaN(quizId)) {
    return (
      <div>
        <p className="admin-error">{error || 'Quiz not found'}</p>
        <Link to="/admin/quizzes" className="admin-link-back">
          ← Back to quizzes
        </Link>
      </div>
    )
  }

  const validation = quiz.publish_validation

  const handleDraft = async () => {
    try {
      await designerRef.current?.saveNow()
      const res = await saveQuizDraft(quizId)
      setQuiz(res.quiz)
      setMessage(res.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const handlePublish = async () => {
    try {
      await designerRef.current?.saveNow()
      const res = await publishQuiz(quizId)
      setQuiz(res.quiz)
      setMessage(res.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    }
  }

  return (
    <div className="admin-page admin-builder admin-question-design-page">
      <header className="admin-page-header">
        <Link to={`/admin/quizzes/${quizId}/builder?tab=languages`} className="admin-link-back">
          ← Back to languages
        </Link>
        <div className="admin-page-header-row">
          <h1 className="admin-page-title">{quiz.name} — Intro / first screen</h1>
          <span className={`admin-status admin-status--${quiz.status}`}>{quiz.status}</span>
        </div>
      </header>

      <AdminQuizBuilderTabs quizId={quizId} active="questions" />

      {error ? <p className="admin-error">{error}</p> : null}
      {message ? <p className="admin-success">{message}</p> : null}

      <div className="admin-panel-toolbar admin-builder-toolbar">
        <div className="admin-toolbar-end">
          <button type="button" className="admin-btn" onClick={() => void handleDraft()}>
            Save draft
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => void handlePublish()}
            disabled={!validation.can_publish}
          >
            Publish
          </button>
        </div>
      </div>

      <IntroScreenDesigner
        ref={designerRef}
        quiz={quiz}
        seedLanguageSwitch={seedLanguageSwitch}
        onQuizUpdated={setQuiz}
        onError={setError}
        onMessage={setMessage}
      />
    </div>
  )
}
