import React, { useEffect, useState } from 'react'

type NewQuizModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function NewQuizModal({ open, onClose, onSubmit }: NewQuizModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
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
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Quiz name is required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-quiz-modal-title"
      onClick={onClose}
    >
      <div className="admin-modal admin-modal--compact" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h2 id="new-quiz-modal-title" className="admin-section-title">
            New Quiz
          </h2>
        </header>
        <form className="admin-modal-body" onSubmit={(e) => void handleSubmit(e)}>
          <label className="admin-inspector-field">
            <span className="admin-inspector-label">Quiz name</span>
            <input
              className="admin-input"
              type="text"
              placeholder="Enter quiz name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              {submitting ? 'Creating…' : 'Create quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
