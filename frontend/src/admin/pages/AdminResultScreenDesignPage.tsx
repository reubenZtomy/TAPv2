import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { fetchQuizBuilder, publishQuiz, saveQuizDraft } from '../api'
import {
  loadCustomResults,
  resolveResultLayoutSource,
  saveCustomResults,
  updateResultLayoutForLanguage,
  type CustomResultRule,
} from '../customResults'
import type { QuizBuilderPayload } from '../builderTypes'
import { AdminQuizBuilderTabs } from '../components/AdminQuizBuilderTabs'
import {
  ResultScreenDesigner,
  type ResultScreenDesignerHandle,
} from '../components/ResultScreenDesigner'

export function AdminResultScreenDesignPage() {
  const { id, resultId } = useParams<{ id: string; resultId: string }>()
  const quizId = Number(id)
  const [quiz, setQuiz] = useState<QuizBuilderPayload | null>(null)
  const [customResults, setCustomResults] = useState<CustomResultRule[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [designLanguage, setDesignLanguage] = useState('English')

  const load = useCallback(async () => {
    if (!quizId || Number.isNaN(quizId)) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchQuizBuilder(quizId)
      setQuiz(data.quiz)
      setCustomResults(loadCustomResults(quizId))
      const defaultLang =
        data.quiz.languages.find((l) => l.is_default)?.language_code ||
        data.quiz.languages[0]?.language_code ||
        'English'
      setDesignLanguage(defaultLang)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    void load()
  }, [load])

  const designerRef = useRef<ResultScreenDesignerHandle | null>(null)

  if (loading && !quiz) {
    return <p className="admin-pagination-text">Loading designer…</p>
  }

  if (!quiz || !resultId) {
    return (
      <div>
        <p className="admin-error">{error || 'Quiz not found'}</p>
        <Link to="/admin/quizzes" className="admin-link-back">
          ← Back to quizzes
        </Link>
      </div>
    )
  }

  const rule = customResults.find((r) => r.id === resultId)
  if (!rule) {
    return <Navigate to={`/admin/quizzes/${quizId}/builder?tab=answers`} replace />
  }

  const screenName = rule.name.trim() || rule.resultTitle.trim() || 'Result'
  const validation = quiz.publish_validation

  const defaultLanguage =
    quiz.languages.find((l) => l.is_default)?.language_code ||
    quiz.languages[0]?.language_code ||
    'English'

  const persistLayout = (layout: Record<string, unknown>) => {
    const next = updateResultLayoutForLanguage(
      customResults,
      resultId,
      designLanguage,
      layout,
      defaultLanguage
    )
    setCustomResults(next)
    saveCustomResults(quizId, next)
  }

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
        <Link to={`/admin/quizzes/${quizId}/builder?tab=answers`} className="admin-link-back">
          ← Back to answers
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
        {quiz.languages.length > 1 ? (
          <div className="admin-toolbar admin-result-language-toolbar">
            <label className="admin-inspector-field admin-result-language-field">
              <span className="admin-inspector-label">Design language</span>
              <select
                className="admin-select admin-inspector-input"
                value={designLanguage}
                onChange={(e) => setDesignLanguage(e.target.value)}
              >
                {quiz.languages.map((lang) => (
                  <option key={lang.id} value={lang.language_code}>
                    {lang.language_name}
                  </option>
                ))}
              </select>
            </label>
            <p className="admin-muted admin-result-language-note">
              Build a separate result screen layout for each language when needed.
            </p>
          </div>
        ) : null}
        <ResultScreenDesigner
          ref={designerRef}
          key={`${rule.id}-${designLanguage}`}
          quizId={quizId}
          customFont={quiz.custom_font}
          onQuizFontUpdated={setQuiz}
          rule={rule}
          designLanguage={designLanguage}
          defaultLanguage={defaultLanguage}
          languages={quiz.languages}
          onLayoutSaved={persistLayout}
          onError={setError}
          onMessage={setMessage}
        />
      </section>
    </div>
  )
}
