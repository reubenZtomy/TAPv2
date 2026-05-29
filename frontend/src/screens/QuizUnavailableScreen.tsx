import React from 'react'

type QuizUnavailableScreenProps = {
  reason?: string
  quizName?: string | null
  message?: string
  title?: string
}

const REASON_MESSAGES: Record<string, string> = {
  not_found: 'This quiz link could not be found.',
  link_inactive: 'This link has been deactivated.',
  quiz_inactive: 'This quiz is not published yet.',
  not_started: 'This quiz is not available yet. Check back soon.',
  expired: 'This quiz link has expired.',
}

export function QuizUnavailableScreen({
  reason = 'not_found',
  quizName,
  message,
  title,
}: QuizUnavailableScreenProps) {
  const heading = title || quizName || 'Quiz unavailable'
  const body = message || REASON_MESSAGES[reason] || 'Please contact the organizer for a new link.'

  return (
    <div className="app-root">
      <div className="quiz-unavailable-screen">
        <h1 className="typo-title">{heading}</h1>
        <p className="typo-body">{body}</p>
        {reason ? (
          <p className="admin-muted" style={{ marginTop: 16 }}>
            Code: {reason}
          </p>
        ) : null}
      </div>
    </div>
  )
}
