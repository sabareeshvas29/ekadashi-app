import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
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
          <span className="text-muted">{admin?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="page">
        <div className="flex justify-between items-center mt-2">
          <div>
            <h1>Bhajane Sessions</h1>
            <p className="text-muted mt-1">Manage Ekadashi events and registrations</p>
          </div>
          <Link to="/admin/ekadashi/new" className="btn btn-primary">+ New Ekadashi</Link>
        </div>

        <hr className="divider" />

        {isLoading && <p className="text-muted">Loading sessions...</p>}

        


        {sessions.map(session => (
          <div className="card mt-2" key={session.id}>
            <div className="flex justify-between items-center">
              <div>
                <h3>{session.title}</h3>
                <p className="text-muted mt-1">
                  {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' · '}{session.start_time} – {session.end_time} CST
                </p>
              </div>
              <span className={`badge badge-${session.is_registration_open ? 'open' : 'closed'}`}>
                {session.is_registration_open ? 'Registration Open' : 'Closed'}
              </span>
            </div>
            <div className="flex gap-1 mt-2">
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
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteSession(session.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {!isLoading && sessions.length === 0 && (
          <div className="card mt-2 text-center">
            <p className="text-muted">No sessions yet. Create your first Ekadashi to get started.</p>
          </div>
        )}
      </div>
    </>
  )
}