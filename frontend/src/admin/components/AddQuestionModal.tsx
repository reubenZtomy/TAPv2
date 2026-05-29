import React, { useEffect, useState } from 'react'

type AddQuestionModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (screenName: string) => Promise<void>
}

function screenNameToKey(name: string): string {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return key || 'screen'
}

export function AddQuestionModal({ open, onClose, onSubmit }: AddQuestionModalProps) {
  const [screenName, setScreenName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setScreenName('')
    setError('')
    setSubmitting(false)
    document.body.classList.add('admin-modal-open')
    return () => {
      document.body.classList.remove('admin-modal-open')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = screenName.trim()
    if (!trimmed) {
      setError('Screen name is required.')
      return
    }
    if (!screenNameToKey(trimmed)) {
      setError('Enter a valid screen name (letters or numbers).')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-question-modal-title"
      onClick={onClose}
    >
      <div className="admin-modal admin-modal--compact" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h2 id="add-question-modal-title" className="admin-section-title">
            Add question
          </h2>
        </header>
        <form className="admin-modal-body" onSubmit={(e) => void handleSubmit(e)}>
          <label className="admin-add-question-field">
            <span className="admin-add-question-label">Screen name</span>
            <input
              className="admin-input"
              type="text"
              placeholder="e.g. Passion, Partner choice"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              autoFocus
              disabled={submitting}
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <div className="admin-modal-actions">
            <button type="button" className="admin-btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
