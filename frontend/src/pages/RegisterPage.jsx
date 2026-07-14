import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function RegisterPage() {
  const { ekadashiId } = useParams()
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', comments: '' })
  const [selections, setSelections] = useState({})
  const [songRequests, setSongRequests] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const { data: ekadashi, isLoading } = useQuery({
    queryKey: ['ekadashi', ekadashiId],
    queryFn: () => api.get(`/ekadashi/${ekadashiId}`).then(r => r.data)
  })

  const toggleItem = (itemId) => {
    setSelections(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] }
      if (!next[itemId]) setSongRequests(r => { const c = { ...r }; delete c[itemId]; return c })
      return next
    })
  }

  const submit = async () => {
    setError('')
    if (!form.first_name || !form.last_name) {
      setError('Please enter your first and last name.')
      return
    }
    const reference_item_ids = Object.entries(selections)
      .filter(([, selected]) => selected)
      .map(([id]) => id)

    try {
      await api.post('/registrations/', { ekadashi_id: ekadashiId, ...form, reference_item_ids, song_requests: songRequests })
      setSubmitted(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.')
    }
  }

  if (isLoading) return <div className="loading">Loading…</div>
  if (!ekadashi) return <div className="loading">Session not found.</div>

  if (!ekadashi.is_registration_open) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ width: '40px', height: '2px', background: 'var(--border)', margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--charcoal)' }}>
          Registration is closed
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.75rem', fontSize: '0.92rem' }}>
          Please contact the organizers for more information.
        </p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--saffron)', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: '0.75rem' }}>
          ॥ Hare Sreenivasa ॥
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--charcoal)', letterSpacing: '-0.01em' }}>
          Thank you
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'var(--saffron)', margin: '1rem auto' }} />
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Your registration has been received.<br />We look forward to the Bhajane.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem 4rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(212,104,10,0.05) 0%, transparent 55%), var(--cream)',
      minHeight: '100vh',
    }}>
      <style>{`input, textarea, select { font-size: 16px !important; }`}</style>

      {/* Ceremonial header */}
      <div style={{ textAlign: 'center', paddingTop: '3.5rem', paddingBottom: '2.5rem' }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--saffron)',
          letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: '0.9rem',
        }}>
          ॥ Hare Sreenivasa ॥
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontWeight: 500,
          color: 'var(--charcoal)', letterSpacing: '-0.01em', lineHeight: 1.15,
        }}>
          {ekadashi.title}
        </h1>
        {/* Ornamental divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.9rem', margin: '1.1rem 0 0.9rem' }}>
          <div style={{ width: '48px', height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--saffron)', fontSize: '0.7rem', lineHeight: 1 }}>✦</span>
          <div style={{ width: '48px', height: '1px', background: 'var(--border)' }} />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
          {new Date(ekadashi.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}{ekadashi.start_time} – {ekadashi.end_time} CST
        </p>
      </div>

      {/* Your Details */}
      <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem' }}>
          Your Details
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          <div className="field">
            <label>First Name <span style={{ color: 'var(--saffron)' }}>*</span></label>
            <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Enter here" />
          </div>
          <div className="field">
            <label>Last Name <span style={{ color: 'var(--saffron)' }}>*</span></label>
            <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Enter here" />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Phone <span style={{ color: 'var(--border)' }}>· optional</span></label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Your number" />
        </div>
      </div>

      {/* Reference items */}
      <div className="card mt-2" style={{ boxShadow: 'var(--shadow-md)' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.3rem' }}>
          What are you Requesting?
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginBottom: '1.1rem', lineHeight: 1.5 }}>
          Select everything you know and are comfortable performing.
        </p>

        {ekadashi.reference_items?.map((item, idx) => (
          <div
            key={item.id}
            style={{
              padding: '0.9rem 0',
              borderBottom: idx < ekadashi.reference_items.length - 1 ? '1px solid var(--cream-dk)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem', color: 'var(--charcoal)', flex: 1 }}>{item.title}</span>
              <button
                className={`btn btn-sm ${selections[item.id] ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flexShrink: 0, minHeight: '44px', padding: '0 1rem' }}
                onClick={() => toggleItem(item.id)}
              >
                {selections[item.id] ? '✓ Familiar' : 'Familiar'}
              </button>
            </div>
            {item.is_song_request && selections[item.id] && (
              <input
                style={{ marginTop: '0.5rem', width: '100%', fontSize: '1rem' }}
                placeholder="Which song/stotra? (optional)"
                value={songRequests[item.id] || ''}
                onChange={e => setSongRequests(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      {/* Comments */}
      <div className="card mt-2" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Additional comments <span style={{ color: 'var(--border)' }}>· optional</span></label>
          <textarea
            rows={3}
            value={form.comments}
            onChange={e => setForm(p => ({ ...p, comments: e.target.value }))}
            placeholder="Any notes for the organizers…"
          />
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--error)', marginTop: '0.9rem', fontSize: '0.95rem' }}>{error}</p>
      )}

      <button
        className="btn btn-primary mt-2"
        style={{ width: '100%', padding: '1.1rem', letterSpacing: '0.05em', fontSize: '1rem' }}
        onClick={submit}
      >
        Submit Registration
      </button>

    </div>
  )
}
