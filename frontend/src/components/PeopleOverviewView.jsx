export default function PeopleOverviewView({ registrations, signups, assignments, isLoading }) {
    // registration_id -> [{title, slotDetail}]
    const assignedByPerson = {}
    for (const a of assignments) {
        const regId = a.registration_id
        if (!assignedByPerson[regId]) assignedByPerson[regId] = []
        assignedByPerson[regId].push({ title: a.reference_items?.title, slotDetail: a.slot_detail })
    }

    // registration_id -> [reference item titles marked familiar]
    const familiarByPerson = {}
    for (const item of signups) {
        for (const person of item.signups) {
            if (!familiarByPerson[person.registration_id]) familiarByPerson[person.registration_id] = []
            familiarByPerson[person.registration_id].push(item.title)
        }
    }

    const people = registrations.map(reg => {
        const assigned = assignedByPerson[reg.id] || []
        const familiar = familiarByPerson[reg.id] || []
        return {
            ...reg,
            name: `${reg.first_name} ${reg.last_name}`,
            assigned,
            familiar,
            isUnassigned: assigned.length === 0,
        }
    })

    const unassignedCount = people.filter(p => p.isUnassigned).length

    if (isLoading) {
        return (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                Loading signups…
            </p>
        )
    }

    return (
        <>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    {people.length} signed up
                </span>
                <span style={{ fontSize: '0.9rem', color: unassignedCount > 0 ? 'var(--error)' : 'var(--success)', fontWeight: 500 }}>
                    {unassignedCount} unassigned
                </span>
            </div>

            {people.length === 0 && (
                <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                    No one has signed up yet.
                </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {people.map(person => (
                    <div
                        key={person.id}
                        className="card"
                        style={{
                            padding: '0.9rem 1.2rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            borderLeft: person.isUnassigned ? '3px solid var(--error)' : '3px solid var(--success)',
                            background: person.isUnassigned ? 'var(--saffron-lt)' : 'var(--white)',
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{person.name}</p>
                            {person.phone && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{person.phone}</p>
                            )}
                            {person.familiar.length > 0 && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                                    familiar with: {person.familiar.join(', ')}
                                </p>
                            )}
                        </div>
                        <div style={{ flexShrink: 0, marginLeft: '1rem', textAlign: 'right' }}>
                            {person.isUnassigned ? (
                                <span className="tag" style={{ background: 'var(--error)', color: 'white', borderColor: 'var(--error)' }}>
                                    Not assigned
                                </span>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                                    {person.assigned.map((a, i) => (
                                        <span key={i} className="tag tag-warm">
                                            {a.title}{a.slotDetail ? ` · ${a.slotDetail}` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
