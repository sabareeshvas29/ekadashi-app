import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTime } from '../lib/formatTime'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard() {
  const { admin, logout } = useAuth()
  const queryClient = useQueryClient()

  const deleteSession = async (id) => {
    if (!confirm('Are you sure? This will delete all registrations and assignments too.')) return
    await api.delete(`/ekadashi/${id}`)
    queryClient.invalidateQueries(['ekadashi-all'])
  }

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['ekadashi-all'],
    queryFn: () => api.get('/ekadashi/all').then(r => r.data)
  })

  return (
    <>
      <nav className="topnav">
        <span className="topnav-brand">॥ Ekadashi Scheduler ॥</span>
        <div className="flex items-center gap-1">
          {admin?.name && (
            <span className="topnav-meta">{admin.name}</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="page">

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', marginBottom: '0.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', letterSpacing: '-0.01em' }}>
              Bhajane Sessions
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
              Manage Ekadashi events and registrations
            </p>
          </div>
          <Link to="/admin/ekadashi/new" className="btn btn-primary" style={{ flexShrink: 0 }}>
            + New Ekadashi
          </Link>
        </div>

        <hr className="divider" />

        {isLoading && (
          <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginTop: '1rem' }}>
            Loading sessions…
          </p>
        )}

        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sessions.map(session => (
            <div
              key={session.id}
              className="card"
              style={{
                borderLeft: `3px solid ${session.is_registration_open ? 'var(--saffron)' : 'var(--border)'}`,
                borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
                padding: '1.25rem 1.5rem',
              }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                    {session.title}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    {' · '}{formatTime(session.start_time)} – {formatTime(session.end_time)} CST
                  </p>
                </div>
                <span className={`badge badge-${session.is_registration_open ? 'open' : 'closed'}`} style={{ flexShrink: 0, marginTop: '0.2rem' }}>
                  {session.is_registration_open ? 'Registration Open' : 'Closed'}
                </span>
              </div>

              {/* Action row */}
              <div style={{
                display: 'flex', gap: '0.5rem', marginTop: '1rem',
                paddingTop: '0.9rem', borderTop: '1px solid var(--cream-dk)',
              }}>
                <Link to={`/admin/ekadashi/${session.id}/assign`} className="btn btn-primary btn-sm">
                  Assign Slots
                </Link>
                <Link to={`/admin/ekadashi/${session.id}/schedule`} className="btn btn-ghost btn-sm">
                  View Schedule
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/register/${session.id}`)
                    alert('Registration link copied!')
                  }}
                >
                  Copy Form Link
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--error)', borderColor: 'rgba(192,57,43,0.25)', marginLeft: 'auto' }}
                  onClick={() => deleteSession(session.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              No sessions yet.
            </p>
            <p style={{ fontSize: '0.88rem' }}>Create your first Ekadashi to get started.</p>
          </div>
        )}

      </div>
    </>
  )
}
