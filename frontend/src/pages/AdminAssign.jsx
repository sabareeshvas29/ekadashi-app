import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function AdminAssign() {
    const { id } = useParams()
    const qc = useQueryClient()
    const [expanded, setExpanded] = useState(null)
    const [slotDetails, setSlotDetails] = useState({})

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

    const assign = useMutation({
        mutationFn: async ({ refItemId, regId, detail, isSplittable }) => {
            if (!isSplittable) {
                const existing = assignedMap[refItemId] || []
                for (const a of existing) {
                    await api.delete(`/assignments/${a.id}`)
                }
            }
            return api.post('/assignments/', {
                ekadashi_id: id,
                reference_item_id: refItemId,
                registration_id: regId,
                slot_detail: detail || null,
            })
        },
        onSuccess: () => qc.invalidateQueries(['assignments', id])
    })

    const unassign = useMutation({
        mutationFn: (assignmentId) => api.delete(`/assignments/${assignmentId}`),
        onSuccess: () => qc.invalidateQueries(['assignments', id])
    })

    // Build map: registration_id -> list of reference titles they know
    const familiarMap = {}
    for (const item of signups) {
        for (const person of item.signups) {
            if (!familiarMap[person.registration_id]) familiarMap[person.registration_id] = []
            familiarMap[person.registration_id].push(item.title)
        }
    }

    // Build map: reference_item_id -> list of assignments
    const assignedMap = {}
    for (const a of assignments) {
        const refId = a.reference_item_id
        if (!assignedMap[refId]) assignedMap[refId] = []
        assignedMap[refId].push(a)
    }

    // Build map: registration_id -> list of assigned reference titles
    const personAssignedMap = {}
    for (const a of assignments) {
        const regId = a.registration_id
        if (!personAssignedMap[regId]) personAssignedMap[regId] = []
        personAssignedMap[regId].push(a.reference_items?.title)
    }

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
                <div className="mt-2">
                    <h1>Assign Slots</h1>
                    {ekadashi && (
                        <p className="text-muted mt-1">
                            {ekadashi.title} · {new Date(ekadashi.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    )}
                </div>

                <hr className="divider" />

                {isLoading && <p className="text-muted">Loading signups...</p>}

                {signups.map(item => {
                    const isOpen = expanded === item.id
                    const assigned = assignedMap[item.id] || []

                    return (
                        <div className="card mt-2" key={item.id}>
                            {/* Header row - click to expand */}
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setExpanded(isOpen ? null : item.id)}
                            >
                                <div>
                                    <h3>{item.title}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                                        {item.signups.length} familiar · {assigned.length} assigned
                                        {item.is_splittable && ' · Splittable'}
                                        {item.is_volatile && ' · Volatile'}
                                    </p>
                                </div>
                                <span style={{ color: 'var(--muted)', fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                            </div>

                            {/* Assigned people - always visible */}
                            {assigned.length > 0 && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {assigned.map(a => (
                                        <div key={a.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: 'var(--saffron-lt)', border: '1px solid var(--saffron)',
                                            borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.7rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontWeight: 500, color: 'var(--saffron-dk)' }}>
                                                {a.registrations?.first_name} {a.registrations?.last_name}
                                            </span>
                                            {a.slot_detail && <span style={{ color: 'var(--muted)' }}>— {a.slot_detail}</span>}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); unassign.mutate(a.id) }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.9rem', padding: '0' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Expanded section */}
                            {isOpen && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>

                                    {/* Slot detail input for splittable items */}
                                    {item.is_splittable && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.4rem', display: 'block' }}>
                                                Select slot then click a person to assign
                                            </label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                                {(item.split_config?.chunks || []).map(chunk => (
                                                    <button
                                                        key={chunk}
                                                        className={`btn btn-sm ${slotDetails[item.id] === chunk ? 'btn-primary' : 'btn-ghost'}`}
                                                        onClick={() => setSlotDetails(prev => ({ ...prev, [item.id]: chunk }))}
                                                    >
                                                        {chunk}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Or type a custom slot"
                                                style={{ maxWidth: '280px' }}
                                                value={slotDetails[item.id] || ''}
                                                onChange={e => setSlotDetails(prev => ({ ...prev, [item.id]: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {item.signups.length === 0 && (
                                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>No one signed up for this item.</p>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {item.signups.map(person => {
                                            const otherFamiliar = (familiarMap[person.registration_id] || []).filter(t => t !== item.title)
                                            const alreadyAssigned = personAssignedMap[person.registration_id] || []
                                            const isAssignedToThis = assigned.some(a => a.registration_id === person.registration_id)

                                            return (
                                                <div key={person.registration_id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                                    padding: '0.6rem 0.8rem', background: 'var(--cream)', borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div>
                                                        <p style={{ fontWeight: 500, fontSize: '0.92rem' }}>{person.name}</p>
                                                        {person.song_request && (
                                                            <p style={{ fontSize: '0.78rem', color: 'var(--saffron-dk)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                                                                Song requested ♪: {person.song_request}
                                                            </p>
                                                        )}
                                                        {otherFamiliar.length > 0 && (
                                                            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                                                                familiar with: {otherFamiliar.join(', ')}
                                                            </p>
                                                        )}
                                                        {alreadyAssigned.length > 0 && (
                                                            <p style={{ fontSize: '0.78rem', color: 'var(--saffron-dk)', marginTop: '0.1rem' }}>
                                                                already assigned: {alreadyAssigned.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isAssignedToThis && !item.is_splittable ? (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✓ Assigned</span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => assign.mutate({
                                                                refItemId: item.id,
                                                                regId: person.registration_id,
                                                                detail: item.is_splittable ? slotDetails[item.id] : null,
                                                                isSplittable: item.is_splittable
                                                            })}
                                                        >
                                                            + Assign
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </>
    )
}