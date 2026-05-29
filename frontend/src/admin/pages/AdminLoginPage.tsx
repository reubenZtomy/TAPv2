import React, { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { adminLogin } from '../api'

import { AdminThemeToggle } from '../AdminThemeToggle'

import { useAdminThemeContext } from '../AdminThemeContext'



type AdminLoginPageProps = {

  onLoggedIn: () => void

}



export function AdminLoginPage({ onLoggedIn }: AdminLoginPageProps) {

  const navigate = useNavigate()

  const { theme, toggleTheme } = useAdminThemeContext()

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [error, setError] = useState('')

  const [loading, setLoading] = useState(false)



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError('')

    setLoading(true)

    try {

      await adminLogin(email, password)

      onLoggedIn()

      navigate('/admin/dashboard')

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Login failed')

    } finally {

      setLoading(false)

    }

  }



  return (
    <div className="admin-login-wrap">
      <div className="admin-login-topbar">
        <AdminThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="admin-login-inner">
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <h1 className="admin-page-title">Admin login</h1>
          <p className="admin-login-subtitle">Sign in to manage quizzes and content.</p>

          {error && <p className="admin-error" role="alert">{error}</p>}

          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            className="admin-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="admin-btn admin-btn--block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <Link to="/admin/dashboard" className="admin-link-back admin-login-back-link">
            ← Admin dashboard
          </Link>
        </form>
      </div>
    </div>
  )

}


