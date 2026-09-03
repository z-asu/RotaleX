import React, { useState } from 'react'
import { login, register, saveAuth } from '../api'
import { showSuccess } from '../swal'

export default function Login({ onLogin, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const data = await login(form.username, form.password)
        saveAuth(data)
        onLogin(data.user)
      } else {
        await register(form.username, form.email, form.password)
        await showSuccess('Registration Successful', 'Account created. Please login.')
        setMode('login')
        setForm({ ...form, password: '' })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-brand">
          <img src="/images/Rotalex.png" alt="ROTALEX" className="auth-logo" />
          <span className="brand-text">ROTALEX</span>
        </div>
        <h2 className="auth-title">{mode === 'login' ? 'Login' : 'Register'}</h2>
        <p className="auth-sub">
          {mode === 'login' ? 'Welcome back to the club' : 'Join the gaming club'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </label>
          {mode === 'register' && (
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-add auth-submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('register'); setError('') }}>Register here</button></>
          ) : (
            <>Have an account? <button onClick={() => { setMode('login'); setError('') }}>Login here</button></>
          )}
        </p>
      </div>
    </div>
  )
}
