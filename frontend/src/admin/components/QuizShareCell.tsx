import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { QuizRecord } from '../api'

type QuizShareCellProps = {
  quiz: QuizRecord
  onCopied?: () => void
}

function publicQuizUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/q/${slug}`
}

function IconCopy() {
  return (
    <svg className="admin-share-copy-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
  )
}

export function QuizShareCell({ quiz, onCopied }: QuizShareCellProps) {
  const [copied, setCopied] = useState(false)

  if (quiz.status === 'draft') {
    return <span className="admin-share-state admin-share-state--muted">Not published</span>
  }

  const slug = quiz.share_slug?.trim()
  if (!slug) {
    return (
      <span className="admin-share-state">
        <span className="admin-share-state--muted">No link yet</span>
        <Link to={`/admin/quizzes/${quiz.id}/builder?tab=links`} className="admin-share-set-link">
          Add link
        </Link>
      </span>
    )
  }

  const url = publicQuizUrl(slug)
  const internalOnly = quiz.status !== 'active'

  const handleCopy = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      onCopied?.()
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="admin-share-cell">
      <button
        type="button"
        className={`admin-share-copy-btn${copied ? ' is-copied' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copied!' : `Copy ${url}`}
        aria-label={copied ? 'Link copied' : `Copy share link for ${quiz.name}`}
      >
        <IconCopy />
        <span className="admin-share-copy-label">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      {internalOnly ? (
        <span className="admin-share-internal-hint" title="Quiz is not active — link is for internal preview">
          Internal
        </span>
      ) : null}
    </div>
  )
}
