import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(212,104,10,0.08) 0%, transparent 62%), var(--cream)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Brand mark above the form */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500,
            color: 'var(--charcoal)', letterSpacing: '0.03em', lineHeight: 1.2,
          }}>
            ॥ Ekadashi Scheduler ॥
          </h1>
          <div style={{ width: '40px', height: '2px', background: 'var(--saffron)', margin: '0.85rem auto 0.8rem' }} />
          <p style={{
            color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.14em',
            textTransform: 'uppercase', fontFamily: 'var(--font-body)',
          }}>
            Admin Portal
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <div className="field">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.84rem', marginBottom: '0.9rem' }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.78rem', marginTop: '0.25rem' }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  )
}
