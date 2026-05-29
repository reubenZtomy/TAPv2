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
  type ElementAction,
  type LayoutElement,
  type PreviewTarget,
} from './admin/layoutTypes'
import { QuizLayoutScreen } from './layout/QuizLayoutScreen'
import { TitleScreen } from './screens/TitleScreen'
import { FunStudiesScreen } from './screens/FunStudiesScreen'
import { PartnerScreen } from './screens/PartnerScreen'
import { PassionScreen } from './screens/PassionScreen'
import { TreasureScreen } from './screens/TreasureScreen'
import { BasecampScreen } from './screens/BasecampScreen'
import { AdventureScreen } from './screens/AdventureScreen'
import { RechargeScreen } from './screens/RechargeScreen'
import { GraduationScreen } from './screens/GraduationScreen'
import { ResultsRevealScreen } from './screens/ResultsRevealScreen'
import { PersonalityResultScreen } from './screens/PersonalityResultScreen'
import { PersonalityResultDevNav } from './components/PersonalityResultDevNav'
import { isResultPreviewDevRoute } from './config/devPreviewRoute'
import { createMockQuizResult, PersonalityId } from './data/personalityThemes'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { QuizContent } from './types/quizContent'
import { buildGenerateResultPayload, QuizAnswerKeys } from './utils/quizAnswers'
import {
  firstQuestionScreen,
  getOptionLabels as flowOptionLabels,
  getQuestionText as flowQuestionText,
  nextQuestionKey,
  prevQuestionKey,
  screenForQuestionKey,
  TAP_QUESTION_ORDER,
} from './utils/quizFlow'
import { QuizResult } from './types/quizResult'
import { loadCustomResults, resolveLayoutAnswerKey, type CustomResultRule } from './admin/customResults'
import { isLayoutAnswerChoice } from './admin/layoutTypes'

type ScreenId =
  | 'login'
  | 'register'
  | 'title'
  | 'passion'
  | 'partner'
  | 'treasure'
  | 'fun'
  | 'basecamp'
  | 'adventure'
  | 'recharge'
  | 'graduation'
  | 'layout'
  | 'dynamic'
  | 'results'
  | 'customResult'
  | 'noResult'
  | 'personalityResult'
  | 'done'

type AppProps = {
  publicQuiz?: PublicQuizPayload
}

export default function App({ publicQuiz }: AppProps = {}) {
  const normalizeKey = (value: string | undefined): string => (value || '').trim().toLowerCase()

  const conditionMatches = (answers: QuizAnswerKeys, questionKey: string, expected: string | undefined): boolean => {
    const raw = (answers as Record<string, string | undefined>)[questionKey]
    return normalizeKey(raw) === normalizeKey(expected)
  }

  const questionOrder = useMemo(
    () =>
      publicQuiz?.question_order?.length
        ? publicQuiz.question_order
        : [...TAP_QUESTION_ORDER],
    [publicQuiz]
  )

  const questionsLayout = useMemo(() => publicQuiz?.questions_layout ?? [], [publicQuiz])
  const layoutQuestionIds = useMemo(() => questionsLayout.map((q) => q.id), [questionsLayout])
  const introLayoutElements = useMemo(
    () => getLayoutElements(publicQuiz?.intro_layout?.elements),
    [publicQuiz?.intro_layout]
  )
  const useLayoutRenderer = Boolean(publicQuiz && questionsLayout.length > 0)
  const useIntroLayoutOverlay = introLayoutElements.length > 0
  const introConfigured = useMemo(
    () => isIntroConfigured(publicQuiz?.intro_layout),
    [publicQuiz?.intro_layout]
  )
  const customFont = publicQuiz?.custom_font ?? null

  const [screen, setScreen] = useState<ScreenId>(publicQuiz ? 'title' : 'login')
  const [layoutTarget, setLayoutTarget] = useState<PreviewTarget>('intro')
  const [dynamicQuestionKey, setDynamicQuestionKey] = useState('')
  const [overlay, setOverlay] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.45)
  const [token, setToken] = useState<string | null>(null)
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [quizContent, setQuizContent] = useState<QuizContent | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerKeys>({})
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [quizResultLoaded, setQuizResultLoaded] = useState(false)
  const [customResultRule, setCustomResultRule] = useState<CustomResultRule | null>(null)
  const [hasCustomRules, setHasCustomRules] = useState(false)
  const [layoutPendingAnswers, setLayoutPendingAnswers] = useState<Record<string, string>>({})
  const [layoutSelectionError, setLayoutSelectionError] = useState('')
  const [showResultPreviewDev, setShowResultPreviewDev] = useState(() => isResultPreviewDevRoute())
  const languageStorageKey = 'asq_language'

  const setQuizAnswer = (key: keyof QuizAnswerKeys, value: string) => {
    setQuizAnswers((prev) => {
      const next = { ...prev, [key]: value }
      console.log('[Quiz] Answer selected:', { question: key, optionKey: value })
      return next
    })
  }

  const submitQuizToApi = async (answers: QuizAnswerKeys): Promise<QuizResult | null> => {
    const payload = buildGenerateResultPayload(answers, quizContent)
    console.log('[Quiz] All answers (keys):', answers)
    if (!payload) {
      console.warn('[Quiz] Incomplete answers — skipping /api/generate-result', answers)
      return null
    }
    console.log('[Quiz] POST /api/generate-result request:', payload)
    try {
      const res = await fetch('/api/generate-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as QuizResult
      console.log('[Quiz] POST /api/generate-result status:', res.status)
      console.log('[Quiz] POST /api/generate-result response:', data)
      if (!res.ok) {
        console.warn('[Quiz] API returned an error response')
        return data
      }
      return data
    } catch (err) {
      console.error('[Quiz] POST /api/generate-result failed:', err)
      return null
    }
  }

  useEffect(() => {
    if (!publicQuiz) return
    setLanguages(publicQuiz.languages || [])
    const lang = publicQuiz.default_language || publicQuiz.languages?.[0] || 'English'
    setSelectedLanguage(lang)
    setQuizContent(publicQuiz.content || null)

    const firstKey = publicQuiz.question_order?.[0]
    if (!introConfigured && firstKey && useLayoutRenderer) {
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
  }, [publicQuiz, introConfigured, useLayoutRenderer, questionsLayout])

  useEffect(() => {
    if (!publicQuiz?.contents || !selectedLanguage) return
    setQuizContent(publicQuiz.contents[selectedLanguage] || publicQuiz.content || null)
  }, [publicQuiz, selectedLanguage])

  // Enable overlay via ?overlay=1 in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setOverlay(params.get('overlay') === '1')
    if (publicQuiz) return
    const saved = localStorage.getItem('asq_token')
    if (saved) {
      setToken(saved)
      setScreen('title')
    }
  }, [languageStorageKey, publicQuiz])

  useEffect(() => {
    const syncDevPreviewRoute = () => setShowResultPreviewDev(isResultPreviewDevRoute())
    syncDevPreviewRoute()
    window.addEventListener('popstate', syncDevPreviewRoute)
    return () => window.removeEventListener('popstate', syncDevPreviewRoute)
  }, [])

  // Toggle overlay with 'o' for alignment
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'o') {
        setOverlay((v) => !v)
      }
      if (e.key === '+' || e.key === '=') {
        setOverlayOpacity((v) => Math.min(1, v + 0.05))
      }
      if (e.key === '-' || e.key === '_') {
        setOverlayOpacity((v) => Math.max(0, v - 0.05))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (publicQuiz) return
    let cancelled = false
    const loadLanguages = async () => {
      try {
        const res = await fetch('/api/questions/languages')
        if (!res.ok) return
        const data = await res.json()
        const fetchedLanguages = Array.isArray(data.languages) ? data.languages : []
        if (!cancelled) {
          setLanguages(fetchedLanguages)
          if (fetchedLanguages.length > 0) {
            const savedLanguage = (localStorage.getItem(languageStorageKey) || '').trim()
            const nextLanguage =
              savedLanguage && fetchedLanguages.includes(savedLanguage)
                ? savedLanguage
                : fetchedLanguages[0]
            setSelectedLanguage((current) => current || nextLanguage)
          }
        }
      } catch {
        // Intentionally silent fallback to default in-code copy.
      }
    }
    loadLanguages()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedLanguage) return
    localStorage.setItem(languageStorageKey, selectedLanguage)
  }, [selectedLanguage])

  useEffect(() => {
    if (publicQuiz || !selectedLanguage) {
      if (!publicQuiz) setQuizContent(null)
      return
    }
    let cancelled = false
    const loadLanguageContent = async () => {
      try {
        const res = await fetch(`/api/questions/${encodeURIComponent(selectedLanguage)}`)
        if (!res.ok) {
          if (!cancelled) setQuizContent(null)
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setQuizContent((data?.content ?? null) as QuizContent | null)
        }
      } catch {
        if (!cancelled) setQuizContent(null)
      }
    }
    loadLanguageContent()
    return () => {
      cancelled = true
    }
  }, [selectedLanguage])

  const overlaySrc = useMemo(() => {
    if (!overlay) return undefined
    switch (screen) {
      case 'title':
        return '/asq/ASQ Title - Final Ver.png'
      case 'passion':
        return undefined
      case 'treasure':
        return '/asq/Treasure - Base.png'
      case 'fun':
        return '/asq/iPhone 13 Mini - Fun and Studies.png'
      case 'partner':
        return '/asq/iPhone 13 Mini - Partner.png'
      case 'basecamp':
        return undefined
      case 'adventure':
        return undefined
      default:
        return undefined
    }
  }, [overlay, screen])

  const getQuestionText = (key: string, fallback: string) =>
    flowQuestionText(quizContent, key, fallback)

  const getOptionLabels = (key: string) => flowOptionLabels(quizContent, key)

  const getUiText = (key: keyof NonNullable<QuizContent['ui']>, fallback: string) =>
    quizContent?.ui?.[key] || fallback

  const goToLayoutQuestion = useCallback(
    (key: string) => {
      const row = questionsLayout.find((q) => q.question_key === key)
      if (row && getLayoutElements(row.layout).length > 0) {
        setLayoutTarget(row.id)
        setScreen('layout')
        return
      }
      if (useLayoutRenderer) {
        setDynamicQuestionKey(key)
        setScreen('dynamic')
        return
      }
      const nextScreen = screenForQuestionKey(key)
      if (nextScreen === 'dynamic') setDynamicQuestionKey(key)
      setScreen(nextScreen as ScreenId)
    },
    [questionsLayout, useLayoutRenderer]
  )

  const goToQuestionKey = useCallback(
    (key: string) => {
      if (useLayoutRenderer) {
        goToLayoutQuestion(key)
        return
      }
      const nextScreen = screenForQuestionKey(key)
      if (nextScreen === 'dynamic') setDynamicQuestionKey(key)
      setScreen(nextScreen as ScreenId)
    },
    [useLayoutRenderer, goToLayoutQuestion]
  )

  const finishQuiz = useCallback(
    async (answers: QuizAnswerKeys) => {
      setQuizAnswers(answers)
      setQuizResult(null)
      setQuizResultLoaded(false)
      setCustomResultRule(null)
      const quizId = publicQuiz?.quiz?.id
      if (quizId) {
        const customRules = loadCustomResults(quizId)
        const hasRules = customRules.length > 0
        setHasCustomRules(hasRules)
        if (hasRules) {
          const matched = [...customRules]
            .sort((a, b) => b.conditions.length - a.conditions.length)
            .find((rule) =>
              rule.conditions.every((cond) => conditionMatches(answers, cond.questionKey, cond.optionKey))
            )
          setCustomResultRule(matched || null)
          setScreen(matched ? 'customResult' : 'noResult')
          setQuizResultLoaded(true)
          return
        }
      } else {
        setHasCustomRules(false)
      }
      setScreen('results')
      const data = await submitQuizToApi(answers)
      setQuizResult(data)
      setQuizResultLoaded(true)
    },
    [publicQuiz, quizContent]
  )

  const navigateNext = useCallback(
    async (currentKey: string, choice: string) => {
      const nextAnswers = { ...quizAnswers, [currentKey]: choice } as QuizAnswerKeys
      setQuizAnswers(nextAnswers)
      const nextKey = nextQuestionKey(questionOrder, currentKey)
      if (!nextKey) {
        await finishQuiz(nextAnswers)
        return
      }
      goToQuestionKey(nextKey)
    },
    [quizAnswers, questionOrder, goToQuestionKey, finishQuiz]
  )

  const navigateBack = useCallback(
    (currentKey: string) => {
      const prevKey = prevQuestionKey(questionOrder, currentKey)
      if (!prevKey) {
        setLayoutTarget('intro')
        setScreen('title')
        return
      }
      goToQuestionKey(prevKey)
    },
    [questionOrder, goToQuestionKey]
  )

  const handleLayoutElementAction = useCallback(
    (action: ElementAction, element?: LayoutElement) => {
      const resolveElementOptionKey = (el?: LayoutElement): string =>
        el ? resolveLayoutAnswerKey(el) : ''

      const elementOptionKey = resolveElementOptionKey(element)
      const recordedChoice = actionRecordsAnswer(action) || elementOptionKey
      const applyRecordedAnswer = (questionKey: string) => {
        if (!recordedChoice) return
        setQuizAnswers((prev) => ({ ...prev, [questionKey]: recordedChoice }) as QuizAnswerKeys)
      }

      if (action.type === 'next' && layoutTarget === 'intro') {
        setQuizAnswers({})
        setQuizResult(null)
        setQuizResultLoaded(false)
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
        if (key) {
          applyRecordedAnswer(key)
          navigateBack(key)
        }
        return
      }
      const next = resolveActionNavigation(action, layoutTarget, layoutQuestionIds)
      if (next === 'intro') {
        if (typeof layoutTarget === 'number') {
          const key = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
          if (key) applyRecordedAnswer(key)
        }
        setLayoutTarget('intro')
        setScreen('title')
        return
      }
      if (typeof next === 'number') {
        if (element && isLayoutAnswerChoice(element) && isForwardNavigationAction(action)) {
          return
        }
        const row = questionsLayout.find((q) => q.id === next)
        if (row) {
          if (typeof layoutTarget === 'number') {
            const fromKey = questionsLayout.find((q) => q.id === layoutTarget)?.question_key
            if (fromKey) applyRecordedAnswer(fromKey)
          }
          goToLayoutQuestion(row.question_key)
        }
        return
      }
      if (
        next === null &&
        typeof layoutTarget === 'number' &&
        isForwardNavigationAction(action)
      ) {
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

  const openTestPersonalityResult = (personalityId: PersonalityId) => {
    setQuizResult(createMockQuizResult(personalityId))
    setQuizResultLoaded(true)
    setQuizAnswers({ passion: 'business' })
    setScreen('personalityResult')
  }

  return (
    <div className="app-root">
      <div className="app-layout">
        <DeviceFrame overlaySrc={overlaySrc} overlayOpacity={overlayOpacity}>
        {screen === 'login' && (
          <LoginScreen
            onLoggedIn={(t) => {
              setToken(t)
              setScreen('title')
            }}
            onGoRegister={() => setScreen('register')}
          />
        )}
        {screen === 'register' && (
          <RegisterScreen
            onRegistered={(t) => {
              setToken(t)
              setScreen('title')
            }}
            onGoLogin={() => setScreen('login')}
          />
        )}
        {screen === 'title' && useLayoutRenderer && (
          useIntroLayoutOverlay ? (
            <QuizLayoutScreen
              elements={introLayoutElements}
              customFont={customFont}
              base={
                <TitleScreen
                  onStart={() => {
                    setQuizAnswers({})
                    setQuizResult(null)
                    setQuizResultLoaded(false)
                    const first = questionOrder[0]
                    if (first) goToLayoutQuestion(first)
                  }}
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
              onStart={() => {
                setQuizAnswers({})
                setQuizResult(null)
                setQuizResultLoaded(false)
                setLayoutPendingAnswers({})
                setLayoutSelectionError('')
                const first = questionOrder[0]
                if (first) goToLayoutQuestion(first)
              }}
              titleText={quizContent?.title?.heading}
              subtitleText={quizContent?.title?.subtitle}
              startButtonText={quizContent?.title?.startButton}
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          )
        )}
        {screen === 'title' && !useLayoutRenderer && (
          <TitleScreen
            onStart={() => {
              setQuizAnswers({})
              setQuizResult(null)
              setQuizResultLoaded(false)
              setLayoutPendingAnswers({})
              setLayoutSelectionError('')
              console.log('[Quiz] Started — answers reset')
              const first = questionOrder[0]
              if (first) goToQuestionKey(first)
              else setScreen(firstQuestionScreen(questionOrder) as ScreenId)
            }}
            titleText={quizContent?.title?.heading}
            subtitleText={quizContent?.title?.subtitle}
            startButtonText={quizContent?.title?.startButton}
            languages={languages}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        )}
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
        {!useLayoutRenderer && screen === 'passion' && (
          <PassionScreen
            onBack={() => setScreen('title')}
            onNext={(choice) => {
              if (choice) void navigateNext('passion', choice)
            }}
            questionText={getQuestionText('passion', 'Choose your path to your Aussie knowledge mastery!')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            resetText={getUiText('passionReset', 'I changed my mind!')}
            swipeTextStart={getUiText('passionSwipeStart', 'Swipe to the right for more options')}
            swipeTextMiddle={getUiText('passionSwipeMiddle', 'Swipe left or right')}
            swipeTextEnd={getUiText('passionSwipeEnd', 'Swipe to the right')}
          />
        )}
        {!useLayoutRenderer && screen === 'partner' && (
          <PartnerScreen
            onBack={() => navigateBack('partner')}
            onFinish={(choice) => {
              void navigateNext('partner', choice)
            }}
            questionText={getQuestionText(
              'partner',
              'Who’s your wild partner on this epic journey through Australia?'
            )}
            optionLabels={getOptionLabels('partner')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('partnerInstruction', 'Select Character then Confirm')}
            emptySelectionText={getUiText('partnerEmptySelection', 'Pick a Character!')}
          />
        )}
        {!useLayoutRenderer && screen === 'treasure' && (
          <TreasureScreen
            onBack={() => navigateBack('treasure')}
            onConfirm={(choice) => {
              void navigateNext('treasure', choice)
            }}
            questionText={getQuestionText('treasure', 'What’s your treasure chest looking for this Aussie quest?')}
            optionLabels={getOptionLabels('treasure')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('answerInstruction', 'Select Answer then Confirm')}
          />
        )}
        {!useLayoutRenderer && screen === 'fun' && (
          <FunStudiesScreen
            onNext={(choice) => {
              void navigateNext('fun', choice)
            }}
            onBack={() => setScreen('title')}
            questionText={getQuestionText('fun', 'How will you judge fun and studies on your journey?')}
            optionLabels={getOptionLabels('fun')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('imageInstruction', 'Select Image then Confirm')}
          />
        )}
        {!useLayoutRenderer && screen === 'basecamp' && (
          <BasecampScreen
            onBack={() => navigateBack('basecamp')}
            onConfirm={(choice) => {
              void navigateNext('basecamp', choice)
            }}
            questionText={getQuestionText('basecamp', 'Where will you set up your basecamp for learning?')}
            optionLabels={getOptionLabels('basecamp')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('answerInstruction', 'Select Answer then Confirm')}
          />
        )}
        {!useLayoutRenderer && screen === 'adventure' && (
          <AdventureScreen
            onBack={() => navigateBack('adventure')}
            onConfirm={(choice) => {
              if (choice) void navigateNext('adventure', choice)
            }}
            questionText={getQuestionText('adventure', 'How will you level up during your Aussie quest downtime?')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            swipeTextStart={getUiText('adventureSwipeStart', 'Swipe right for more options or press confirm')}
            swipeTextMiddle={getUiText('adventureSwipeMiddle', 'Swipe left or right')}
            swipeTextEnd={getUiText('adventureSwipeEnd', 'Swipe left')}
          />
        )}
        {!useLayoutRenderer && screen === 'recharge' && (
          <RechargeScreen
            onBack={() => navigateBack('recharge')}
            onConfirm={(choice) => {
              void navigateNext('recharge', choice)
            }}
            questionText={getQuestionText(
              'recharge',
              'Do you need a top-tier university to claim victory of the quest?'
            )}
            optionLabels={getOptionLabels('recharge')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('answerInstruction', 'Select Answer then Confirm')}
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
        {!useLayoutRenderer && screen === 'graduation' && (
          <GraduationScreen
            onBack={() => navigateBack('graduation')}
            onConfirm={async (choice) => {
              await finishQuiz({ ...quizAnswers, graduation: choice })
            }}
            questionText={getQuestionText('graduation', 'How will you level up after graduation?')}
            optionLabels={getOptionLabels('graduation')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('graduationInstruction', 'Select an option to confirm')}
          />
        )}
        {screen === 'results' && (
          <ResultsRevealScreen
            onContinue={() => {
              if (hasCustomRules) {
                setScreen(customResultRule ? 'customResult' : 'noResult')
                return
              }
              setScreen('personalityResult')
            }}
            ready={quizResultLoaded}
            mainText={getUiText('resultsMain', 'Gathering results...')}
            subtitleText={getUiText('resultsSubtitle', 'I wonder where you will go?')}
            buttonText={getUiText('resultsButton', 'Click to find out!')}
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
                <p>No Result available</p>
              </div>
            </div>
          </div>
        )}
        {screen === 'personalityResult' && (
          <PersonalityResultScreen
            result={quizResult}
            quizAnswers={quizAnswers}
            quizContent={quizContent}
            onShare={() => {
              const title = quizResult?.title ?? 'My quiz result'
              const text = quizResult?.description ?? ''
              if (navigator.share) {
                void navigator.share({ title, text }).catch(() => undefined)
              } else {
                console.log('[Quiz] Share:', { title, text })
              }
            }}
            onBack={() => setScreen('title')}
            onRetry={() => {
              setQuizAnswers({})
              setQuizResult(null)
              setQuizResultLoaded(false)
              const first = questionOrder[0]
              if (first) goToQuestionKey(first)
            }}
          />
        )}
        {screen === 'done' && (
          <div className="screen done-screen">
            <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
              <h1 className="typo-title">Thanks!</h1>
              <p className="typo-body">Prototype complete.</p>
            </div>
          </div>
        )}
        </DeviceFrame>
        {showResultPreviewDev && (
          <PersonalityResultDevNav onOpenResult={openTestPersonalityResult} />
        )}
      </div>
      {/* Dev controls hidden by default to avoid adding page height */}
      {overlay && (
        <div className="controls" aria-hidden="false">
          <button className="control-button" onClick={() => setScreen('title')} aria-label="Title">
            Title
          </button>
          <button className="control-button" onClick={() => setScreen('passion')} aria-label="Passion">
            Passion
          </button>
          <button className="control-button" onClick={() => setScreen('fun')} aria-label="Fun">
            Fun & Studies
          </button>
          <button className="control-button" onClick={() => setScreen('partner')} aria-label="Partner">
            Partner
          </button>
        </div>
      )}
    </div>
  )
}
