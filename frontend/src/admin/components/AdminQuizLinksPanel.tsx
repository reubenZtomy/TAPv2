import React, { useCallback, useEffect, useState } from 'react'
import {
  createQuizLink,
  deleteQuizLink,
  fetchQuizLinks,
  suggestQuizLinkSlug,
  updateQuizLink,
  type QuizLink,
} from '../api'

type AdminQuizLinksPanelProps = {
  quizId: number
  quizName: string
  quizStatus: string
  defaultLanguage?: string
  onMessage?: (msg: string) => void
  onError?: (msg: string) => void
}

export function AdminQuizLinksPanel({
  quizId,
  quizName,
  quizStatus,
  defaultLanguage,
  onMessage,
  onError,
}: AdminQuizLinksPanelProps) {
  const [links, setLinks] = useState<QuizLink[]>([])
  const [loading, setLoading] = useState(true)
  const [linkName, setLinkName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const publicBase =
    typeof window !== 'undefined' ? `${window.location.origin}/q/` : '/q/'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchQuizLinks(quizId)
      setLinks(data.links)
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to load links')
    } finally {
      setLoading(false)
    }
  }, [quizId, onError])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!linkName.trim()) return
    const t = window.setTimeout(() => {
      void suggestQuizLinkSlug(quizId, linkName)
        .then((r) => setSlug(r.slug))
        .catch(() => {})
    }, 300)
    return () => window.clearTimeout(t)
  }, [linkName, quizId])

  const handleCreate = async () => {
    if (!linkName.trim() || !slug.trim()) return
    setCreating(true)
    try {
      await createQuizLink(quizId, {
        link_name: linkName.trim(),
        slug: slug.trim(),
        status: 'active',
        default_language: defaultLanguage,
      })
      setLinkName('')
      setSlug('')
      await load()
      onMessage?.('Public link created')
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Create link failed')
    } finally {
      setCreating(false)
    }
  }

  const copyUrl = (linkSlug: string) => {
    const url = `${publicBase}${linkSlug}`
    void navigator.clipboard.writeText(url).then(() => onMessage?.('Link copied to clipboard'))
  }

  return (
    <section className="admin-panel" id="builder-links">
      <h2 className="admin-section-title">Public quiz links</h2>
      <p className="admin-muted">
        Share a URL like <code>{publicBase}your-slug</code>. The quiz must be{' '}
        <strong>published (active)</strong> and the link must be <strong>active</strong> for
        students to see it. Current quiz status: <strong>{quizStatus}</strong>.
      </p>

      {loading ? (
        <p className="admin-muted">Loading links…</p>
      ) : links.length === 0 ? (
        <p className="admin-muted">No public links yet. Create one below.</p>
      ) : (
        <ul className="admin-link-list">
          {links.map((link) => (
            <li key={link.id} className="admin-link-row">
              <div>
                <strong>{link.link_name}</strong>
                <span className="admin-muted"> /q/{link.slug}</span>
                <span className={`admin-link-status admin-link-status--${link.status}`}>
                  {link.status}
                </span>
              </div>
              <div className="admin-toolbar">
                <button type="button" className="admin-btn admin-btn--small" onClick={() => copyUrl(link.slug)}>
                  Copy URL
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={() =>
                    void updateQuizLink(link.id, {
                      status: link.status === 'active' ? 'inactive' : 'active',
                    }).then(() => load())
                  }
                >
                  {link.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--small"
                  onClick={() =>
                    void deleteQuizLink(link.id).then(() => {
                      void load()
                      onMessage?.('Link removed')
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-add-link-box">
        <h3 className="admin-section-subtitle">New link</h3>
        <div className="admin-toolbar admin-toolbar--stack">
          <input
            className="admin-input"
            placeholder="Link name (e.g. Spring 2026 cohort)"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
          />
          <input
            className="admin-input"
            placeholder="URL slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={creating || !linkName.trim() || !slug.trim()}
            onClick={() => void handleCreate()}
          >
            Create public link
          </button>
        </div>
        {quizName ? (
          <p className="admin-muted" style={{ marginTop: 8 }}>
            Suggested from quiz name: use slug <code>{slug || '…'}</code>
          </p>
        ) : null}
      </div>
    </section>
  )
}
