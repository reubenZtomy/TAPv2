import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  answersFromQuestionIds,
  isLayoutAnswerChoice,
  isResultScreenDesigned,
  matchCustomResultRule,
  resolveLayoutAnswerKey,
  type CustomResultRule,
} from '../customResults'
import { questionDisplayName } from '../builderDisplay'
import type { QuizQuestion } from '../builderTypes'
import {
  getLayoutElements,
  getScreenBackgroundSettings,
  isForwardNavigationAction,
  type ElementAction,
  type LayoutElement,
} from '../layoutTypes'
import { QuizLayoutScreen } from '../../layout/QuizLayoutScreen'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import type { QuizCustomFont } from '../../utils/quizFont'

type QuestionDesignPreviewModalProps = {
  open: boolean
  onClose: () => void
  question: QuizQuestion | null
  allQuestions: QuizQuestion[]
  customResults: CustomResultRule[]
  customFont?: QuizCustomFont | null
  languageCode: string
  onPreviewQuestionChange?: (questionId: number) => void
}

function isBackwardNavigationAction(action: ElementAction | undefined): boolean {
  if (!action || action.type === 'none') return false
  if (action.type === 'back' || action.type === 'previous') return true
  if (action.type === 'navigate' && action.target === 'previous') return true
  return false
}

export function QuestionDesignPreviewModal({
  open,
  onClose,
  question,
  allQuestions,
  customResults,
  customFont,
  languageCode,
  onPreviewQuestionChange,
}: QuestionDesignPreviewModalProps) {
  const flowStartIdRef = useRef<number | null>(null)
  const [atEnd, setAtEnd] = useState(false)
  const [pendingByQuestion, setPendingByQuestion] = useState<Record<number, string>>({})
  const [selectionError, setSelectionError] = useState('')

  useEffect(() => {
    if (!open) {
      flowStartIdRef.current = null
      setAtEnd(false)
      setPendingByQuestion({})
      setSelectionError('')
      return
    }
    if (question && flowStartIdRef.current === null) {
      flowStartIdRef.current = question.id
      setAtEnd(false)
    }
  }, [open, question])

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

  const previewAnswers = useMemo(
    () => answersFromQuestionIds(allQuestions, pendingByQuestion),
    [allQuestions, pendingByQuestion]
  )
  const matchedResult = useMemo(
    () =>
      atEnd
        ? matchCustomResultRule(customResults, previewAnswers, {
            selectedLanguage: languageCode,
            defaultLanguage: languageCode,
            knownLanguageCodes: allQuestions.flatMap((q) =>
              q.options.flatMap((o) => Object.keys(o.labels || {}))
            ),
            questions: allQuestions,
          })
        : null,
    [atEnd, customResults, previewAnswers, languageCode, allQuestions]
  )

  if (!open || !question) return null

  const lang = languageCode
  const title = questionDisplayName(question, lang)
  const elements = getLayoutElements(question.layout)
  const screenBackground = getScreenBackgroundSettings(question.layout)
  const questionIds = allQuestions.map((q) => q.id)
  const currentIdx = questionIds.indexOf(question.id)
  const startIdx = flowStartIdRef.current != null ? questionIds.indexOf(flowStartIdRef.current) : currentIdx
  const safeStartIdx = startIdx >= 0 ? startIdx : 0
  const totalQuestions = allQuestions.length
  const questionNumber = currentIdx >= 0 ? currentIdx + 1 : 1
  const matchedResultTitle =
    matchedResult?.name.trim() ||
    matchedResult?.resultTitle.trim() ||
    'Result'
  const matchedElements = matchedResult ? getLayoutElements(matchedResult.layout) : []
  const matchedScreenBackground = matchedResult
    ? getScreenBackgroundSettings(matchedResult.layout)
    : undefined

  const goToQuestion = (targetId: number) => {
    if (targetId === question.id) return
    setAtEnd(false)
    setSelectionError('')
    onPreviewQuestionChange?.(targetId)
  }

  const handleElementAction = (action: ElementAction, el: LayoutElement) => {
    const optionKey = resolveLayoutAnswerKey(el)

    if (isBackwardNavigationAction(action)) {
      if (atEnd) {
        setAtEnd(false)
        setSelectionError('')
        return
      }
      if (currentIdx <= safeStartIdx) return
      goToQuestion(questionIds[currentIdx - 1])
      return
    }

    if (isForwardNavigationAction(action)) {
      if (isLayoutAnswerChoice(el)) {
        if (optionKey) {
          setPendingByQuestion((prev) => ({ ...prev, [question.id]: optionKey }))
          setSelectionError('')
        }
        return
      }
      const selected = pendingByQuestion[question.id]
      if (!selected) {
        setSelectionError('Select an option first, then press Next.')
        return
      }
      setSelectionError('')
      if (currentIdx < 0 || currentIdx >= questionIds.length - 1) {
        setAtEnd(true)
        return
      }
      goToQuestion(questionIds[currentIdx + 1])
      return
    }

    if (action.type === 'navigate' && typeof action.target === 'number') {
      if (isLayoutAnswerChoice(el)) {
        if (optionKey) {
          setPendingByQuestion((prev) => ({ ...prev, [question.id]: optionKey }))
          setSelectionError('')
        }
        return
      }
      const targetIdx = questionIds.indexOf(action.target)
      if (targetIdx < safeStartIdx || targetIdx < 0) return
      if (targetIdx >= questionIds.length - 1 && action.target === questionIds[questionIds.length - 1]) {
        goToQuestion(action.target)
        return
      }
      if (targetIdx >= 0) {
        goToQuestion(action.target)
      }
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-design-preview-title"
    >
      <div className="admin-modal admin-modal--preview admin-modal--design-view">
        <header className="admin-modal-header">
          <h2 id="question-design-preview-title" className="admin-section-title">
            Preview — {atEnd ? matchedResultTitle : title}
          </h2>
          <button type="button" className="admin-btn" onClick={onClose} aria-label="Close preview">
            Close
          </button>
        </header>

        <p className="admin-muted admin-preview-flow-note">
          Preview mode follows quiz flow from question {safeStartIdx + 1} to the end.
        </p>

        <div className="admin-preview-modal-body admin-preview-modal-body--centered">
          <div className="admin-preview-device-fit">
            <div className="admin-preview-device-fit__inner">
          <AdminDeviceFrame
            screenBackground={atEnd ? matchedScreenBackground : screenBackground}
            customFont={customFont}
          >
            <div className="admin-preview-flow-shell">
              <div className="admin-preview-flow-badge" aria-live="polite">
                {atEnd ? `Question ${totalQuestions} of ${totalQuestions} · Results` : `Question ${questionNumber} of ${totalQuestions}`}
              </div>
              {selectionError ? (
                <p className="admin-preview-flow-selection-error">{selectionError}</p>
              ) : null}
              {atEnd ? (
                matchedResult && isResultScreenDesigned(matchedResult) ? (
                  <QuizLayoutScreen
                    elements={matchedElements}
                    screenBackground={matchedScreenBackground}
                    customFont={customFont}
                  />
                ) : matchedResult ? (
                  <div className="admin-preview-flow-end">
                    <p className="admin-preview-flow-end-title">Matched: {matchedResultTitle}</p>
                    <p className="admin-muted">
                      This result rule matched your answers, but the result screen has not been
                      designed yet. Use <strong>Design</strong> in Answers &amp; custom results.
                    </p>
                  </div>
                ) : customResults.length === 0 ? (
                  <div className="admin-preview-flow-end">
                    <p className="admin-preview-flow-end-title">End of quiz</p>
                    <p className="admin-muted">
                      Add result rules under Answers &amp; custom results to preview outcomes here.
                    </p>
                  </div>
                ) : (
                  <div className="admin-preview-flow-end">
                    <p className="admin-preview-flow-end-title">No matching result</p>
                    <p className="admin-muted">
                      Your preview selections did not match any saved result rule. Check that each
                      condition uses the same question keys and option keys as your layout buttons.
                    </p>
                  </div>
                )
              ) : elements.length === 0 ? (
                <div className="admin-preview-flow-end">
                  <p className="admin-muted">This screen has no designed elements yet.</p>
                  <p className="admin-muted admin-preview-flow-end-hint">
                    Use Next on a navigation element to continue the flow preview.
                  </p>
                </div>
              ) : (
                <QuizLayoutScreen
                  elements={elements}
                  screenBackground={screenBackground}
                  customFont={customFont}
                  onElementAction={handleElementAction}
                />
              )}
            </div>
          </AdminDeviceFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
