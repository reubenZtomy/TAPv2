import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  addQuestion,
  createQuizLink,
  deleteQuestion,
  fetchQuizBuilder,
  fetchQuizLinks,
  publishQuiz,
  saveQuizDraft,
  suggestQuizLinkSlug,
  updateQuizLink,
  updateQuestionLayout,
  updateQuiz,
  type QuizLink,
} from '../api'
import { AddQuestionModal } from '../components/AddQuestionModal'
import { QuestionOrderTable } from '../components/QuestionOrderTable'
import { QuestionDesignPreviewModal } from '../components/QuestionDesignPreviewModal'
import { ResultDesignPreviewModal } from '../components/ResultDesignPreviewModal'
import {
  collectQuestionOptionChoices,
  isResultScreenDesigned,
  hydrateCustomResultsFromServer,
  loadCustomResults,
  relaxAutoAssignedLanguageConditions,
  resolveConditionOptionKey,
  sanitizeResultRuleConditions,
  persistCustomResults,
  type CustomResultRule,
} from '../customResults'
import { TableRowActionsMenu } from '../components/TableRowActionsMenu'
import { AdminQuizBuilderTabs, type AdminBuilderTab } from '../components/AdminQuizBuilderTabs'
import { AdminQuizLinksPanel } from '../components/AdminQuizLinksPanel'
import { QuizLanguagesPanel } from '../components/QuizLanguagesPanel'
import {
  questionDisplayName,
} from '../builderDisplay'
import type { QuizBuilderPayload } from '../builderTypes'

const BUILDER_TABS: AdminBuilderTab[] = ['questions', 'answers', 'languages', 'settings', 'links']

function emptyResultDraft(): CustomResultRule {
  return {
    id: `res-${Date.now()}`,
    name: '',
    resultTitle: '',
    resultDescription: '',
    conditions: [],
    layout: {},
  }
}

function tabFromSearchParam(value: string | null): AdminBuilderTab {
  if (value && BUILDER_TABS.includes(value as AdminBuilderTab)) return value as AdminBuilderTab
  return 'questions'
}

function uniqueConditionIssueMessages(messages: string[]): string[] {
  return Array.from(new Set(messages))
}

export function AdminQuizBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const quizId = Number(id)
  const [quiz, setQuiz] = useState<QuizBuilderPayload | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [editLang, setEditLang] = useState('English')

  const [details, setDetails] = useState({ name: '', description: '' })
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [previewQuestionId, setPreviewQuestionId] = useState<number | null>(null)
  const [duplicateSourceQuestionId, setDuplicateSourceQuestionId] = useState<number | null>(null)
  const [duplicateTargetQuestionId, setDuplicateTargetQuestionId] = useState<number | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  const [customResults, setCustomResults] = useState<CustomResultRule[]>([])
  const skipPersistCustomResults = useRef(true)
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [resultDraft, setResultDraft] = useState<CustomResultRule | null>(null)
  const [previewResultId, setPreviewResultId] = useState<string | null>(null)
  const activeTab = tabFromSearchParam(searchParams.get('tab'))
  const [quizLinks, setQuizLinks] = useState<QuizLink[]>([])
  const [slugModalOpen, setSlugModalOpen] = useState(false)
  const [slugHint, setSlugHint] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [slugSaving, setSlugSaving] = useState(false)
  const [publishAfterSlugSave, setPublishAfterSlugSave] = useState(false)
  const [answerValidationModalOpen, setAnswerValidationModalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!quizId || Number.isNaN(quizId)) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchQuizBuilder(quizId)
      setQuiz(data.quiz)
      setDetails({
        name: data.quiz.name,
        description: data.quiz.description || '',
      })
      const defaultLang =
        data.quiz.languages.find((l) => l.is_default)?.language_code ||
        data.quiz.languages[0]?.language_code ||
        'English'
      setEditLang(defaultLang)
      setSelectedQuestionId((prev) => {
        if (prev && data.quiz.questions.some((q) => q.id === prev)) return prev
        return data.quiz.questions[0]?.id ?? null
      })
      const serverRules = data.quiz.custom_results ?? []
      const localRules = relaxAutoAssignedLanguageConditions(loadCustomResults(quizId), defaultLang)
      if ((!serverRules || serverRules.length === 0) && localRules.length > 0) {
        setCustomResults(localRules)
        skipPersistCustomResults.current = false
      } else {
        const rules = hydrateCustomResultsFromServer(quizId, serverRules, defaultLang)
        setCustomResults(rules)
        skipPersistCustomResults.current = true
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    void load()
  }, [load])

  const loadLinks = useCallback(async () => {
    if (!quizId || Number.isNaN(quizId)) return
    try {
      const data = await fetchQuizLinks(quizId)
      setQuizLinks(data.links)
    } catch {
      // Keep quiz builder usable even if link load fails.
      setQuizLinks([])
    }
  }, [quizId])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  useEffect(() => {
    if (!quizId || Number.isNaN(quizId)) return
    if (skipPersistCustomResults.current) {
      skipPersistCustomResults.current = false
      return
    }
    void persistCustomResults(quizId, customResults).catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to save answer rules')
    })
  }, [quizId, customResults])

  const applyQuiz = (payload: QuizBuilderPayload) => {
    setQuiz(payload)
    if (payload.questions.length > 0) {
      const still = payload.questions.some((q) => q.id === selectedQuestionId)
      if (!still) setSelectedQuestionId(payload.questions[0].id)
    }
  }

  const handleSaveDetails = async () => {
    try {
      const res = await updateQuiz(quizId, {
        name: details.name,
        description: details.description,
      } as Parameters<typeof updateQuiz>[1])
      await load()
      setMessage('Quiz details saved')
      setQuiz((q) => (q ? { ...q, ...res.quiz } : q))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const handlePublish = async () => {
    if (hasAnswerMappingIssues) {
      setAnswerValidationModalOpen(true)
      return
    }
    try {
      const res = await publishQuiz(quizId)
      applyQuiz(res.quiz)
      setMessage(res.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    }
  }

  const handleDraft = async () => {
    try {
      const res = await saveQuizDraft(quizId)
      applyQuiz(res.quiz)
      setMessage(res.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const handleAddQuestion = async (screenName: string) => {
    if (!quiz) return
    const title = screenName.trim()
    const questionKey = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'screen'
    const defaultLang =
      quiz.languages.find((l) => l.is_default)?.language_code ||
      quiz.languages[0]?.language_code ||
      'English'
    const translations: Record<string, { title: string }> = {
      [defaultLang]: { title },
    }
    if (editLang !== defaultLang) {
      translations[editLang] = { title }
    }
    try {
      const res = await addQuestion(quizId, {
        question_key: questionKey,
        layout_type: '',
        translations,
      })
      applyQuiz(res.quiz)
      setMessage('Question added')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add question failed')
      throw e
    }
  }

  const primaryLink = quizLinks[0] ?? null
  const publicBase = typeof window !== 'undefined' ? `${window.location.origin}/q/` : '/q/'
  const publicUrl = primaryLink ? `${publicBase}${primaryLink.slug}` : ''

  const openSlugModal = async (publishAfterSave: boolean) => {
    if (publishAfterSave && hasAnswerMappingIssues) {
      setAnswerValidationModalOpen(true)
      return
    }
    setPublishAfterSlugSave(publishAfterSave)
    const existingSlug = primaryLink?.slug?.trim()
    if (existingSlug) {
      setSlugHint(primaryLink.link_name || quiz.name)
      setSlugValue(existingSlug)
      setSlugModalOpen(true)
      return
    }
    const hint = quiz.name.trim() || 'Quiz link'
    setSlugHint(hint)
    try {
      const suggestion = await suggestQuizLinkSlug(quizId, hint)
      setSlugValue(suggestion.slug || '')
    } catch {
      setSlugValue(hint.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    }
    setSlugModalOpen(true)
  }

  const saveSlug = async () => {
    const cleanSlug = slugValue.trim().toLowerCase()
    if (!cleanSlug) {
      setError('URL slug is required')
      return
    }
    setSlugSaving(true)
    setError('')
    try {
      if (primaryLink) {
        await updateQuizLink(primaryLink.id, { slug: cleanSlug, link_name: slugHint.trim() || primaryLink.link_name })
      } else {
        await createQuizLink(quizId, {
          link_name: slugHint.trim() || quiz.name || 'Quiz link',
          slug: cleanSlug,
          status: 'active',
          default_language: editLang,
        })
      }
      await loadLinks()
      setMessage('Public URL updated')
      setSlugModalOpen(false)
      if (publishAfterSlugSave) {
        await handlePublish()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save slug')
    } finally {
      setSlugSaving(false)
      setPublishAfterSlugSave(false)
    }
  }

  if (loading && !quiz) {
    return <p className="admin-pagination-text">Loading builder…</p>
  }

  if (!quiz) {
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
  const previewQuestion = quiz.questions.find((q) => q.id === previewQuestionId) ?? null
  const previewResult = customResults.find((r) => r.id === previewResultId) ?? null
  const duplicateSourceQuestion =
    quiz.questions.find((q) => q.id === duplicateSourceQuestionId) ?? null
  const duplicateTargetChoices = duplicateSourceQuestion
    ? quiz.questions.filter((q) => q.id !== duplicateSourceQuestion.id)
    : []
  const optionChoicesByQuestion = new Map(
    quiz.questions.map((q) => [q.question_key, collectQuestionOptionChoices(q, editLang)] as const)
  )
  const firstQuestionWithOptions = quiz.questions.find(
    (q) => (optionChoicesByQuestion.get(q.question_key)?.length ?? 0) > 0
  )
  const resultRuleIssues = new Map<string, string[]>(
    customResults.map((rule) => {
      const issues: string[] = []
      const conditionQuestionKeys = new Set(rule.conditions.map((c) => c.questionKey))
      const availableQuestionKeys = new Set(quiz.questions.map((q) => q.question_key))

      if (rule.conditions.length === 0) {
        issues.push('No conditions set.')
      }

      for (const cond of rule.conditions) {
        if (cond.languageCode?.trim()) {
          const known = quiz.languages.some((l) => l.language_code === cond.languageCode)
          if (!known) {
            issues.push(`Language "${cond.languageCode}" is not configured on this quiz.`)
          }
        }
        if (!availableQuestionKeys.has(cond.questionKey)) {
          issues.push(`Question "${cond.questionKey}" no longer exists.`)
          continue
        }
        const availableOptions = optionChoicesByQuestion.get(cond.questionKey) ?? []
        if (!availableOptions.some((opt) => opt.key === cond.optionKey)) {
          issues.push(`Option "${cond.optionKey}" for "${cond.questionKey}" is missing or changed.`)
        }
      }

      for (const q of quiz.questions) {
        const options = optionChoicesByQuestion.get(q.question_key) ?? []
        if (options.length === 0) continue
        if (!conditionQuestionKeys.has(q.question_key)) {
          issues.push(`Missing condition for question "${questionDisplayName(q, editLang)}".`)
        }
      }

      const seenConditionKeys = new Set<string>()
      for (const cond of rule.conditions) {
        const signature = `${cond.languageCode || '*'}:${cond.questionKey}`
        if (seenConditionKeys.has(signature)) {
          issues.push(
            `Question "${cond.questionKey}"${cond.languageCode ? ` for ${cond.languageCode}` : ''} is mapped more than once in this rule.`
          )
        }
        seenConditionKeys.add(signature)
      }

      return [rule.id, uniqueConditionIssueMessages(issues)] as const
    })
  )
  const invalidResultRuleIds = customResults
    .filter((rule) => (resultRuleIssues.get(rule.id)?.length ?? 0) > 0)
    .map((rule) => rule.id)
  const invalidResultRules = customResults.filter((rule) => invalidResultRuleIds.includes(rule.id))
  const hasAnswerMappingIssues = invalidResultRuleIds.length > 0

  return (
    <div className="admin-page admin-builder">
      <header className="admin-page-header">
        <Link to="/admin/quizzes" className="admin-link-back">
          ← Back to quizzes
        </Link>
        <div className="admin-page-header-row">
          <h1 className="admin-page-title">{quiz.name}</h1>
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
            onClick={() => void openSlugModal(true)}
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

      <section className="admin-link-quickbar" aria-label="Public link">
        <div className="admin-link-quickbar-main">
          <p className="admin-link-quickbar-label">Public URL</p>
          {publicUrl ? (
            <a className="admin-link-quickbar-url" href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            <p className="admin-link-quickbar-empty">No public URL yet. Add one on publish.</p>
          )}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--small"
          onClick={() => void openSlugModal(false)}
        >
          {publicUrl ? 'Edit slug' : 'Set slug'}
        </button>
      </section>

      <AdminQuizBuilderTabs
        quizId={quizId}
        active={activeTab}
        answersWarningCount={invalidResultRuleIds.length}
      />

      {activeTab === 'questions' && (
        <section className="admin-panel admin-builder-tab-panel" id="builder-questions">
          <div className="admin-panel-title-row">
            <h2 className="admin-section-title">Questions ({quiz.questions.length})</h2>
            <div className="admin-question-panel-actions">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => setAddQuestionOpen(true)}
              >
                + Add question
              </button>
            </div>
          </div>

          <p className="admin-muted">
            Drag rows to set quiz flow order. Users see questions top to bottom; the last question goes to
            results on Next.
          </p>

          {quiz.questions.length === 0 ? (
            <div className="admin-empty-hero">
              <p className="admin-empty-hero-title">No questions yet</p>
              <p className="admin-muted">Use <strong>+ Add question</strong> above to create your first screen.</p>
            </div>
          ) : (
            <QuestionOrderTable
              quizId={quizId}
              questions={quiz.questions}
              editLang={editLang}
              onQuizUpdated={applyQuiz}
              onError={setError}
              onMessage={setMessage}
              onPreview={setPreviewQuestionId}
              onDuplicate={(sourceId) => {
                const firstTarget = quiz.questions.find((cand) => cand.id !== sourceId)
                setDuplicateSourceQuestionId(sourceId)
                setDuplicateTargetQuestionId(firstTarget?.id ?? null)
              }}
              onDelete={(q) => {
                if (!window.confirm(`Delete "${questionDisplayName(q, editLang)}"?`)) return
                void deleteQuestion(q.id).then((r) => {
                  applyQuiz(r.quiz)
                  setMessage('Question deleted')
                })
              }}
            />
          )}
        </section>
      )}

      {activeTab === 'languages' && (
        <div className="admin-builder-grid">
          <div className="admin-builder-column">
            <QuizLanguagesPanel
              quiz={quiz}
              quizId={quizId}
              editLang={editLang}
              onEditLangChange={setEditLang}
              onQuizUpdated={applyQuiz}
              onError={setError}
              onMessage={setMessage}
            />
          </div>
        </div>
      )}

      {activeTab === 'answers' && (
        <section className="admin-panel admin-builder-tab-panel" id="builder-answers">
          <div className="admin-panel-title-row">
            <h2 className="admin-section-title">Answers &amp; custom results ({customResults.length})</h2>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => {
                const firstQuestion = firstQuestionWithOptions
                const firstOption = firstQuestion
                  ? optionChoicesByQuestion.get(firstQuestion.question_key)?.[0]
                  : undefined
                setEditingResultId('new')
                setResultDraft(
                  sanitizeResultRuleConditions(
                    {
                      ...emptyResultDraft(),
                      conditions:
                        firstQuestion && firstOption
                          ? [
                              {
                                questionKey: firstQuestion.question_key,
                                optionKey: firstOption.key,
                              },
                            ]
                          : [],
                    },
                    quiz.questions,
                    editLang
                  )
                )
              }}
            >
              + Add result
            </button>
          </div>
          <p className="admin-muted">
            Define result rules by mapping question option selections to a custom result outcome.
            Conditions default to <strong>Any language</strong>. Only set a specific language when that
            result should appear for one language only (e.g. Chinese copy vs English copy).
          </p>

          {customResults.length === 0 ? (
            <div className="admin-empty-hero">
              <p className="admin-empty-hero-title">No answer rules yet</p>
              <p className="admin-muted">Create your first result rule with + Add result.</p>
            </div>
          ) : (
            <div className="admin-table-wrap admin-question-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Conditions</th>
                    <th>Result</th>
                    <th className="admin-question-table-col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customResults.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        {(resultRuleIssues.get(rule.id)?.length ?? 0) > 0 ? (
                          <span
                            className="admin-answer-warning-icon"
                            title={(resultRuleIssues.get(rule.id) || []).join(' ')}
                          >
                            ⚠
                          </span>
                        ) : null}
                        {rule.name || 'Untitled rule'}
                      </td>
                      <td>{rule.conditions.length} condition(s)</td>
                      <td>{rule.resultTitle || 'Untitled result'}</td>
                      <td className="admin-question-table-col-action">
                        <TableRowActionsMenu
                          ariaLabel={`Actions for result ${rule.name || rule.id}`}
                          items={[
                            {
                              key: 'view',
                              label: 'View design',
                              disabled: !isResultScreenDesigned(rule),
                              title: isResultScreenDesigned(rule)
                                ? 'Preview result screen design'
                                : 'Design this result screen first to enable preview',
                              onClick: () => setPreviewResultId(rule.id),
                            },
                            {
                              key: 'design',
                              label: 'Design',
                              href: `/admin/quizzes/${quizId}/builder/answers/design/${rule.id}`,
                              target: '_blank',
                              rel: 'noopener noreferrer',
                            },
                            {
                              key: 'edit',
                              label: 'Edit',
                              onClick: () => {
                                setEditingResultId(rule.id)
                                setResultDraft(
                                  sanitizeResultRuleConditions(
                                    JSON.parse(JSON.stringify(rule)) as CustomResultRule,
                                    quiz.questions,
                                    editLang
                                  )
                                )
                              },
                            },
                            {
                              key: 'delete',
                              label: 'Delete',
                              variant: 'danger',
                              onClick: () => {
                                if (!window.confirm(`Delete result rule "${rule.name || 'Untitled'}"?`)) return
                                setCustomResults((prev) => {
                                  const next = prev.filter((r) => r.id !== rule.id)
                                  return next
                                })
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <div className="admin-builder-grid">
        <div className="admin-builder-column">
          <section className="admin-panel admin-builder-tab-panel" id="builder-details">
            <h2 className="admin-section-title">Quiz details</h2>
            <label>Name</label>
            <input
              className="admin-input"
              value={details.name}
              onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
            />
            <label>Description</label>
            <textarea
              className="admin-input admin-textarea"
              value={details.description}
              onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
            />
            <p className="admin-muted" style={{ marginTop: 8 }}>
              Configure result screens on the <strong>Answers</strong> tab. Students see those results when they
              finish a published quiz at your public link.
            </p>
            <button type="button" className="admin-btn" style={{ marginTop: 12 }} onClick={() => void handleSaveDetails()}>
              Save details
            </button>
          </section>
        </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="admin-builder-tab-panel-wrap">
      <AdminQuizLinksPanel
        quizId={quizId}
        quizName={quiz.name}
        quizStatus={quiz.status}
        defaultLanguage={editLang}
        onMessage={setMessage}
        onError={setError}
      />
        </div>
      )}

      <AddQuestionModal
        open={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onSubmit={handleAddQuestion}
      />

      <QuestionDesignPreviewModal
        open={previewQuestionId != null}
        onClose={() => setPreviewQuestionId(null)}
        question={previewQuestion}
        allQuestions={quiz.questions}
        customResults={customResults}
        customFont={quiz.custom_font}
        languageCode={editLang}
        onPreviewQuestionChange={setPreviewQuestionId}
      />

      <ResultDesignPreviewModal
        open={previewResultId != null}
        onClose={() => setPreviewResultId(null)}
        rule={previewResult}
        customFont={quiz.custom_font}
      />

      {duplicateSourceQuestion ? (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-design-title"
          onClick={() => {
            if (duplicating) return
            setDuplicateSourceQuestionId(null)
            setDuplicateTargetQuestionId(null)
          }}
        >
          <div className="admin-modal admin-modal--compact" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-header">
              <h3 id="duplicate-design-title" className="admin-section-title">
                Duplicate design
              </h3>
            </header>
            <div className="admin-modal-body">
              <p className="admin-muted" style={{ marginTop: 0 }}>
                Copy design from <strong>{questionDisplayName(duplicateSourceQuestion, editLang)}</strong> to:
              </p>
              <label className="admin-inspector-field" style={{ marginBottom: 0 }}>
                <span className="admin-inspector-label">Target question</span>
                <select
                  className="admin-select admin-inspector-input"
                  value={duplicateTargetQuestionId ?? ''}
                  onChange={(e) => setDuplicateTargetQuestionId(Number(e.target.value) || null)}
                  disabled={duplicating}
                >
                  {duplicateTargetChoices.map((q) => (
                    <option key={q.id} value={q.id}>
                      {questionDisplayName(q, editLang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-modal-actions" style={{ padding: '0 20px 20px' }}>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  if (duplicating) return
                  setDuplicateSourceQuestionId(null)
                  setDuplicateTargetQuestionId(null)
                }}
                disabled={duplicating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={!duplicateTargetQuestionId || duplicating}
                onClick={() => {
                  if (!duplicateTargetQuestionId) return
                  setDuplicating(true)
                  void updateQuestionLayout(duplicateTargetQuestionId, {
                    layout_json: { ...duplicateSourceQuestion.layout },
                    layout_type: duplicateSourceQuestion.layout_type?.trim()
                      ? duplicateSourceQuestion.layout_type
                      : undefined,
                  })
                    .then((res) => {
                      applyQuiz(res.quiz)
                      const target = quiz.questions.find((q) => q.id === duplicateTargetQuestionId)
                      setMessage(
                        `Design duplicated to ${target ? questionDisplayName(target, editLang) : 'target question'}`
                      )
                      setDuplicateSourceQuestionId(null)
                      setDuplicateTargetQuestionId(null)
                    })
                    .catch((e) => {
                      setError(e instanceof Error ? e.message : 'Failed to duplicate design')
                    })
                    .finally(() => setDuplicating(false))
                }}
              >
                {duplicating ? 'Duplicating…' : 'Duplicate design'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resultDraft && editingResultId ? (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-result-rule-title"
          onClick={() => {
            setEditingResultId(null)
            setResultDraft(null)
          }}
        >
          <div className="admin-modal admin-modal--add-question" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-header">
              <h3 id="custom-result-rule-title" className="admin-section-title">
                {editingResultId === 'new' ? 'Add result rule' : 'Edit result rule'}
              </h3>
            </header>
            <div className="admin-modal-body">
              <label className="admin-inspector-field">
                <span className="admin-inspector-label">Rule name</span>
                <input
                  className="admin-input admin-inspector-input"
                  value={resultDraft.name}
                  onChange={(e) => setResultDraft({ ...resultDraft, name: e.target.value })}
                />
              </label>
              <label className="admin-inspector-field">
                <span className="admin-inspector-label">Result title</span>
                <input
                  className="admin-input admin-inspector-input"
                  value={resultDraft.resultTitle}
                  onChange={(e) => setResultDraft({ ...resultDraft, resultTitle: e.target.value })}
                />
              </label>
              <label className="admin-inspector-field">
                <span className="admin-inspector-label">Result description</span>
                <textarea
                  className="admin-input admin-textarea admin-inspector-input"
                  value={resultDraft.resultDescription}
                  onChange={(e) => setResultDraft({ ...resultDraft, resultDescription: e.target.value })}
                />
              </label>
              <p className="admin-muted admin-inspector-note">
                After saving, use <strong>Design</strong> in the table to build the result screen layout.
              </p>
              <h4 className="admin-section-subtitle">Conditions</h4>
              {resultDraft.conditions.map((cond, idx) => {
                const q = quiz.questions.find((x) => x.question_key === cond.questionKey)
                const options = optionChoicesByQuestion.get(cond.questionKey) ?? []
                const optionSelectValue = resolveConditionOptionKey(cond.optionKey, options)
                return (
                  <div key={`condition-${idx}`} className="admin-custom-result-condition-row">
                    {quiz.languages.length > 0 ? (
                      <label className="admin-inspector-field">
                        <span className="admin-inspector-label">Language</span>
                        <select
                          className="admin-select admin-inspector-input"
                          value={cond.languageCode || ''}
                          onChange={(e) =>
                            setResultDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    conditions: prev.conditions.map((c, i) =>
                                      i === idx
                                        ? {
                                            ...c,
                                            languageCode: e.target.value.trim() || undefined,
                                          }
                                        : c
                                    ),
                                  }
                                : prev
                            )
                          }
                        >
                          <option value="">Any language</option>
                          {quiz.languages.map((lang) => (
                            <option key={lang.id} value={lang.language_code}>
                              {lang.language_name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="admin-inspector-field">
                      <span className="admin-inspector-label">Question</span>
                      <select
                        className="admin-select admin-inspector-input"
                        value={cond.questionKey}
                        onChange={(e) => {
                          const nextQuestionKey = e.target.value
                          const nextOptions = optionChoicesByQuestion.get(nextQuestionKey) ?? []
                          const nextOption = resolveConditionOptionKey('', nextOptions)
                          setResultDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  conditions: prev.conditions.map((c, i) =>
                                    i === idx
                                      ? {
                                          ...c,
                                          questionKey: nextQuestionKey,
                                          optionKey: nextOption,
                                        }
                                      : c
                                  ),
                                }
                              : prev
                          )
                        }}
                      >
                        {quiz.questions.map((qq) => (
                          <option key={qq.id} value={qq.question_key}>
                            {questionDisplayName(qq, editLang)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-inspector-field">
                      <span className="admin-inspector-label">Option</span>
                      <select
                        className="admin-select admin-inspector-input"
                        value={optionSelectValue}
                        disabled={options.length === 0}
                        onChange={(e) =>
                          setResultDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  conditions: prev.conditions.map((c, i) =>
                                    i === idx
                                      ? {
                                          ...c,
                                          optionKey: resolveConditionOptionKey(e.target.value, options),
                                        }
                                      : c
                                  ),
                                }
                              : prev
                          )
                        }
                      >
                        {options.length === 0 ? (
                          <option value="">No options — design choices on this question first</option>
                        ) : (
                          options.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-custom-result-remove-btn"
                      onClick={() =>
                        setResultDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                conditions: prev.conditions.filter((_, i) => i !== idx),
                              }
                            : prev
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                className="admin-btn admin-custom-result-add-condition-btn"
                onClick={() => {
                  const q = firstQuestionWithOptions
                  const option = q ? optionChoicesByQuestion.get(q.question_key)?.[0] : undefined
                  if (!q || !option) {
                    setError('Add at least one option to any question before adding a condition')
                    return
                  }
                  setResultDraft((prev) =>
                    prev
                      ? sanitizeResultRuleConditions(
                          {
                            ...prev,
                            conditions: [
                              ...prev.conditions,
                              {
                                questionKey: q.question_key,
                                optionKey: option.key,
                              },
                            ],
                          },
                          quiz.questions,
                          editLang
                        )
                      : prev
                  )
                }}
                disabled={!firstQuestionWithOptions}
                title={
                  firstQuestionWithOptions
                    ? 'Add another condition'
                    : 'Create options in your questions first'
                }
              >
                + Add condition
              </button>
              {!firstQuestionWithOptions ? (
                <p className="admin-muted admin-inspector-note admin-custom-result-add-condition-note">
                  Add questions with options first, then you can add conditions here.
                </p>
              ) : null}
            </div>
            <div className="admin-modal-actions admin-custom-result-actions" style={{ padding: '0 20px 20px' }}>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setEditingResultId(null)
                  setResultDraft(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => {
                  if (!resultDraft.name.trim()) {
                    setError('Result rule name is required')
                    return
                  }
                  if (!resultDraft.resultTitle.trim()) {
                    setError('Result title is required')
                    return
                  }
                  if (resultDraft.conditions.length === 0) {
                    setError('Add at least one condition')
                    return
                  }
                  setCustomResults((prev) => {
                    const next =
                      editingResultId === 'new'
                        ? [...prev, resultDraft]
                        : prev.map((r) => (r.id === editingResultId ? resultDraft : r))
                    return next
                  })
                  setMessage('Answer logic saved')
                  setEditingResultId(null)
                  setResultDraft(null)
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {answerValidationModalOpen ? (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="answers-remap-title"
          onClick={() => setAnswerValidationModalOpen(false)}
        >
          <div className="admin-modal admin-modal--compact" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-header">
              <h3 id="answers-remap-title" className="admin-section-title">
                Publish blocked: answers need remapping
              </h3>
            </header>
            <div className="admin-modal-body">
              <p className="admin-muted" style={{ marginTop: 0 }}>
                Questions or options changed, so some custom result rules no longer match the active quiz.
                Fix each affected rule in <strong>Answers</strong> before publishing.
              </p>
              <ul className="admin-answer-validation-list">
                {invalidResultRules.map((rule) => (
                  <li key={rule.id}>
                    <strong>{rule.name || rule.resultTitle || rule.id}</strong>
                    <ul>
                      {(resultRuleIssues.get(rule.id) || []).map((msg) => (
                        <li key={`${rule.id}-${msg}`}>{msg}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div className="admin-modal-actions" style={{ padding: '0 20px 20px' }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => {
                  setAnswerValidationModalOpen(false)
                  window.location.assign(`/admin/quizzes/${quizId}/builder?tab=answers`)
                }}
              >
                Go to Answers
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {slugModalOpen ? (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-slug-title"
          onClick={() => {
            if (slugSaving) return
            setSlugModalOpen(false)
            setPublishAfterSlugSave(false)
          }}
        >
          <div className="admin-modal admin-modal--compact" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-header">
              <h3 id="publish-slug-title" className="admin-section-title">
                {publishAfterSlugSave ? 'Publish quiz' : 'Edit public URL slug'}
              </h3>
            </header>
            <div className="admin-modal-body">
              <label className="admin-inspector-field">
                <span className="admin-inspector-label">URL slug hint</span>
                <input
                  className="admin-input admin-inspector-input"
                  value={slugHint}
                  onChange={(e) => setSlugHint(e.target.value)}
                  placeholder="e.g. Spring 2026 cohort"
                  disabled={slugSaving}
                />
              </label>
              <p className="admin-muted admin-inspector-note" style={{ marginTop: -8 }}>
                This is a friendly label for the link. It helps generate and identify your public URL.
              </p>
              <label className="admin-inspector-field">
                <span className="admin-inspector-label">Slug</span>
                <div className="admin-link-slug-row">
                  <span className="admin-link-slug-prefix">{publicBase}</span>
                  <input
                    className="admin-input admin-inspector-input"
                    value={slugValue}
                    onChange={(e) => setSlugValue(e.target.value)}
                    placeholder="your-quiz-slug"
                    disabled={slugSaving}
                  />
                </div>
              </label>
            </div>
            <div className="admin-modal-actions" style={{ padding: '0 20px 20px' }}>
              <button
                type="button"
                className="admin-btn"
                disabled={slugSaving}
                onClick={() => {
                  setSlugModalOpen(false)
                  setPublishAfterSlugSave(false)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={slugSaving || !slugValue.trim()}
                onClick={() => {
                  if (publishAfterSlugSave && hasAnswerMappingIssues) {
                    setAnswerValidationModalOpen(true)
                    return
                  }
                  void saveSlug()
                }}
              >
                {slugSaving ? 'Saving…' : publishAfterSlugSave ? 'Save & publish' : 'Save slug'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
