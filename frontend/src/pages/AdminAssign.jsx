import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import ReferenceItemsView from '../components/ReferenceItemsView'
import PeopleOverviewView from '../components/PeopleOverviewView'

export default function AdminAssign() {
    const { id } = useParams()
    const [tab, setTab] = useState('reference')

    const { data: ekadashi } = useQuery({
        queryKey: ['ekadashi', id],
        queryFn: () => api.get(`/ekadashi/${id}`).then(r => r.data)
    })

    const { data: signups = [], isLoading } = useQuery({
        queryKey: ['signups', id],
        queryFn: () => api.get(`/ekadashi/${id}/signups`).then(r => r.data)
    })

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments', id],
        queryFn: () => api.get(`/assignments/ekadashi/${id}`).then(r => r.data)
    })

    const { data: registrations = [], isLoading: registrationsLoading } = useQuery({
        queryKey: ['registrations', id],
        queryFn: () => api.get(`/registrations/ekadashi/${id}`).then(r => r.data)
    })

    return (
        <>
            <nav className="topnav">
                <span className="topnav-brand">॥ Ekadashi Scheduler ॥</span>
                <div className="flex gap-1">
                    <Link to={`/admin/ekadashi/${id}/schedule`} className="btn btn-primary btn-sm">View Schedule →</Link>
                    <Link to="/admin" className="btn btn-ghost btn-sm">← Dashboard</Link>
                </div>
            </nav>

            <div className="page-wide">

                {/* Page header */}
                <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem' }}>Assign Slots</h1>
                    {ekadashi && (
                        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            {ekadashi.title} · {new Date(ekadashi.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    )}
                </div>

                <hr className="divider" />

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <button
                        className={`btn btn-sm ${tab === 'reference' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setTab('reference')}
                    >
                        By Duty
                    </button>
                    <button
                        className={`btn btn-sm ${tab === 'people' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setTab('people')}
                    >
                        By Person
                    </button>
                </div>

                {tab === 'reference' && (
                    <ReferenceItemsView signups={signups} assignments={assignments} ekadashiId={id} isLoading={isLoading} />
                )}
                {tab === 'people' && (
                    <PeopleOverviewView
                        registrations={registrations}
                        signups={signups}
                        assignments={assignments}
                        isLoading={isLoading || registrationsLoading}
                    />
                )}

            </div>
        </>
    )
}
