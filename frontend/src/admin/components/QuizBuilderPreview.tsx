import React from 'react'
import type { QuizBuilderPayload, QuizQuestion } from '../builderTypes'

type QuizBuilderPreviewProps = {
  quiz: QuizBuilderPayload
  question: QuizQuestion | null
  languageCode: string
}

export function QuizBuilderPreview({ quiz, question, languageCode }: QuizBuilderPreviewProps) {
  const lang = languageCode || quiz.languages.find((l) => l.is_default)?.language_code || 'English'

  return (
    <div className="admin-preview-device">
      <div className="admin-preview-device-inner">
        <p className="admin-preview-badge">{quiz.status} · {lang}</p>
        {question ? (
          <>
            <p className="admin-preview-layout">{question.layout_type.replace(/_/g, ' ')}</p>
            <h3 className="admin-preview-title">
              {question.translations[lang]?.title || question.question_key}
            </h3>
            {question.translations[lang]?.subtitle && (
              <p className="admin-preview-subtitle">{question.translations[lang].subtitle}</p>
            )}
            <div className="admin-preview-options">
              {question.options.length === 0 ? (
                <p className="admin-muted">No options yet</p>
              ) : (
                question.options.map((opt) => (
                  <div key={opt.id} className="admin-preview-option">
                    {opt.image_url ? (
                      <img src={opt.image_url} alt="" className="admin-preview-option-img" />
                    ) : null}
                    <span>{opt.labels[lang] || opt.option_key}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="admin-muted">Select a question to preview</p>
        )}
      </div>
    </div>
  )
}
