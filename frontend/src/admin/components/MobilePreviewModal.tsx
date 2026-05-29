import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { updateQuestionLayout, updateQuizIntroLayout } from '../api'
import type { QuizBuilderPayload, QuizQuestion } from '../builderTypes'
import {
  getLayoutElements,
  isIntroConfigured,
  type IntroLayout,
  type LayoutElement,
  type PreviewTarget,
  type ScreenOption,
  normalizeElements,
} from '../layoutTypes'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import { LayoutCanvasEditor } from './LayoutCanvasEditor'
import { QuizIntroPreview } from './QuizIntroPreview'
import { QuizQuestionPreview } from './QuizQuestionPreview'

type MobilePreviewModalProps = {
  open: boolean
  onClose: () => void
  quiz: QuizBuilderPayload
  languageCode: string
  initialTarget?: PreviewTarget
  onQuizUpdated: (quiz: QuizBuilderPayload) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export function MobilePreviewModal({
  open,
  onClose,
  quiz,
  languageCode,
  initialTarget = 'intro',
  onQuizUpdated,
  onError,
  onMessage,
}: MobilePreviewModalProps) {
  const [target, setTarget] = useState<PreviewTarget>(initialTarget)
  const [elements, setElements] = useState<LayoutElement[]>([])
  const [saving, setSaving] = useState(false)

  const lang =
    languageCode ||
    quiz.languages.find((l) => l.is_default)?.language_code ||
    'English'

  const languageNames = quiz.languages.map((l) => l.language_code)

  const questionIds = useMemo(() => quiz.questions.map((q) => q.id), [quiz.questions])

  const screens: ScreenOption[] = useMemo(
    () => [
      { id: 'intro', label: 'Intro' },
      ...quiz.questions.map((q) => ({ id: q.id as PreviewTarget, label: q.question_key })),
    ],
    [quiz.questions]
  )

  const selectedQuestion = useMemo(
    () =>
      typeof target === 'number' ? quiz.questions.find((q) => q.id === target) ?? null : null,
    [quiz.questions, target]
  )

  const syncElementsFromTarget = useCallback(() => {
    if (target === 'intro') {
      setElements(normalizeElements(quiz.intro_layout?.elements))
    } else if (selectedQuestion) {
      setElements(getLayoutElements(selectedQuestion.layout))
    } else {
      setElements([])
    }
  }, [target, quiz.intro_layout, selectedQuestion])

  useEffect(() => {
    if (!open) return
    setTarget(initialTarget)
  }, [open, initialTarget])

  useEffect(() => {
    if (!open) return
    syncElementsFromTarget()
  }, [open, syncElementsFromTarget])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('admin-preview-modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('admin-preview-modal-open')
    }
  }, [open, onClose])

  const saveLayout = async (nextElements: LayoutElement[]) => {
    setSaving(true)
    try {
      if (target === 'intro') {
        const intro: IntroLayout = {
          ...quiz.intro_layout,
          elements: nextElements,
        }
        const res = await updateQuizIntroLayout(quiz.id, intro as Record<string, unknown>)
        onQuizUpdated(res.quiz)
        onMessage('Intro layout saved')
      } else if (selectedQuestion) {
        const layout_json = {
          ...selectedQuestion.layout,
          elements: nextElements,
        }
        const res = await updateQuestionLayout(selectedQuestion.id, { layout_json })
        onQuizUpdated(res.quiz)
        onMessage(`Layout saved for ${selectedQuestion.question_key}`)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to save layout')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const selectTarget = (next: PreviewTarget) => {
    setTarget(next)
  }

  if (!open) return null

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mobile-preview-title">
      <div className="admin-modal admin-modal--preview">
        <header className="admin-modal-header">
          <h2 id="mobile-preview-title" className="admin-section-title">
            Mobile preview
          </h2>
          <button type="button" className="admin-btn" onClick={onClose} aria-label="Close preview">
            Close
          </button>
        </header>

        <div className="admin-preview-modal-body">
          <div className="admin-preview-modal-frame-col">
            <LayoutCanvasEditor
              elements={elements}
              onElementsChange={setElements}
              onSave={saveLayout}
              saving={saving}
              screens={screens}
              currentScreen={target}
              questionIds={questionIds}
              onNavigate={(next) => {
                setTarget(next)
                setMessage(`Preview: navigated to ${screens.find((s) => s.id === next)?.label ?? 'screen'}`)
              }}
            >
              <AdminDeviceFrame>
                {target === 'intro' ? (
                  <QuizIntroPreview
                    intro={{
                      ...quiz.intro_layout,
                      elements: undefined,
                    }}
                    quizName={quiz.name}
                    languages={languageNames}
                    languageCode={lang}
                  />
                ) : selectedQuestion ? (
                  <QuizQuestionPreview question={selectedQuestion} languageCode={lang} />
                ) : (
                  <p className="admin-muted">Select a screen</p>
                )}
              </AdminDeviceFrame>
            </LayoutCanvasEditor>
          </div>

          <aside className="admin-preview-modal-sidebar">
            <div className="admin-panel admin-preview-screen-list">
              <h3 className="admin-section-subtitle">Screens</h3>
              <p className="admin-muted">Tap a screen to preview it in the phone frame.</p>
              <ul>
                <li>
                  <button
                    type="button"
                    className={`admin-preview-screen-item ${target === 'intro' ? 'is-active' : ''}`}
                    onClick={() => selectTarget('intro')}
                  >
                    <span className="admin-preview-screen-label">Intro</span>
                    <span className="admin-muted">
                      {isIntroConfigured(quiz.intro_layout) ? 'Title & start' : 'Not configured'}
                    </span>
                  </button>
                </li>
                {quiz.questions.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      className={`admin-preview-screen-item ${target === q.id ? 'is-active' : ''}`}
                      onClick={() => selectTarget(q.id)}
                    >
                      <span className="admin-preview-screen-label">{q.question_key}</span>
                      <span className="admin-muted">{q.layout_type.replace(/_/g, ' ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {quiz.questions.length === 0 ? (
                <p className="admin-muted">Add questions in the builder to preview them here.</p>
              ) : null}
            </div>

            {target === 'intro' ? (
              <div className="admin-panel">
                <h3 className="admin-section-subtitle">Intro copy ({lang})</h3>
                <p className="admin-muted">
                  Edit heading in Quiz details for now. Use the Editor panel (left of the phone) for
                  overlay design.
                </p>
              </div>
            ) : selectedQuestion ? (
              <QuestionSidebarHint question={selectedQuestion} lang={lang} />
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}

function QuestionSidebarHint({ question, lang }: { question: QuizQuestion; lang: string }) {
  const t = question.translations[lang]
  return (
    <div className="admin-panel">
      <h3 className="admin-section-subtitle">{question.question_key}</h3>
      <p className="admin-muted">
        <strong>{t?.title || '—'}</strong>
        <br />
        {question.options.length} option(s) · {question.layout_type}
      </p>
      <p className="admin-muted">
        Edit title and options in the builder panel. Add overlays with + Text box / + Image, then
        fine-tune in the Editor panel left of the phone.
      </p>
    </div>
  )
}
