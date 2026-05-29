import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { fetchQuizBuilder, publishQuiz, saveQuizDraft } from '../api'
import { questionDisplayName } from '../builderDisplay'
import type { QuizBuilderPayload } from '../builderTypes'
import { AdminQuizBuilderTabs } from '../components/AdminQuizBuilderTabs'
import { QuestionScreenDesigner, type QuestionScreenDesignerHandle } from '../components/QuestionScreenDesigner'

export function AdminQuestionDesignPage() {
  const { id, questionId } = useParams<{ id: string; questionId: string }>()
  const quizId = Number(id)
  const qId = Number(questionId)
  const [quiz, setQuiz] = useState<QuizBuilderPayload | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [editLang, setEditLang] = useState('English')

  const load = useCallback(async () => {
    if (!quizId || Number.isNaN(quizId)) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchQuizBuilder(quizId)
      setQuiz(data.quiz)
      const defaultLang =
        data.quiz.languages.find((l) => l.is_default)?.language_code ||
        data.quiz.languages[0]?.language_code ||
        'English'
      setEditLang(defaultLang)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    void load()
  }, [load])

  const designerRef = useRef<QuestionScreenDesignerHandle | null>(null)

  if (loading && !quiz) {
    return <p className="admin-pagination-text">Loading designer…</p>
  }

  if (!quiz || Number.isNaN(qId)) {
    return (
      <div>
        <p className="admin-error">{error || 'Quiz not found'}</p>
        <Link to="/admin/quizzes" className="admin-link-back">
          ← Back to quizzes
        </Link>
      </div>
    )
  }

  const question = quiz.questions.find((q) => q.id === qId)
  if (!question) {
    return <Navigate to={`/admin/quizzes/${quizId}/builder`} replace />
  }

  const screenName = questionDisplayName(question, editLang)
  const validation = quiz.publish_validation

  const handleDraft = async () => {
    try {
      // Ensure in-memory layout changes are persisted before drafting the quiz.
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
        <Link to={`/admin/quizzes/${quizId}/builder`} className="admin-link-back">
          ← Back to questions
        </Link>
        <div className="admin-page-header-row">
          <h1 className="admin-page-title">
            {quiz.name} — {screenName}
          </h1>
          <span className={`admin-status admin-status--${quiz.status}`}>{quiz.status}</span>
        </div>
      </header>

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
            title={
              validation.can_publish
                ? 'Publish quiz'
                : `Missing: ${validation.missing_question_keys.join(', ')}`
            }
          >
            Publish
          </button>
        </div>
      </div>

      {error && <p className="admin-error admin-page-error">{error}</p>}
      {message && <p className="admin-builder-message admin-muted">{message}</p>}

      <AdminQuizBuilderTabs quizId={quizId} active="design" designLabel={screenName} />

      <section className="admin-panel admin-builder-tab-panel admin-question-design-panel">
        <QuestionScreenDesigner
          ref={designerRef}
          quiz={quiz}
          question={question}
          languageCode={editLang}
          onQuizUpdated={setQuiz}
          onError={setError}
          onMessage={setMessage}
        />
      </section>
    </div>
  )
}
