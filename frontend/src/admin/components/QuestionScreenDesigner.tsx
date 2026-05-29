import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateQuestionLayout } from '../api'
import { buildQuestionLayoutJson, questionDisplayName } from '../builderDisplay'
import type { QuizBuilderPayload, QuizQuestion } from '../builderTypes'
import {
  getLayoutElements,
  getScreenBackgroundSettings,
  type LayoutElement,
  type PreviewTarget,
  type ScreenBackgroundSettings,
  type ScreenOption,
} from '../layoutTypes'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import { LayoutCanvasEditor } from './LayoutCanvasEditor'

export type QuestionScreenDesignerHandle = {
  /** Persist current in-memory layout/background to the backend. */
  saveNow: () => Promise<void>
}

type QuestionScreenDesignerProps = {
  quiz: QuizBuilderPayload
  question: QuizQuestion
  languageCode: string
  onQuizUpdated: (quiz: QuizBuilderPayload) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export const QuestionScreenDesigner = React.forwardRef<QuestionScreenDesignerHandle, QuestionScreenDesignerProps>(
  function QuestionScreenDesigner(
    { quiz, question, languageCode, onQuizUpdated, onError, onMessage }: QuestionScreenDesignerProps,
    ref
  ) {
  const navigate = useNavigate()
  const [elements, setElements] = useState<LayoutElement[]>(() => getLayoutElements(question.layout))
  const [screenBackground, setScreenBackground] = useState<ScreenBackgroundSettings>(() =>
    getScreenBackgroundSettings(question.layout)
  )
  const [saving, setSaving] = useState(false)

  const lang =
    languageCode ||
    quiz.languages.find((l) => l.is_default)?.language_code ||
    quiz.languages[0]?.language_code ||
    'English'

  const questionIds = useMemo(() => quiz.questions.map((q) => q.id), [quiz.questions])

  const screens: ScreenOption[] = useMemo(
    () => quiz.questions.map((q) => ({ id: q.id as PreviewTarget, label: questionDisplayName(q, lang) })),
    [quiz.questions, lang]
  )

  const syncFromQuestion = useCallback(() => {
    setElements(getLayoutElements(question.layout))
    setScreenBackground(getScreenBackgroundSettings(question.layout))
  }, [question.layout])

  useEffect(() => {
    syncFromQuestion()
  }, [question.id, syncFromQuestion])

  const saveLayout = async (nextElements: LayoutElement[], nextBackground: ScreenBackgroundSettings) => {
    setSaving(true)
    try {
      const layout_json = buildQuestionLayoutJson(question, nextElements, nextBackground)
      const res = await updateQuestionLayout(question.id, { layout_json })
      onQuizUpdated(res.quiz)
      onMessage(`Layout saved for ${questionDisplayName(question, lang)}`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to save layout')
      throw e
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      saveNow: async () => {
        await saveLayout(elements, screenBackground)
      },
    }),
    [elements, screenBackground]
  )

  const goToQuestion = (target: PreviewTarget) => {
    if (typeof target === 'number' && target !== question.id) {
      navigate(`/admin/quizzes/${quiz.id}/builder/design/${target}`)
    }
  }

  return (
    <div className="admin-question-design-main">
      <LayoutCanvasEditor
        elements={elements}
        onElementsChange={setElements}
        onSave={(nextElements) => saveLayout(nextElements, screenBackground)}
        saving={saving}
        screens={screens}
        currentScreen={question.id}
        questionIds={questionIds}
        questionOptions={question.options.map((opt) => ({
          key: opt.option_key,
          label: opt.labels[lang] || opt.option_key,
        }))}
        screenBackground={screenBackground}
        onScreenBackgroundChange={(next) => {
          setScreenBackground(next)
        }}
        quizId={quiz.id}
        customFont={quiz.custom_font}
        onQuizFontUpdated={onQuizUpdated}
        onNavigate={goToQuestion}
        showDesignerRail
      >
        <AdminDeviceFrame screenBackground={screenBackground} customFont={quiz.custom_font}>
          {elements.length === 0 ? (
            <div className="admin-layout-canvas-empty">
              <p className="admin-muted">Empty screen</p>
              <p className="admin-muted admin-layout-canvas-empty-hint">
                Drag or double-click components from the panel to build this question.
              </p>
            </div>
          ) : null}
        </AdminDeviceFrame>
      </LayoutCanvasEditor>
    </div>
  )
  }
)
