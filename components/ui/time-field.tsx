'use client'

import { useState } from 'react'

interface TimeFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const fmt = (n: number | null) => n !== null ? String(n).padStart(2, '0') : '--'

export function TimeField({ value, onChange, onBlur }: TimeFieldProps) {
  const [editing, setEditing] = useState<'hour' | 'minute' | null>(null)
  const [draft, setDraft] = useState('')

  const parts = value.match(/^(\d{1,2}):(\d{2})$/)
  const hour = parts ? parseInt(parts[1]) : null
  const minute = parts ? parseInt(parts[2]) : null

  function startEdit(field: 'hour' | 'minute') {
    setEditing(field)
    setDraft('')
  }

  function commitEdit() {
    const n = parseInt(draft, 10)
    if (!isNaN(n)) {
      const h = editing === 'hour' ? Math.min(23, Math.max(0, n)) : (hour ?? 0)
      const m = editing === 'minute' ? Math.min(59, Math.max(0, n)) : (minute ?? 0)
      onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    setEditing(null)
    setDraft('')
    onBlur?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditing(null); setDraft('') }
  }

  const segClass = 'w-7 text-center tabular-nums bg-transparent outline-none'

  return (
    <div className="flex items-center border border-input rounded-md px-3 py-2 h-9 text-sm bg-background w-fit">
      {editing === 'hour' ? (
        <input
          ref={(el) => el?.focus()}
          aria-label="Saat"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={draft}
          placeholder={fmt(hour)}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
            const n = parseInt(raw, 10)
            setDraft(!isNaN(n) && n > 23 ? '23' : raw)
          }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={segClass}
        />
      ) : (
        <button type="button" onClick={() => startEdit('hour')}
          className={`${segClass} hover:text-primary transition-colors cursor-text`}>
          {fmt(hour)}
        </button>
      )}
      <span className="text-muted-foreground mx-0.5 select-none">:</span>
      {editing === 'minute' ? (
        <input
          ref={(el) => el?.focus()}
          aria-label="Dakika"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={draft}
          placeholder={fmt(minute)}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
            const n = parseInt(raw, 10)
            setDraft(!isNaN(n) && n > 59 ? '59' : raw)
          }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={segClass}
        />
      ) : (
        <button type="button" onClick={() => startEdit('minute')}
          className={`${segClass} hover:text-primary transition-colors cursor-text`}>
          {fmt(minute)}
        </button>
      )}
    </div>
  )
}
