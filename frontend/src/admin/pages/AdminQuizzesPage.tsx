import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NewQuizModal } from '../components/NewQuizModal'
import { QuizShareCell } from '../components/QuizShareCell'
import {
  createQuiz,
  deleteQuiz,
  fetchQuizzes,
  // fetchTablePreferences,
  // saveTablePreferences,
  updateQuizStatus,
  type QuizRecord,
} from '../api'

// const TABLE_NAME = 'quizzes'

// const ALL_COLUMNS: { key: string; label: string }[] = [
//   { key: 'name', label: 'Name' },
//   { key: 'status', label: 'Status' },
//   { key: 'default_language', label: 'Language' },
//   { key: 'result_engine_type', label: 'Engine' },
//   { key: 'submission_count', label: 'Submissions' },
//   { key: 'updated_at', label: 'Updated' },
// ]

// const DEFAULT_VISIBLE = ['name', 'status', 'default_language', 'submission_count', 'updated_at']

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

export function AdminQuizzesPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: PAGE_SIZE,
    total: 0,
    total_pages: 1,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadQuizzes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const data = await fetchQuizzes(params)
      setQuizzes(data.quizzes)
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    void loadQuizzes()
  }, [loadQuizzes])

  // const loadPreferences = useCallback(async () => {
  //   try {
  //     const prefs = await fetchTablePreferences(TABLE_NAME)
  //     if (prefs.columns?.length) setVisibleColumns(prefs.columns)
  //     if (prefs.filters?.status !== undefined) setStatusFilter(prefs.filters.status)
  //     if (prefs.filters?.search !== undefined) setSearch(prefs.filters.search)
  //   } catch {
  //     /* use defaults */
  //   }
  // }, [])

  // useEffect(() => {
  //   void loadPreferences()
  // }, [loadPreferences])

  // const persistPreferences = async (cols: string[], filters: Record<string, string>) => {
  //   try {
  //     await saveTablePreferences(TABLE_NAME, { columns: cols, filters })
  //   } catch {
  //     /* silent */
  //   }
  // }

  // const handleResetFilters = () => {
  //   setSearch('')
  //   setStatusFilter('')
  //   setVisibleColumns(DEFAULT_VISIBLE)
  //   void persistPreferences(DEFAULT_VISIBLE, {})
  //   setPagination((p) => ({ ...p, page: 1 }))
  // }

  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  const isSystemQuiz = (quiz: QuizRecord) => quiz.quiz_uuid === 'tap-system-default'

  const handleCreateQuiz = async (name: string) => {
    const { quiz } = await createQuiz({ name, status: 'draft' })
    setCreateOpen(false)
    navigate(`/admin/quizzes/${quiz.id}/builder`)
  }

  const handleDelete = async (quiz: QuizRecord) => {
    if (isSystemQuiz(quiz)) return
    if (!window.confirm(`Delete "${quiz.name}"? This cannot be undone.`)) return
    setDeletingId(quiz.id)
    setError('')
    try {
      await deleteQuiz(quiz.id)
      await loadQuizzes()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (quiz: QuizRecord) => {
    if (quiz.status === 'archived') return
    const next = quiz.status === 'active' ? 'inactive' : 'active'
    setTogglingId(quiz.id)
    setError('')
    try {
      const res = await updateQuizStatus(quiz.id, next)
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, status: res.quiz.status } : q))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setTogglingId(null)
    }
  }

  // const handleArchive = async (id: number) => {
  //   if (!window.confirm('Archive this quiz?')) return
  //   try {
  //     await archiveQuiz(id)
  //     await loadQuizzes()
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : 'Archive failed')
  //   }
  // }

  // const handleCreate = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (!newName.trim()) return
  //   try {
  //     await createQuiz({ name: newName.trim() })
  //     setNewName('')
  //     await loadQuizzes()
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Create failed')
  //   }
  // }

  // const columnsToShow = useMemo(
  //   () => ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)),
  //   [visibleColumns]
  // )

  // const renderCell = (quiz: QuizRecord, key: string) => {
  //   switch (key) {
  //     case 'name':
  //       return quiz.name
  //     case 'status':
  //       return <span className={`admin-status admin-status--${quiz.status}`}>{quiz.status}</span>
  //     case 'default_language':
  //       return quiz.default_language
  //     case 'result_engine_type':
  //       return quiz.result_engine_type
  //     case 'submission_count':
  //       return quiz.submission_count ?? 0
  //     case 'updated_at':
  //       return new Date(quiz.updated_at).toLocaleString()
  //     default:
  //       return '—'
  //   }
  // }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">Quizzes</h1>
        <p className="admin-page-description">
          Search, enable, and edit quizzes. Create a new quiz to get started.
        </p>
      </header>

      {error && <p className="admin-error admin-page-error">{error}</p>}
      {shareMessage && <p className="admin-builder-message admin-muted">{shareMessage}</p>}

      <section className="admin-panel" aria-label="Quiz list">
        <div className="admin-panel-toolbar">
          <div className="admin-toolbar-start">
            <input
              type="search"
              className="admin-input admin-quizzes-search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search quizzes"
            />
          </div>
          <div className="admin-toolbar-end">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setCreateOpen(true)}
            >
              New Quiz
            </button>
          </div>
        </div>

        <div className="admin-panel-body">
        {loading ? (
          <p className="admin-panel-message">Loading…</p>
        ) : quizzes.length === 0 ? (
          <p className="admin-panel-message admin-muted">
            {debouncedSearch ? `No quizzes match "${debouncedSearch}".` : 'No quizzes yet.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Active</th>
                  <th>Language</th>
                  <th>Submissions</th>
                  <th>Share</th>
                  <th>Updated</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td>{quiz.name}</td>
                    <td>
                      <span className={`admin-status admin-status--${quiz.status}`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-active-cell">
                        <button
                          type="button"
                          className={`admin-toggle ${quiz.status === 'active' ? 'is-on' : 'is-off'}`}
                          role="switch"
                          aria-checked={quiz.status === 'active'}
                          aria-label={
                            quiz.status === 'active'
                              ? `${quiz.name}: active — click to disable`
                              : `${quiz.name}: disabled — click to enable`
                          }
                          disabled={quiz.status === 'archived' || togglingId === quiz.id}
                          onClick={() => void handleToggleActive(quiz)}
                        />
                        <span
                          className={`admin-toggle-label ${quiz.status === 'active' ? 'is-on' : 'is-off'}`}
                        >
                          {quiz.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td>{quiz.default_language}</td>
                    <td>{quiz.submission_count ?? 0}</td>
                    <td>
                      <QuizShareCell
                        quiz={quiz}
                        onCopied={() => {
                          setShareMessage(`Copied link for “${quiz.name}”.`)
                          window.setTimeout(() => setShareMessage(''), 2500)
                        }}
                      />
                    </td>
                    <td>{new Date(quiz.updated_at).toLocaleString()}</td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          to={`/admin/quizzes/${quiz.id}/builder`}
                          className="admin-btn admin-btn--table-edit"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn--table-delete"
                          disabled={isSystemQuiz(quiz) || deletingId === quiz.id}
                          title={
                            isSystemQuiz(quiz)
                              ? 'The default system quiz cannot be deleted'
                              : `Delete ${quiz.name}`
                          }
                          onClick={() => void handleDelete(quiz)}
                        >
                          {deletingId === quiz.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        {!loading && pagination.total > 0 && (
          <footer className="admin-panel-footer">
            <div className="admin-table-pagination">
              <button
                type="button"
                className="admin-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="admin-pagination-text">
                Page {pagination.page} of {pagination.total_pages}
                <span className="admin-pagination-total"> ({pagination.total} total)</span>
              </span>
              <button
                type="button"
                className="admin-btn"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </section>

      <NewQuizModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateQuiz}
      />

      {/* —— Previous quiz management UI (commented out for now) —— */}
      {/*
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <form className="admin-toolbar" onSubmit={handleCreate}>
          <input
            className="admin-input"
            placeholder="New quiz name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="admin-btn">
            Create quiz
          </button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => void persistPreferences(visibleColumns, { status: statusFilter, search })}
          />
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              void persistPreferences(visibleColumns, { status: e.target.value, search })
            }}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <button type="button" className="admin-btn" onClick={() => void loadQuizzes()}>
            Apply filters
          </button>
          <button type="button" className="admin-btn" onClick={handleResetFilters}>
            Reset filters
          </button>
        </div>

        <details className="admin-details" style={{ marginBottom: 12 }}>
          <summary>Visible columns</summary>
          <div className="admin-toolbar" style={{ marginTop: 8 }}>
            {ALL_COLUMNS.map((col) => (
              <label key={col.key}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...visibleColumns, col.key]
                      : visibleColumns.filter((k) => k !== col.key)
                    if (next.length === 0) return
                    setVisibleColumns(next)
                    void persistPreferences(next, { status: statusFilter, search })
                  }}
                />{' '}
                {col.label}
              </label>
            ))}
          </div>
        </details>

        {loading ? (
          <p className="admin-pagination-text">Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {columnsToShow.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    {columnsToShow.map((c) => (
                      <td key={c.key}>{renderCell(quiz, c.key)}</td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle ${quiz.status === 'active' ? 'is-on' : ''}`}
                        aria-label={quiz.status === 'active' ? 'Deactivate' : 'Activate'}
                        disabled={quiz.status === 'archived'}
                        onClick={() => void handleToggleActive(quiz)}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/admin/quizzes/${quiz.id}/builder`}
                        className="admin-btn"
                        style={{ display: 'inline-block', textDecoration: 'none', marginRight: 8 }}
                      >
                        Builder
                      </Link>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={quiz.status === 'archived'}
                        onClick={() => void handleArchive(quiz.id)}
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-toolbar" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="admin-btn"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </button>
          <span className="admin-pagination-text">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
          </span>
          <button
            type="button"
            className="admin-btn"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
      */}
    </div>
  )
}
