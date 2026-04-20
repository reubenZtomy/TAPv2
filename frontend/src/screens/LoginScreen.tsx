import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Title, Body } from '../components/Typography'

type LoginScreenProps = {
  onLoggedIn: (token: string) => void
  onGoRegister: () => void
}

export function LoginScreen({ onLoggedIn, onGoRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('asq_token', data.token)
      onLoggedIn(data.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="screen-content auth-content">
        <Title>Welcome back</Title>
        <Body align="center">Log in to continue</Body>
        {error ? <div className="auth-error">{error}</div> : null}
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-label">
            <span>Email</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            <span>Password</span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </Button>
        </form>
        <button className="auth-link" onClick={onGoRegister} type="button">
          New here? Create an account
        </button>
      </div>
    </div>
  )
}
