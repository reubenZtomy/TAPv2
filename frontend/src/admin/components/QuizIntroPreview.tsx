import React from 'react'
import { TitleScreen } from '../../screens/TitleScreen'
import { isIntroConfigured, type IntroLayout } from '../layoutTypes'

type QuizIntroPreviewProps = {
  intro: IntroLayout
  quizName?: string
  languages: string[]
  languageCode: string
}

export function QuizIntroPreview({
  intro,
  languages,
  languageCode,
}: QuizIntroPreviewProps) {
  if (!isIntroConfigured(intro)) {
    return (
      <div className="admin-mobile-screen-wrap admin-intro-preview-empty">
        <p className="admin-muted">Intro not configured</p>
        <p className="admin-muted admin-intro-preview-empty-hint">
          Add overlay elements in the editor, or set heading and start button copy when intro settings are
          available.
        </p>
      </div>
    )
  }

  const heading = intro.heading?.trim() || ''
  const subtitle = intro.subtitle?.trim() || ''
  const startButton = intro.startButton?.trim() || ''

  return (
    <div className="admin-mobile-screen-wrap">
      <TitleScreen
        onStart={() => {}}
        titleText={heading || ' '}
        subtitleText={subtitle}
        startButtonText={startButton || ' '}
        languages={languages.length > 1 ? languages : []}
        selectedLanguage={languageCode}
      />
    </div>
  )
}
