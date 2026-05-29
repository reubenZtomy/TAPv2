import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { updateQuizIntroLayout } from '../api'
import type { QuizBuilderPayload } from '../builderTypes'
import {
  applyScreenBackgroundToLayout,
  createLanguageSwitchElement,
  getLayoutElements,
  getScreenBackgroundSettings,
  layoutHasLanguageSwitch,
  type LayoutElement,
  type ScreenBackgroundSettings,
} from '../layoutTypes'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import { LayoutCanvasEditor } from './LayoutCanvasEditor'

export type IntroScreenDesignerHandle = {
  saveNow: () => Promise<void>
}

type IntroScreenDesignerProps = {
  quiz: QuizBuilderPayload
  seedLanguageSwitch?: boolean
  onQuizUpdated: (quiz: QuizBuilderPayload) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export const IntroScreenDesigner = React.forwardRef<IntroScreenDesignerHandle, IntroScreenDesignerProps>(
  function IntroScreenDesigner(
    { quiz, seedLanguageSwitch, onQuizUpdated, onError, onMessage }: IntroScreenDesignerProps,
    ref
  ) {
    const intro = quiz.intro_layout ?? {}
    const [elements, setElements] = useState<LayoutElement[]>(() => getLayoutElements(intro.elements))
    const [screenBackground, setScreenBackground] = useState<ScreenBackgroundSettings>(() =>
      getScreenBackgroundSettings(intro)
    )
    const [saving, setSaving] = useState(false)
    const [seedDone, setSeedDone] = useState(false)

    const screens = useMemo(() => [{ id: 'intro' as const, label: 'Intro / first screen' }], [])

    const syncFromIntro = useCallback(() => {
      setElements(getLayoutElements(quiz.intro_layout?.elements))
      setScreenBackground(getScreenBackgroundSettings(quiz.intro_layout))
    }, [quiz.intro_layout])

    useEffect(() => {
      syncFromIntro()
    }, [syncFromIntro])

    useEffect(() => {
      if (!seedLanguageSwitch || seedDone) return
      setElements((prev) => {
        if (layoutHasLanguageSwitch(prev)) return prev
        return [...prev, createLanguageSwitchElement()]
      })
      setSeedDone(true)
    }, [seedLanguageSwitch, seedDone])

    const saveLayout = async (nextElements: LayoutElement[], nextBackground: ScreenBackgroundSettings) => {
      setSaving(true)
      try {
        const introLayout: Record<string, unknown> = {
          ...(quiz.intro_layout as Record<string, unknown>),
          elements: nextElements,
        }
        applyScreenBackgroundToLayout(introLayout, nextBackground)
        const res = await updateQuizIntroLayout(quiz.id, introLayout)
        onQuizUpdated(res.quiz)
        onMessage('Intro layout saved')
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Failed to save intro layout')
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
      [elements, screenBackground, quiz]
    )

    return (
      <div className="admin-question-design-main">
        <LayoutCanvasEditor
          elements={elements}
          onElementsChange={setElements}
          onSave={(nextElements) => saveLayout(nextElements, screenBackground)}
          saving={saving}
          screens={screens}
          currentScreen="intro"
          questionIds={[]}
          screenBackground={screenBackground}
          onScreenBackgroundChange={setScreenBackground}
          quizId={quiz.id}
          customFont={quiz.custom_font}
          onQuizFontUpdated={onQuizUpdated}
          showDesignerRail
          languages={quiz.languages}
          previewLanguage={
            quiz.languages.find((l) => l.is_default)?.language_code ||
            quiz.languages[0]?.language_code
          }
        >
          <AdminDeviceFrame screenBackground={screenBackground} customFont={quiz.custom_font}>
            {elements.length === 0 ? (
              <div className="admin-layout-canvas-empty">
                <p className="admin-muted">Intro screen</p>
                <p className="admin-muted admin-layout-canvas-empty-hint">
                  Add a language switcher or other elements for the first screen of your quiz.
                </p>
              </div>
            ) : null}
          </AdminDeviceFrame>
        </LayoutCanvasEditor>
      </div>
    )
  }
)
