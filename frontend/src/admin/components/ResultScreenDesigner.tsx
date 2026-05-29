import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { buildResultLayoutJson, resolveResultLayoutSource, type CustomResultRule } from '../customResults'
import type { QuizBuilderPayload, QuizLanguage } from '../builderTypes'
import type { QuizCustomFont } from '../../utils/quizFont'
import {
  getLayoutElements,
  getScreenBackgroundSettings,
  type LayoutElement,
  type ScreenBackgroundSettings,
} from '../layoutTypes'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import { LayoutCanvasEditor } from './LayoutCanvasEditor'

export type ResultScreenDesignerHandle = {
  saveNow: () => Promise<void>
}

type ResultScreenDesignerProps = {
  quizId: number
  customFont?: QuizCustomFont | null
  onQuizFontUpdated?: (quiz: QuizBuilderPayload) => void
  rule: CustomResultRule
  designLanguage?: string
  defaultLanguage?: string
  languages?: QuizLanguage[]
  onLayoutSaved: (layout: Record<string, unknown>) => void
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export const ResultScreenDesigner = React.forwardRef<ResultScreenDesignerHandle, ResultScreenDesignerProps>(
  function ResultScreenDesigner(
    {
      quizId,
      customFont,
      onQuizFontUpdated,
      rule,
      designLanguage = 'English',
      defaultLanguage = 'English',
      languages = [],
      onLayoutSaved,
      onError,
      onMessage,
    },
    ref
  ) {
    const layoutSource = resolveResultLayoutSource(rule, designLanguage, defaultLanguage)
    const [elements, setElements] = useState<LayoutElement[]>(() => getLayoutElements(layoutSource))
    const [screenBackground, setScreenBackground] = useState<ScreenBackgroundSettings>(() =>
      getScreenBackgroundSettings(layoutSource)
    )
    const [saving, setSaving] = useState(false)

    const syncFromRule = useCallback(() => {
      const nextLayout = resolveResultLayoutSource(rule, designLanguage, defaultLanguage)
      setElements(getLayoutElements(nextLayout))
      setScreenBackground(getScreenBackgroundSettings(nextLayout))
    }, [rule, designLanguage, defaultLanguage])

    useEffect(() => {
      syncFromRule()
    }, [rule.id, designLanguage, syncFromRule])

    const saveLayout = async (nextElements: LayoutElement[], nextBackground: ScreenBackgroundSettings) => {
      setSaving(true)
      try {
        const layout_json = buildResultLayoutJson(nextElements, nextBackground)
        onLayoutSaved(layout_json)
        onMessage(`Result screen saved for ${rule.name.trim() || rule.resultTitle || 'result'}`)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Failed to save result screen')
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
      [elements, screenBackground, rule.id]
    )

    const screenLabel = rule.name.trim() || rule.resultTitle.trim() || 'Result screen'

    return (
      <div className="admin-question-design-main">
        <LayoutCanvasEditor
          elements={elements}
          onElementsChange={setElements}
          onSave={(nextElements) => saveLayout(nextElements, screenBackground)}
          saving={saving}
          screens={[{ id: 0, label: screenLabel }]}
          currentScreen={0}
          questionIds={[]}
          questionOptions={[]}
          screenBackground={screenBackground}
          onScreenBackgroundChange={setScreenBackground}
          quizId={quizId}
          customFont={customFont}
          onQuizFontUpdated={onQuizFontUpdated}
          showDesignerRail
          languages={languages}
          previewLanguage={designLanguage}
        >
          <AdminDeviceFrame screenBackground={screenBackground} customFont={customFont}>
            {elements.length === 0 ? (
              <div className="admin-layout-canvas-empty">
                <p className="admin-muted">Empty result screen</p>
                <p className="admin-muted admin-layout-canvas-empty-hint">
                  Drag or double-click components from the panel to build this result.
                </p>
              </div>
            ) : null}
          </AdminDeviceFrame>
        </LayoutCanvasEditor>
      </div>
    )
  }
)
