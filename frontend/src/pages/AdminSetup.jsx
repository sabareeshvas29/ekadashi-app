import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const DEFAULT_ITEMS = [
  { title: 'Song: dedicated to Sri Madhwacharya', section: null, is_volatile: false, is_splittable: false, is_song_request: false, order_index: 1 },
  { title: 'Satya Jagatidu', section: null, is_volatile: false, is_splittable: false, is_song_request: false, order_index: 2 },
  { title: 'Taratamya Bhajane: Ganapathy', section: 'Taratamya Bhajane', is_volatile: false, is_splittable: false, is_song_request: false, order_index: 3 },
  { title: 'Taratamya Bhajane: Rudra devaru', section: 'Taratamya Bhajane', is_volatile: false, is_splittable: false, is_song_request: false, order_index: 4 },
  { title: 'Taratamya Bhajane: Vayudevaru', section: 'Taratamya Bhajane', is_volatile: false, is_splittable: false, is_song_request: false, order_index: 5 },
  { title: 'Taratamya Bhajane: Mahalakshmi Devi', section: 'Taratamya Bhajane', is_volatile: false, is_splittable: false, is_song_request: false, order_index: 6 },
  { title: 'HarikathAmruthasAra - Vyapthi Sandhi', section: 'HKS', is_volatile: false, is_splittable: true, is_song_request: false, order_index: 7 },
  { title: 'Sri Vishnu Sahasranama (Avarthanae 1)', section: 'VSN', is_volatile: false, is_splittable: true, is_song_request: false, order_index: 8 },
  { title: 'Bhagavantha hAdu', section: 'Bhagavantha hAdu', is_volatile: true, is_splittable: false, is_song_request: true, order_index: 9 },
  { title: 'Sri Vishnu Sahasranama (Avarthanae 2)', section: 'VSN', is_volatile: false, is_splittable: true, is_song_request: false, order_index: 10 },
]

function SortableItem({ item, idx, updateItem, removeItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: idx.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto auto auto',
    gap: '0.6rem',
    alignItems: 'center',
    padding: '0.55rem 0.5rem',
    borderBottom: '1px solid var(--cream-dk)',
    borderRadius: '4px',
  }

  const checkboxLabel = (checked, label, field) => (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.75rem', margin: 0, whiteSpace: 'nowrap', cursor: 'pointer',
      color: checked ? 'var(--saffron-dk)' : 'var(--muted)',
      fontWeight: checked ? 500 : 400,
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => updateItem(idx, field, e.target.checked)}
        style={{ width: 'auto', accentColor: 'var(--saffron)', cursor: 'pointer' }}
      />
      {label}
    </label>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <span
        {...attributes} {...listeners}
        style={{ cursor: 'grab', color: 'var(--border)', padding: '0 0.25rem', fontSize: '1rem', lineHeight: 1 }}
      >
        ⠿
      </span>
      <input
        value={item.title}
        onChange={e => updateItem(idx, 'title', e.target.value)}
        placeholder="Item title"
        style={{ fontSize: '0.88rem' }}
      />
      {checkboxLabel(item.is_volatile,     'Volatile',     'is_volatile')}
      {checkboxLabel(item.is_splittable,   'Splittable',   'is_splittable')}
      {checkboxLabel(item.is_song_request, 'Song req.',    'is_song_request')}
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--error)', border: 'none', padding: '0.2rem 0.4rem', minWidth: 0 }}
        onClick={() => removeItem(idx)}
      >
        ✕
      </button>
    </div>
  )
}

export default function AdminSetup() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('22:00')
  const [items, setItems] = useState(DEFAULT_ITEMS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setItems(prev => arrayMove(prev, parseInt(active.id), parseInt(over.id)))
    }
  }

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      title: '', section: null, is_volatile: false, is_splittable: false, is_song_request: false, order_index: prev.length + 1
    }])
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const save = async () => {
    setError('')
    if (!title || !date) {
      setError('Please fill in the title and date.')
      return
    }
    setSaving(true)
    try {
      const result = await api.post('/ekadashi/', {
        title, date, start_time: startTime, end_time: endTime,
        reference_items: items.map((item, i) => ({ ...item, order_index: i + 1 }))
      })
      navigate(`/admin/ekadashi/${result.data.id}/assign`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <nav className="topnav">
        <span className="topnav-brand">॥ Ekadashi Scheduler ॥</span>
        <Link to="/admin" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </nav>

      <div className="page">

        <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem' }}>New Ekadashi Session</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', fontStyle: 'italic', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            Set up the event details and reference guide.
          </p>
        </div>

        <hr className="divider" style={{ marginTop: 0 }} />

        {/* Event Details card */}
        <div className="card">
          <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem' }}>
            Event Details
          </p>
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ashadha Ekadashi Bhajane" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="field"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="field"><label>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
            <div className="field"><label>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
          </div>
        </div>

        {/* Reference Guide card */}
        <div className="card mt-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Reference Guide
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                Drag to reorder · Volatile items change each Ekadashi
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableItem key={idx} item={item} idx={idx} updateItem={updateItem} removeItem={removeItem} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {error && (
          <p style={{ color: 'var(--error)', marginTop: '0.75rem', fontSize: '0.88rem' }}>{error}</p>
        )}

        <button
          className="btn btn-primary mt-2"
          style={{ width: '100%', padding: '0.82rem', letterSpacing: '0.04em', fontSize: '0.9rem' }}
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Creating…' : 'Create Ekadashi & Start Assigning'}
        </button>

      </div>
    </>
  )
}
