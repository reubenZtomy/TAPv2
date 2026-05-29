import React from 'react'

type LanguageImportSuccessModalProps = {
  open: boolean
  languageName: string
  onClose: () => void
  onPlaceSwitcher: () => void
}

export function LanguageImportSuccessModal({
  open,
  languageName,
  onClose,
  onPlaceSwitcher,
}: LanguageImportSuccessModalProps) {
  if (!open) return null

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-modal admin-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-import-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-modal-header">
          <h3 id="language-import-success-title" className="admin-modal-title">
            Language added
          </h3>
        </header>
        <div className="admin-modal-body">
          <p>
            Language successfully added for <strong>{languageName}</strong>. Please add the language
            switcher element on your design.
          </p>
        </div>
        <footer className="admin-modal-footer">
          <button type="button" className="admin-btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={onPlaceSwitcher}>
            Place language switch element
          </button>
        </footer>
      </div>
    </div>
  )
}
