import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Title, Body } from '../components/Typography'

type RegisterScreenProps = {
  onRegistered: (token: string) => void
  onGoLogin: () => void
}

export function RegisterScreen({ onRegistered, onGoLogin }: RegisterScreenProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      localStorage.setItem('asq_token', data.token)
      onRegistered(data.token)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="screen-content auth-content">
        <Title>Create your account</Title>
        <Body align="center">It takes less than a minute</Body>
        {error ? <div className="auth-error">{error}</div> : null}
        <form className="auth-form" onSubmit={handleRegister}>
          <label className="auth-label">
            <span>Name</span>
            <input
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
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
            {loading ? 'Creating…' : 'Create Account'}
          </Button>
        </form>
        <button className="auth-link" onClick={onGoLogin} type="button">
          Already have an account? Log in
        </button>
      </div>
    </div>
  )
}
