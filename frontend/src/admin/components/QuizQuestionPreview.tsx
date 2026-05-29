import React from 'react'
import { isLayoutTypeSet, questionLayoutTypeLabel } from '../builderDisplay'
import type { QuizQuestion } from '../builderTypes'

type QuizQuestionPreviewProps = {
  question: QuizQuestion
  languageCode: string
}

export function QuizQuestionPreview({ question, languageCode }: QuizQuestionPreviewProps) {
  const t = question.translations[languageCode]
  const title = t?.title || question.question_key
  const subtitle = t?.subtitle

  return (
    <div className="admin-mobile-screen-wrap admin-mobile-screen-wrap--question">
      <div className="screen admin-question-preview-screen">
        {isLayoutTypeSet(question.layout_type) ? (
          <p className="admin-preview-layout-tag">{questionLayoutTypeLabel(question.layout_type)}</p>
        ) : null}
        <h2 className="admin-preview-title">{title}</h2>
        {subtitle ? <p className="admin-preview-subtitle">{subtitle}</p> : null}
        <div className="admin-preview-options">
          {question.options.length === 0 ? (
            <p className="admin-muted">No options yet</p>
          ) : (
            question.options.map((opt) => (
              <div key={opt.id} className="admin-preview-option">
                {opt.image_url ? (
                  <img src={opt.image_url} alt="" className="admin-preview-option-img" draggable={false} />
                ) : null}
                <span>{opt.labels[languageCode] || opt.option_key}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
