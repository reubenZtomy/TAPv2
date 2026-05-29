import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DeviceFrame } from './components/DeviceFrame'
import { DynamicQuestionScreen } from './screens/DynamicQuestionScreen'
import type { PublicQuizPayload } from './PublicQuizRoute'
import {
  getLayoutElements,
  isIntroConfigured,
  isForwardNavigationAction,
  actionRecordsAnswer,
  resolveActionNavigation,
  isLayoutAnswerChoice,
  type ElementAction,
  type LayoutElement,
  type PreviewTarget,
} from './admin/layoutTypes'
import { QuizLayoutScreen } from './layout/QuizLayoutScreen'
import { TitleScreen } from './screens/TitleScreen'
import { QuizContent } from './types/quizContent'
import { nextQuestionKey, prevQuestionKey } from './utils/quizFlow'
import { loadCustomResults, resolveLayoutAnswerKey, type CustomResultRule } from './admin/customResults'

type QuizAnswers = Record<string, string>

type ScreenId = 'title' | 'layout' | 'dynamic' | 'customResult' | 'complete' | 'noResult'

type PublicQuizAppProps = {
  publicQuiz: PublicQuizPayload
}

export function PublicQuizApp({ publicQuiz }: PublicQuizAppProps) {
  const normalizeKey = (value: string | undefined): string => (value || '').trim().toLowerCase()

  const conditionMatches = (answers: QuizAnswers, questionKey: string, expected: string | undefined): boolean =>
    normalizeKey(answers[questionKey]) === normalizeKey(expected)

  const questionOrder = useMemo(
    () => publicQuiz.question_order ?? [],
    [publicQuiz.question_order]
  )

  const questionsLayout = useMemo(() => publicQuiz.questions_layout ?? [], [publicQuiz.questions_layout])
  const layoutQuestionIds = useMemo(() => questionsLayout.map((q) => q.id), [questionsLayout])
  const introLayoutElements = useMemo(
    () => getLayoutElements(publicQuiz.intro_layout?.elements),
    [publicQuiz.intro_layout]
  )
  const useIntroLayoutOverlay = introLayoutElements.length > 0
  const introConfigured = useMemo(() => isIntroConfigured(publicQuiz.intro_layout), [publicQuiz.intro_layout])
  const customFont = publicQuiz.custom_font ?? null

  const [screen, setScreen] = useState<ScreenId>('title')
  const [layoutTarget, setLayoutTarget] = useState<PreviewTarget>('intro')
  const [dynamicQuestionKey, setDynamicQuestionKey] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [quizContent, setQuizContent] = useState<QuizContent | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({})
  const [customResultRule, setCustomResultRule] = useState<CustomResultRule | null>(null)
  const [layoutPendingAnswers, setLayoutPendingAnswers] = useState<Record<string, string>>({})
  const [layoutSelectionError, setLayoutSelectionError] = useState('')

  const getQuestionText = (key: string, fallback: string) => {
    const questions = quizContent?.questions as Record<string, { question?: string }> | undefined
    return questions?.[key]?.question?.trim() || fallback
  }

  const getOptionLabels = (key: string): { key: string; label: string }[] => {
    const questions = quizContent?.questions as Record<string, { options?: { key: string; label: string }[] }> | undefined
    const options = questions?.[key]?.options
    if (!Array.isArray(options)) return []
    return options.map((o) => ({ key: o.key, label: o.label || o.key }))
  }

  const getUiText = (key: keyof NonNullable<QuizContent['ui']>, fallback: string) =>
    quizContent?.ui?.[key] || fallback

  useEffect(() => {
    setLanguages(publicQuiz.languages || [])
    const lang = publicQuiz.default_language || publicQuiz.languages?.[0] || 'English'
    setSelectedLanguage(lang)
    setQuizContent(publicQuiz.content || null)

    const firstKey = publicQuiz.question_order?.[0]
    if (!introConfigured && firstKey) {
      const row = questionsLayout.find((q) => q.question_key === firstKey)
      if (row && getLayoutElements(row.layout).length > 0) {
        setLayoutTarget(row.id)
        setScreen('layout')
        return
      }
      setDynamicQuestionKey(firstKey)
      setScreen('dynamic')
      return
    }

    setScreen(introConfigured ? 'title' : firstKey ? 'dynamic' : 'title')
    if (!introConfigured && firstKey) setDynamicQuestionKey(firstKey)
  }, [publicQuiz, introConfigured, questionsLayout])

  useEffect(() => {
    if (!publicQuiz.contents || !selectedLanguage) return
    setQuizContent(publicQuiz.contents[selectedLanguage] || publicQuiz.content || null)
  }, [publicQuiz, selectedLanguage])

  const goToLayoutQuestion = useCallback(
    (key: string) => {
      const row = questionsLayout.find((q) => q.question_key === key)
      if (row && getLayoutElements(row.layout).length > 0) {
        setLayoutTarget(row.id)
        setScreen('layout')
        return
      }
      setDynamicQuestionKey(key)
      setScreen('dynamic')
    },
    [questionsLayout]
  )

  const finishQuiz = useCallback(
    (answers: QuizAnswers) => {
      setQuizAnswers(answers)
      const quizId = publicQuiz.quiz?.id
      if (quizId) {
        const customRules = loadCustomResults(quizId)
        if (customRules.length > 0) {
          const matched = [...customRules]
            .sort((a, b) => b.conditions.length - a.conditions.length)
            .find((rule) =>
              rule.conditions.every((cond) => conditionMatches(answers, cond.questionKey, cond.optionKey))
            )
          setCustomResultRule(matched || null)
          setScreen(matched ? 'customResult' : 'noResult')
          return
        }
      }
      setScreen('complete')
    },
    [publicQuiz]
  )

  const navigateNext = useCallback(
    async (currentKey: string, choice: string) => {
      const nextAnswers = { ...quizAnswers, [currentKey]: choice }
      setQuizAnswers(nextAnswers)
      const nextKey = nextQuestionKey(questionOrder, currentKey)
      if (!nextKey) {
        finishQuiz(nextAnswers)
        return
      }
      goToLayoutQuestion(nextKey)
    },
    [quizAnswers, questionOrder, goToLayoutQuestion, finishQuiz]
  )

  const navigateBack = useCallback(
    (currentKey: string) => {
      const prevKey = prevQuestionKey(questionOrder, currentKey)
      if (!prevKey) {
        setLayoutTarget('intro')
        setScreen('title')
        return
      }
      goToLayoutQuestion(prevKey)
    },
    [questionOrder, goToLayoutQuestion]
  )

  const handleLayoutElementAction = useCallback(
    (action: ElementAction, element?: LayoutElement) => {
      const elementOptionKey = element ? resolveLayoutAnswerKey(element) : ''
      const recordedChoice = actionRecordsAnswer(action) || elementOptionKey

      if (action.type === 'next' && layoutTarget === 'intro') {
        setQuizAnswers({})
        const firstKey = questionOrder[0]
        if (firstKey) goToLayoutQuestion(firstKey)
        return
      }
      if (action.type === 'next' && typeof layoutTarget === 'number') {
        const key = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
        if (key) {
          if (element && isLayoutAnswerChoice(element)) {
            if (recordedChoice) {
              setLayoutPendingAnswers((prev) => ({ ...prev, [key]: recordedChoice }))
              setLayoutSelectionError('')
            }
            return
          }
          const selected = recordedChoice || layoutPendingAnswers[key] || ''
          if (!selected) {
            setLayoutSelectionError('Please select an option before pressing Next.')
            return
          }
          setLayoutSelectionError('')
          void navigateNext(key, selected)
        }
        return
      }
      if (typeof layoutTarget === 'number' && element && isLayoutAnswerChoice(element)) {
        const key = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
        if (key && recordedChoice) {
          setLayoutPendingAnswers((prev) => ({ ...prev, [key]: recordedChoice }))
          setLayoutSelectionError('')
        }
      }
      if ((action.type === 'back' || action.type === 'previous') && typeof layoutTarget === 'number') {
        const key = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
        if (key) navigateBack(key)
        return
      }
      const next = resolveActionNavigation(action, layoutTarget, layoutQuestionIds)
      if (next === 'intro') {
        setLayoutTarget('intro')
        setScreen('title')
        return
      }
      if (typeof next === 'number') {
        if (element && isLayoutAnswerChoice(element) && isForwardNavigationAction(action)) return
        const row = questionsLayout.find((q) => q.id === next)
        if (row) goToLayoutQuestion(row.question_key)
        return
      }
      if (next === null && typeof layoutTarget === 'number' && isForwardNavigationAction(action)) {
        if (element && isLayoutAnswerChoice(element)) return
        const idx = layoutQuestionIds.indexOf(layoutTarget)
        if (idx >= 0 && idx === layoutQuestionIds.length - 1) {
          const key = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
          if (key) {
            const selected = recordedChoice || layoutPendingAnswers[key] || ''
            if (!selected) {
              setLayoutSelectionError('Please select an option before pressing Next.')
              return
            }
            setLayoutSelectionError('')
            void navigateNext(key, selected)
          }
        }
      }
    },
    [
      layoutTarget,
      layoutQuestionIds,
      layoutPendingAnswers,
      questionsLayout,
      questionOrder,
      goToLayoutQuestion,
      navigateNext,
      navigateBack,
    ]
  )

  const activeLayoutQuestion = useMemo(
    () =>
      typeof layoutTarget === 'number'
        ? questionsLayout.find((q) => q.id === layoutTarget) ?? null
        : null,
    [layoutTarget, questionsLayout]
  )

  const startQuiz = () => {
    setQuizAnswers({})
    setLayoutPendingAnswers({})
    setLayoutSelectionError('')
    const first = questionOrder[0]
    if (first) goToLayoutQuestion(first)
  }

  return (
    <div className="app-root">
      <div className="app-layout">
        <DeviceFrame>
          {screen === 'title' &&
            (useIntroLayoutOverlay ? (
              <QuizLayoutScreen
                elements={introLayoutElements}
                customFont={customFont}
                base={
                  <TitleScreen
                    onStart={startQuiz}
                    titleText={quizContent?.title?.heading}
                    subtitleText={quizContent?.title?.subtitle}
                    startButtonText={quizContent?.title?.startButton}
                    languages={languages}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                  />
                }
                onElementAction={handleLayoutElementAction}
              />
            ) : (
              <TitleScreen
                onStart={startQuiz}
                titleText={quizContent?.title?.heading}
                subtitleText={quizContent?.title?.subtitle}
                startButtonText={quizContent?.title?.startButton}
                languages={publicQuiz.allow_language_selection === false ? [] : languages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            ))}

          {screen === 'layout' && activeLayoutQuestion && getLayoutElements(activeLayoutQuestion.layout).length > 0 && (
            <QuizLayoutScreen
              elements={activeLayoutQuestion.layout}
              customFont={customFont}
              base={
                <div className="quiz-layout-question-base">
                  <h2>{getQuestionText(activeLayoutQuestion.question_key, activeLayoutQuestion.question_key)}</h2>
                  {layoutSelectionError ? (
                    <p className="quiz-layout-selection-error">{layoutSelectionError}</p>
                  ) : null}
                </div>
              }
              onElementAction={handleLayoutElementAction}
            />
          )}

          {screen === 'layout' && activeLayoutQuestion && getLayoutElements(activeLayoutQuestion.layout).length === 0 && (
            <DynamicQuestionScreen
              questionKey={activeLayoutQuestion.question_key}
              questionText={getQuestionText(activeLayoutQuestion.question_key, activeLayoutQuestion.question_key)}
              optionLabels={getOptionLabels(activeLayoutQuestion.question_key)}
              onBack={() => navigateBack(activeLayoutQuestion.question_key)}
              onConfirm={(choice) => void navigateNext(activeLayoutQuestion.question_key, choice)}
              backText={getUiText('back', 'Back')}
              confirmText={getUiText('confirm', 'Confirm')}
            />
          )}

          {screen === 'dynamic' && dynamicQuestionKey && (
            <DynamicQuestionScreen
              questionKey={dynamicQuestionKey}
              questionText={getQuestionText(dynamicQuestionKey, dynamicQuestionKey)}
              optionLabels={getOptionLabels(dynamicQuestionKey)}
              onBack={() => navigateBack(dynamicQuestionKey)}
              onConfirm={(choice) => void navigateNext(dynamicQuestionKey, choice)}
              backText={getUiText('back', 'Back')}
              confirmText={getUiText('confirm', 'Confirm')}
            />
          )}

          {screen === 'customResult' && customResultRule && (
            <QuizLayoutScreen
              elements={customResultRule.layout}
              customFont={customFont}
              base={
                getLayoutElements(customResultRule.layout).length === 0 ? (
                  <div className="custom-result-fallback">
                    <h2>{customResultRule.resultTitle || 'Result'}</h2>
                    <p>{customResultRule.resultDescription || ''}</p>
                  </div>
                ) : undefined
              }
            />
          )}

          {screen === 'noResult' && (
            <div className="screen no-result-screen">
              <div className="screen-content no-result-content">
                <div className="no-result-frame">
                  <p>No matching result is configured for your answers.</p>
                </div>
              </div>
            </div>
          )}

          {screen === 'complete' && (
            <div className="screen quiz-complete-screen">
              <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center', padding: 24 }}>
                <h1 className="typo-title">Thank you</h1>
                <p className="typo-body">You have completed this quiz.</p>
              </div>
            </div>
          )}
        </DeviceFrame>
      </div>
    </div>
  )
}
