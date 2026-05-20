import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function RegisterPage() {
  const { ekadashiId } = useParams()
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', comments: '' })
  const [selections, setSelections] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const { data: ekadashi, isLoading } = useQuery({
    queryKey: ['ekadashi', ekadashiId],
    queryFn: () => api.get(`/ekadashi/${ekadashiId}`).then(r => r.data)
  })

  const toggleItem = (itemId) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
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
      await api.post('/registrations/', { ekadashi_id: ekadashiId, ...form, reference_item_ids })
      setSubmitted(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.')
    }
  }

  if (isLoading) return <div className="loading">Loading...</div>
  if (!ekadashi) return <div className="loading">Session not found.</div>
  if (!ekadashi.is_registration_open) return (
    <div className="page text-center" style={{ paddingTop: '4rem' }}>
      <h2>Registration is closed</h2>
      <p className="text-muted mt-1">Please contact the organizers for more information.</p>
    </div>
  )

  if (submitted) return (
    <div className="page text-center" style={{ paddingTop: '4rem' }}>
      <h1>🙏 Thank you!</h1>
      <p className="text-muted mt-2">Your registration has been received. We look forward to the Bhajane.</p>
    </div>
  )

  return (
    <div className="page" style={{ maxWidth: '640px' }}>
      <div className="text-center mt-2" style={{ marginBottom: '2rem' }}>
        <h1>॥ Hari Om ॥</h1>
        <h2 style={{ marginTop: '0.5rem' }}>{ekadashi.title}</h2>
        <p className="text-muted mt-1">
          {new Date(ekadashi.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}{ekadashi.start_time} – {ekadashi.end_time} CST
        </p>
      </div>

      <div className="card">
        <h3>Your Details</h3>
        <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="field">
            <label>First Name *</label>
            <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Enter here" />
          </div>
          <div className="field">
            <label>Last Name *</label>
            <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Enter here" />
          </div>
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Optional" />
        </div>
      </div>

      <div className="card mt-2">
        <h3>What are you familiar with?</h3>
        <p className="text-muted mt-1" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Select everything you know and are comfortable performing.
        </p>
        {ekadashi.reference_items?.map(item => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 0', borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.92rem' }}>{item.title}</span>
            <button
              className={`btn btn-sm ${selections[item.id] ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleItem(item.id)}
            >
              {selections[item.id] ? '✓ Familiar' : 'Familiar'}
            </button>
          </div>
        ))}
      </div>

      <div className="card mt-2">
        <div className="field">
          <label>Additional comments</label>
          <textarea rows={3} value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} placeholder="Any notes for the organizers..." />
        </div>
      </div>

      {error && <p style={{ color: 'var(--error)', marginTop: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}

      <button className="btn btn-primary mt-2" style={{ width: '100%', padding: '0.8rem' }} onClick={submit}>
        Submit Registration
      </button>
    </div>
  )
}