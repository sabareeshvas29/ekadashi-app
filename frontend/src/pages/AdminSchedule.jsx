import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const EDIT_INPUT = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px dashed rgba(255,255,255,0.5)',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'center',
  width: '100%',
  outline: 'none',
  padding: 0,
}

const EDIT_INPUT_DARK = {
  ...EDIT_INPUT,
  borderBottom: '1px dashed rgba(0,0,0,0.25)',
}

const DEFAULT_MANGALA = 'Mangala - Girija Mami'

const fmtSubtitle = (ek) =>
  `${new Date(ek.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${ek.start_time} – ${ek.end_time} CST`

// Normal vs compressed style sets
const S = {
  titlePad:     { normal: '0.3rem 0.5rem',  compressed: '0.2rem 0.5rem' },
  titleSize:    { normal: '12px',           compressed: '10px' },
  subtitlePad:  { normal: '0.2rem 0.5rem',  compressed: '0.1rem 0.5rem' },
  subtitleSize: { normal: '10px',           compressed: '8px' },
  sectionPad:   { normal: '0.2rem 0.5rem',  compressed: '0.1rem 0.4rem' },
  sectionSize:  { normal: '11px',           compressed: '9px' },
  cellPad:      { normal: '0.15rem 0.5rem', compressed: '0.05rem 0.4rem' },
  cellSize:     { normal: '10px',           compressed: '8px' },
  cellLineH:    { normal: 'unset',          compressed: '1.1' },
  tableWidth:   { normal: '600px',          compressed: '550px' },
}

export default function AdminSchedule() {
  const { id } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState(null)
  const [screenshotMode, setScreenshotMode] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', id],
    queryFn: () => api.get(`/schedule/${id}`).then(r => r.data)
  })

  const enterEdit = () => {
    if (!localData && data) {
      setLocalData({
        title: data.ekadashi.title,
        subtitle: fmtSubtitle(data.ekadashi),
        sections: data.sections.map(s => ({ ...s, slots: s.slots.map(sl => ({ ...sl })) })),
        mangala: DEFAULT_MANGALA,
      })
    }
    setIsEditing(true)
  }

  const dTitle    = localData?.title    ?? data?.ekadashi.title ?? ''
  const dSubtitle = localData?.subtitle ?? (data ? fmtSubtitle(data.ekadashi) : '')
  const dSections = localData?.sections ?? data?.sections ?? []
  const dMangala  = localData?.mangala  ?? DEFAULT_MANGALA

  const updTitle    = v => setLocalData(p => ({ ...p, title: v }))
  const updSubtitle = v => setLocalData(p => ({ ...p, subtitle: v }))
  const updSection  = (si, v) => setLocalData(p => ({ ...p, sections: p.sections.map((s, i) => i === si ? { ...s, title: v } : s) }))
  const updSlot     = (si, sli, field, v) => setLocalData(p => ({ ...p, sections: p.sections.map((s, i) => i !== si ? s : { ...s, slots: s.slots.map((sl, j) => j !== sli ? sl : { ...sl, [field]: v }) }) }))
  const updMangala  = v => setLocalData(p => ({ ...p, mangala: v }))

  const copyAsText = () => {
    if (!data) return
    let text = `${dTitle}\n${dSubtitle}\n\n`
    for (const section of dSections) {
      text += `${section.title}\n`
      for (const slot of section.slots) {
        text += `  ${slot.person_name}${slot.slot_detail ? '  —  ' + slot.slot_detail : ''}\n`
      }
      text += '\n'
    }
    text += `${dMangala}\n`
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const copyForSheets = () => {
    if (!data) return
    let tsv = `${dTitle}\t\n${dSubtitle}\t\n`
    for (const section of dSections) {
      tsv += `${section.title}\t\n`
      for (const slot of section.slots) {
        tsv += `${slot.person_name}\t${slot.slot_detail || ''}\n`
      }
    }
    tsv += `${dMangala}\t\n`
    navigator.clipboard.writeText(tsv)
    alert('Copied! Paste directly into Google Sheets.')
  }

  if (isLoading) return <div className="loading">Building schedule…</div>
  if (!data) return <div className="loading">Schedule not found.</div>

  const sz = screenshotMode ? 'compressed' : 'normal'

  return (
    <>
      <nav className="topnav" id="no-print" style={{ display: screenshotMode ? 'none' : undefined }}>
        <span className="topnav-brand">॥ Ekadashi Scheduler ॥</span>
        <div className="flex gap-1" style={{ flexWrap: 'nowrap' }}>
          {isEditing ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>Done Editing</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={enterEdit}>Edit Schedule</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={copyAsText}>Copy as Text</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print / Save PDF</button>
          <Link to={`/admin/ekadashi/${id}/assign`} className="btn btn-ghost btn-sm">← Assignments</Link>
          <button className="btn btn-ghost btn-sm" onClick={copyForSheets}>Copy for Sheets</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setScreenshotMode(true)}>
            Screenshot Mode
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '620px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div id="schedule-table" style={{
          border: '2px solid #2C2416',
          borderRadius: '4px',
          overflow: 'hidden',
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          width: S.tableWidth[sz],
          margin: '0 auto',
        }}>
          {/* Title header */}
          <div style={{ background: '#2C2416', color: 'white', textAlign: 'center', padding: S.titlePad[sz] }}>
            {isEditing ? (
              <input value={dTitle} onChange={e => updTitle(e.target.value)} style={{ ...EDIT_INPUT, fontWeight: 'bold', fontSize: S.titleSize[sz] }} />
            ) : (
              <div style={{ fontWeight: 'bold', fontSize: S.titleSize[sz] }}>{dTitle}</div>
            )}
          </div>

          {/* Date/time subheader */}
          <div style={{ background: '#4a3a28', color: 'white', textAlign: 'center', padding: S.subtitlePad[sz], fontSize: S.subtitleSize[sz] }}>
            {isEditing ? (
              <input value={dSubtitle} onChange={e => updSubtitle(e.target.value)} style={{ ...EDIT_INPUT, fontSize: S.subtitleSize[sz] }} />
            ) : dSubtitle}
          </div>

          {dSections.map((section, si) => (
            <div key={si}>
              <div style={{
                background: '#8B7355', color: 'white', textAlign: 'center',
                padding: S.sectionPad[sz], fontWeight: 'bold', fontSize: S.sectionSize[sz],
                borderTop: '1px solid #2C2416',
              }}>
                {isEditing ? (
                  <input value={section.title} onChange={e => updSection(si, e.target.value)} style={{ ...EDIT_INPUT, fontWeight: 'bold', fontSize: S.sectionSize[sz] }} />
                ) : section.title}
              </div>

              {section.slots.map((slot, sli) => (
                <div key={sli} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  borderTop: '1px solid #D0C0A8',
                  background: sli % 2 === 0 ? '#FFFDF8' : '#F5EFE4',
                }}>
                  <div style={{ padding: S.cellPad[sz], borderRight: '1px solid #D0C0A8', textAlign: 'center', fontSize: S.cellSize[sz], lineHeight: S.cellLineH[sz], whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {isEditing ? (
                      <input value={slot.person_name} onChange={e => updSlot(si, sli, 'person_name', e.target.value)} style={{ ...EDIT_INPUT_DARK, fontSize: S.cellSize[sz] }} />
                    ) : slot.person_name}
                  </div>
                  <div style={{ padding: S.cellPad[sz], textAlign: 'center', fontSize: S.cellSize[sz], lineHeight: S.cellLineH[sz], color: slot.slot_detail ? '#2C2416' : '#888', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {isEditing ? (
                      <input value={slot.slot_detail || ''} onChange={e => updSlot(si, sli, 'slot_detail', e.target.value)} style={{ ...EDIT_INPUT_DARK, fontSize: S.cellSize[sz], color: '#2C2416' }} placeholder="—" />
                    ) : (slot.slot_detail || '—')}
                  </div>
                </div>
              ))}

              {section.slots.length === 0 && (
                <div style={{ padding: S.cellPad[sz], textAlign: 'center', fontSize: S.cellSize[sz], color: '#888', background: '#FFFDF8', borderTop: '1px solid #D0C0A8' }}>
                  No one assigned yet
                </div>
              )}
            </div>
          ))}

          {/* Mangala footer */}
          <div style={{
            background: '#8B7355', color: 'white', textAlign: 'center',
            padding: S.sectionPad[sz], fontWeight: 'bold', fontSize: S.sectionSize[sz],
            borderTop: '1px solid #2C2416',
          }}>
            {isEditing ? (
              <input value={dMangala} onChange={e => updMangala(e.target.value)} style={{ ...EDIT_INPUT, fontWeight: 'bold', fontSize: S.sectionSize[sz] }} />
            ) : dMangala}
          </div>
        </div>
      </div>

      {screenshotMode && (
        <button
          onClick={() => setScreenshotMode(false)}
          style={{
            position: 'fixed', right: '1.25rem', top: '50%', transform: 'translateY(-50%)',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            background: 'var(--saffron)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.4rem',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.03em', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          Exit Screenshot Mode
        </button>
      )}

      <style>{`
        @media print {
          #no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </>
  )
}
