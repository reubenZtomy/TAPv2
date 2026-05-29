import React, { useEffect, useState } from 'react'
import { fetchDashboardStats, type DashboardStats } from '../api'
export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
  }, [])

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-description">Overview of quizzes, submissions, and usage.</p>
      </header>
      {error && <p className="admin-error admin-page-error">{error}</p>}
      {stats && (
        <section className="admin-panel" aria-label="Dashboard statistics">
        <div className="admin-panel-body admin-panel-body--padded">
        <div className="admin-cards">
          <div className="admin-card">
            <p className="admin-card-label">Total quizzes</p>
            <p className="admin-card-value">{stats.total_quizzes}</p>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Active quizzes</p>
            <p className="admin-card-value">{stats.active_quizzes}</p>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Total submissions</p>
            <p className="admin-card-value">{stats.total_submissions}</p>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Today&apos;s submissions</p>
            <p className="admin-card-value">{stats.today_submissions}</p>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Top personality</p>
            <p className="admin-card-value admin-card-value--sm">
              {stats.top_personality.id ?? '—'}
            </p>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Top language</p>
            <p className="admin-card-value admin-card-value--sm">
              {stats.top_language.code ?? '—'}
            </p>
          </div>
        </div>
        </div>
        </section>
      )}
    </div>
  )
}
