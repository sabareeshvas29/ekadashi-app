import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function AssignedChip({ assignment, onUnassign }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: assignment.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        background: 'var(--saffron-lt)',
        border: '1px solid rgba(212,104,10,0.25)',
        borderRadius: '100px',
        padding: '0.25rem 0.6rem 0.25rem 0.75rem',
        fontSize: '0.82rem',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 'auto',
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <span style={{ fontWeight: 500, color: 'var(--saffron-dk)' }}>
                {assignment.registrations?.first_name} {assignment.registrations?.last_name}
            </span>
            {assignment.slot_detail && (
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>· {assignment.slot_detail}</span>
            )}
            <button
                onPointerDown={e => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onUnassign(assignment.id) }}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(158,76,7,0.5)', fontSize: '0.82rem',
                    padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center',
                }}
            >
                ✕
            </button>
        </div>
    )
}

export default function ReferenceItemsView({ signups, assignments, ekadashiId, isLoading }) {
    const qc = useQueryClient()
    const [expanded, setExpanded] = useState(null)
    const [slotDetails, setSlotDetails] = useState({})

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const assign = useMutation({
        mutationFn: async ({ refItemId, regId, detail }) => {
            return api.post('/assignments/', {
                ekadashi_id: ekadashiId,
                reference_item_id: refItemId,
                registration_id: regId,
                slot_detail: detail || null,
            })
        },
        onSuccess: () => qc.invalidateQueries(['assignments', ekadashiId])
    })

    const unassign = useMutation({
        mutationFn: (assignmentId) => api.delete(`/assignments/${assignmentId}`),
        onSuccess: () => qc.invalidateQueries(['assignments', ekadashiId])
    })

    const reorder = useMutation({
        mutationFn: (items) => api.patch('/assignments/reorder', { items }),
        onSuccess: () => qc.invalidateQueries(['assignments', ekadashiId])
    })

    const handleChipDragEnd = (currentAssigned) => (event) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = currentAssigned.findIndex(a => a.id === active.id)
        const newIndex = currentAssigned.findIndex(a => a.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(currentAssigned, oldIndex, newIndex)

        qc.setQueryData(['assignments', ekadashiId], (old = []) =>
            old.map(a => {
                const idx = reordered.findIndex(r => r.id === a.id)
                return idx === -1 ? a : { ...a, slot_order: idx }
            })
        )

        reorder.mutate(reordered.map((a, i) => ({ assignment_id: a.id, slot_order: i })))
    }

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
            {isLoading && (
                <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                    Loading signups…
                </p>
            )}

            {/* Reference item cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {signups.map(item => {
                const isOpen = expanded === item.id
                const assigned = assignedMap[item.id] || []

                return (
                    <div
                        key={item.id}
                        className="card"
                        style={{ padding: 0, overflow: 'hidden' }}
                    >
                        {/* Header – click to expand */}
                        <div
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer',
                                padding: '1rem 1.4rem',
                                background: isOpen ? 'var(--cream)' : 'var(--white)',
                                borderBottom: (isOpen || assigned.length > 0) ? '1px solid var(--cream-dk)' : 'none',
                                transition: 'background 0.15s',
                            }}
                            onClick={() => setExpanded(isOpen ? null : item.id)}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500 }}>
                                        {item.title}
                                    </h3>
                                    {item.is_splittable && <span className="tag">Manual Assign</span>}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                                    {item.signups.length} familiar · {assigned.length} assigned
                                </p>
                            </div>
                            <span style={{ color: 'var(--border)', fontSize: '0.85rem', marginLeft: '1rem', flexShrink: 0 }}>
                                {isOpen ? '▲' : '▼'}
                            </span>
                        </div>

                        {/* Assigned chips – always visible when anyone is assigned */}
                        {assigned.length > 0 && (
                            <div style={{
                                padding: '0.7rem 1.4rem',
                                display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                                borderBottom: isOpen ? '1px solid var(--cream-dk)' : 'none',
                                background: 'var(--white)',
                            }}>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleChipDragEnd(assigned)}
                                >
                                    <SortableContext items={assigned.map(a => a.id)} strategy={horizontalListSortingStrategy}>
                                        {assigned.map(a => (
                                            <AssignedChip key={a.id} assignment={a} onUnassign={aid => unassign.mutate(aid)} />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}

                        {/* Expanded section */}
                        {isOpen && (
                            <div style={{ padding: '1rem 1.4rem 1.25rem', background: 'var(--cream)' }}>

                                {/* Splittable slot selector */}
                                {item.is_splittable && (
                                    <div style={{ marginBottom: '1.1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                            Select slot, then click a name to assign
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
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
                                            placeholder="Or type a custom slot…"
                                            style={{ maxWidth: '280px', fontSize: '0.85rem' }}
                                            value={slotDetails[item.id] || ''}
                                            onChange={e => setSlotDetails(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {item.signups.length === 0 && (
                                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                                        No one signed up for this item.
                                    </p>
                                )}

                                {/* Person rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    {item.signups.map(person => {
                                        const otherFamiliar = (familiarMap[person.registration_id] || []).filter(t => t !== item.title)
                                        const alreadyAssigned = personAssignedMap[person.registration_id] || []
                                        const isAssignedToThis = assigned.some(a => a.registration_id === person.registration_id)

                                        return (
                                            <div key={person.registration_id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                                padding: '0.7rem 0.9rem',
                                                background: 'var(--white)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)',
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 500, fontSize: '0.92rem' }}>{person.name}</p>
                                                    {person.song_request && (
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--saffron-dk)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                                                            Song requested ♪: {person.song_request}
                                                        </p>
                                                    )}
                                                    {otherFamiliar.length > 0 && (
                                                        <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                                                            familiar with: {otherFamiliar.join(', ')}
                                                        </p>
                                                    )}
                                                    {alreadyAssigned.length > 0 && (
                                                        <p style={{ fontSize: '0.76rem', color: 'var(--saffron-dk)', marginTop: '0.1rem' }}>
                                                            assigned: {alreadyAssigned.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ flexShrink: 0, marginLeft: '1rem', paddingTop: '0.1rem' }}>
                                                    {isAssignedToThis && !item.is_splittable ? (
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 500 }}>✓ Assigned</span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => assign.mutate(
                                                                {
                                                                    refItemId: item.id,
                                                                    regId: person.registration_id,
                                                                    detail: item.is_splittable ? slotDetails[item.id] : null,
                                                                },
                                                                {
                                                                    onSuccess: () => setSlotDetails(prev => ({ ...prev, [item.id]: '' }))
                                                                }
                                                            )}
                                                        >
                                                            + Assign
                                                        </button>
                                                    )}
                                                </div>
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
