import React, { useState } from 'react'
import { Button } from '../components/Button'

type DynamicQuestionScreenProps = {
  questionKey: string
  questionText: string
  optionLabels: Record<string, string>
  onBack: () => void
  onConfirm: (choice: string) => void
  backText?: string
  confirmText?: string
}

export function DynamicQuestionScreen({
  questionKey,
  questionText,
  optionLabels,
  onBack,
  onConfirm,
  backText = 'Back',
  confirmText = 'Confirm',
}: DynamicQuestionScreenProps) {
  const keys = Object.keys(optionLabels)
  const [selected, setSelected] = useState(keys[0] ?? '')

  return (
    <div className="screen dynamic-question-screen">
      <div className="screen-content">
        <p className="admin-muted" style={{ fontSize: 14, marginBottom: 8 }}>
          {questionKey}
        </p>
        <h2 className="typo-title" style={{ fontSize: 28, marginBottom: 16 }}>
          {questionText}
        </h2>
        <div className="dynamic-question-options">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              className={`dynamic-question-option ${selected === key ? 'is-selected' : ''}`}
              onClick={() => setSelected(key)}
            >
              {optionLabels[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="screen-actions">
        <Button variant="secondary" onClick={onBack}>
          {backText}
        </Button>
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  )
}
