import React, { useEffect } from 'react'
import { isResultScreenDesigned, type CustomResultRule } from '../customResults'
import { getLayoutElements, getScreenBackgroundSettings } from '../layoutTypes'
import { QuizLayoutScreen } from '../../layout/QuizLayoutScreen'
import { AdminDeviceFrame } from './AdminDeviceFrame'
import type { QuizCustomFont } from '../../utils/quizFont'

type ResultDesignPreviewModalProps = {
  open: boolean
  onClose: () => void
  rule: CustomResultRule | null
  customFont?: QuizCustomFont | null
}

export function ResultDesignPreviewModal({ open, onClose, rule, customFont }: ResultDesignPreviewModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('admin-preview-modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('admin-preview-modal-open')
    }
  }, [open, onClose])

  if (!open || !rule || !isResultScreenDesigned(rule)) return null

  const elements = getLayoutElements(rule.layout)
  const screenBackground = getScreenBackgroundSettings(rule.layout)
  const title = rule.name.trim() || rule.resultTitle.trim() || 'Result'

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-design-preview-title"
    >
      <div className="admin-modal admin-modal--preview admin-modal--design-view">
        <header className="admin-modal-header">
          <h2 id="result-design-preview-title" className="admin-section-title">
            Preview — {title}
          </h2>
          <button type="button" className="admin-btn" onClick={onClose} aria-label="Close preview">
            Close
          </button>
        </header>

        <div className="admin-preview-modal-body admin-preview-modal-body--centered">
          <div className="admin-preview-device-fit">
            <div className="admin-preview-device-fit__inner">
              <AdminDeviceFrame screenBackground={screenBackground} customFont={customFont}>
                <QuizLayoutScreen
                  elements={elements}
                  screenBackground={screenBackground}
                  customFont={customFont}
                />
              </AdminDeviceFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
