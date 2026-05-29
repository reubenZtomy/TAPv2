import React, { useEffect, useState } from 'react'
import { deleteQuizFont, uploadQuizFont } from '../api'
import type { QuizBuilderPayload } from '../builderTypes'
import type { QuizCustomFont } from '../../utils/quizFont'

type QuizFontFieldsProps = {
  quizId: number
  customFont: QuizCustomFont | null | undefined
  onUpdated: (quiz: QuizBuilderPayload) => void
}

export function QuizFontFields({ quizId, customFont, onUpdated }: QuizFontFieldsProps) {
  const [familyName, setFamilyName] = useState(customFont?.family ?? '')

  useEffect(() => {
    setFamilyName(customFont?.family ?? '')
  }, [customFont?.family, customFont?.url])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const hasFont = Boolean(customFont?.url && customFont.family)

  const handleUpload = async (file: File) => {
    const name = familyName.trim()
    if (!name) {
      setError('Enter a name for your font before uploading.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await uploadQuizFont(quizId, file, name)
      onUpdated(res.quiz)
      setFamilyName(res.custom_font?.family ?? name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Font upload failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!hasFont) return
    if (!window.confirm('Remove the custom font from this quiz? Layout text will use the default font.')) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await deleteQuizFont(quizId)
      onUpdated(res.quiz)
      setFamilyName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove font')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-inspector-section">
      <h4 className="admin-inspector-heading">Quiz font</h4>
      <p className="admin-muted admin-inspector-note" style={{ marginTop: 0 }}>
        Upload one font file for this quiz. It applies to all layout text and buttons in preview and
        the published quiz. Uploading a new file replaces the previous font.
      </p>

      <label className="admin-inspector-field">
        <span className="admin-inspector-label">Font name</span>
        <input
          className="admin-input admin-inspector-input"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="e.g. My Quiz Font"
          disabled={busy}
        />
      </label>

      {hasFont ? (
        <p className="admin-muted admin-inspector-note">
          Current font: <strong>{customFont!.family}</strong>
        </p>
      ) : null}

      <label className="admin-inspector-field">
        <span className="admin-inspector-label">Font file (.ttf, .otf, .woff, .woff2)</span>
        <input
          type="file"
          className="admin-input admin-inspector-input"
          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ''
          }}
        />
      </label>

      {hasFont ? (
        <button
          type="button"
          className="admin-btn admin-btn--danger admin-btn--small"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          Delete font
        </button>
      ) : null}

      {error ? <p className="admin-error admin-inspector-note">{error}</p> : null}
    </section>
  )
}
