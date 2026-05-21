import React, { useEffect, useMemo, useState } from 'react'
import { DeviceFrame } from './components/DeviceFrame'
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
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { QuizContent } from './types/quizContent'

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
  | 'results'
  | 'done'

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('login')
  const [overlay, setOverlay] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.45)
  const [token, setToken] = useState<string | null>(null)
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [quizContent, setQuizContent] = useState<QuizContent | null>(null)
  const languageStorageKey = 'asq_language'

  // Enable overlay via ?overlay=1 in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setOverlay(params.get('overlay') === '1')
    const saved = localStorage.getItem('asq_token')
    if (saved) {
      setToken(saved)
      setScreen('title')
    }
  }, [languageStorageKey])

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
    if (!selectedLanguage) {
      setQuizContent(null)
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
    quizContent?.questions?.[key]?.question || fallback

  const getOptionLabels = (key: string) =>
    Object.fromEntries(
      (quizContent?.questions?.[key]?.options || []).map((option) => [option.key, option.label])
    )

  const getUiText = (key: keyof NonNullable<QuizContent['ui']>, fallback: string) =>
    quizContent?.ui?.[key] || fallback

  return (
    <div className="app-root">
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
        {screen === 'title' && (
          <TitleScreen
            onStart={() => setScreen('passion')}
            titleText={quizContent?.title?.heading}
            subtitleText={quizContent?.title?.subtitle}
            startButtonText={quizContent?.title?.startButton}
            languages={languages}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        )}
        {screen === 'passion' && (
          <PassionScreen
            onBack={() => setScreen('title')}
            onNext={() => setScreen('partner')}
            questionText={getQuestionText('passion', 'Choose your path to your Aussie knowledge mastery!')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            resetText={getUiText('passionReset', 'I changed my mind!')}
            swipeTextStart={getUiText('passionSwipeStart', 'Swipe to the right for more options')}
            swipeTextMiddle={getUiText('passionSwipeMiddle', 'Swipe left or right')}
            swipeTextEnd={getUiText('passionSwipeEnd', 'Swipe to the right')}
          />
        )}
        {screen === 'partner' && (
          <PartnerScreen
            onBack={() => setScreen('passion')}
            onFinish={() => setScreen('treasure')}
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
        {screen === 'treasure' && (
          <TreasureScreen
            onBack={() => setScreen('partner')}
            onConfirm={() => setScreen('fun')}
            questionText={getQuestionText('treasure', 'What’s your treasure chest looking for this Aussie quest?')}
            optionLabels={getOptionLabels('treasure')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('answerInstruction', 'Select Answer then Confirm')}
          />
        )}
        {screen === 'fun' && (
          <FunStudiesScreen
            onNext={() => setScreen('basecamp')}
            onBack={() => setScreen('title')}
            questionText={getQuestionText('fun', 'How will you judge fun and studies on your journey?')}
            optionLabels={getOptionLabels('fun')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('imageInstruction', 'Select Image then Confirm')}
          />
        )}
        {screen === 'basecamp' && (
          <BasecampScreen
            onBack={() => setScreen('fun')}
            onConfirm={() => setScreen('adventure')}
            questionText={getQuestionText('basecamp', 'Where will you set up your basecamp for learning?')}
            optionLabels={getOptionLabels('basecamp')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('answerInstruction', 'Select Answer then Confirm')}
          />
        )}
        {screen === 'adventure' && (
          <AdventureScreen
            onBack={() => setScreen('basecamp')}
            onConfirm={() => setScreen('recharge')}
            questionText={getQuestionText('adventure', 'How will you level up during your Aussie quest downtime?')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            swipeTextStart={getUiText('adventureSwipeStart', 'Swipe right for more options or press confirm')}
            swipeTextMiddle={getUiText('adventureSwipeMiddle', 'Swipe left or right')}
            swipeTextEnd={getUiText('adventureSwipeEnd', 'Swipe left')}
          />
        )}
        {screen === 'recharge' && (
          <RechargeScreen
            onBack={() => setScreen('adventure')}
            onConfirm={() => setScreen('graduation')}
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
        {screen === 'graduation' && (
          <GraduationScreen
            onBack={() => setScreen('recharge')}
            onConfirm={() => setScreen('results')}
            questionText={getQuestionText('graduation', 'How will you level up after graduation?')}
            optionLabels={getOptionLabels('graduation')}
            backText={getUiText('back', 'Back')}
            confirmText={getUiText('confirm', 'Confirm')}
            instructionText={getUiText('graduationInstruction', 'Select an option to confirm')}
          />
        )}
        {screen === 'results' && (
          <ResultsRevealScreen
            onContinue={() => setScreen('done')}
            mainText={getUiText('resultsMain', 'Gathering results...')}
            subtitleText={getUiText('resultsSubtitle', 'I wonder where you will go?')}
            buttonText={getUiText('resultsButton', 'Click to find out!')}
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
