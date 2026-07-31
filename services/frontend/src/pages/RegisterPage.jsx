import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const { register }            = useAuth()
  const navigate                = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError(null)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError('Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logoIcon}>⬡</span>
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.sub}>Start shopping in seconds</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Full name</label>
            <input style={styles.input} type="text" placeholder="Jane Smith"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="Min. 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    background: '#ffffff', borderRadius: 16,
    border: '1px solid #e2e8f0', padding: '40px',
    width: '100%', maxWidth: 400,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 32, color: '#4f46e5' },
  title: { fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 14,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 500, color: '#374151' },
  input: {
    padding: '10px 14px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 15, color: '#0f172a',
  },
  submitBtn: {
    background: '#4f46e5', color: '#ffffff',
    padding: '11px', borderRadius: 8,
    fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4,
  },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' },
  footerLink: { color: '#4f46e5', fontWeight: 500 },
}
