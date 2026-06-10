'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface ClockPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (time: string) => void // "HH:MM" 24-saat formatında
}

function wrap(val: number, max: number) {
  return ((val % max) + max) % max
}

const ORANGE = 'oklch(0.746 0.174 57)'
const NAVY   = 'oklch(0.219 0.044 240)'
const MUTED  = 'oklch(0.219 0.044 240 / 0.35)'
const CARD   = 'oklch(0.969 0.008 20)'
const BORDER = 'oklch(0.88 0.008 20)'

const inputStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: `2px solid ${ORANGE}`,
  outline: 'none',
  color: ORANGE,
  fontSize: 64,
  fontWeight: 100,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  width: 96,
  textAlign: 'center',
  caretColor: ORANGE,
}

const bigDigitStyle: CSSProperties = {
  color: ORANGE,
  fontSize: 64,
  fontWeight: 100,
  letterSpacing: '-0.04em',
  background: 'none',
  border: 'none',
  cursor: 'text',
  padding: 0,
}

export function ClockPicker({ open, onOpenChange, onConfirm }: ClockPickerProps) {
  const [hour, setHour] = useState(8)
  const [minute, setMinute] = useState(0)
  const [editing, setEditing] = useState<'hour' | 'minute' | null>(null)
  const [draft, setDraft] = useState('')

  // Reset on every close path (Esc, overlay, close button, confirm) — Radix
  // routes all of them through onOpenChange, so resetting here covers them all.
  function handleOpenChange(next: boolean) {
    if (!next) { setHour(8); setMinute(0); setEditing(null); setDraft('') }
    onOpenChange(next)
  }

  function startEdit(field: 'hour' | 'minute') {
    setEditing(field)
    setDraft('')
  }

  function commitEdit() {
    const n = parseInt(draft, 10)
    if (!isNaN(n)) {
      if (editing === 'hour') setHour(Math.min(23, Math.max(0, n)))
      else setMinute(Math.min(59, Math.max(0, n)))
    }
    setEditing(null)
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditing(null); setDraft('') }
  }

  function handleConfirm() {
    if (editing) commitEdit()
    onConfirm(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-xs p-0 overflow-hidden gap-0 rounded-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Bildirim Saati Seç</DialogTitle>
        {/* ── Header ── */}
        <div style={{ background: NAVY }} className="px-6 pt-5 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3 select-none"
            style={{ color: 'oklch(0.969 0.008 20 / 0.4)' }}>
            Bildirim Saati
          </p>
          <div className="flex items-end gap-1.5">
            {editing === 'hour' ? (
              <input
                ref={el => el?.focus()}
                aria-label="Saat"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={draft}
                placeholder={String(hour).padStart(2, '0')}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
                  const n = parseInt(raw, 10)
                  setDraft(!isNaN(n) && n > 23 ? '23' : raw)
                }}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            ) : (
              <button type="button" onClick={() => startEdit('hour')}
                className="tabular-nums leading-none transition-opacity hover:opacity-70"
                style={bigDigitStyle}>
                {String(hour).padStart(2, '0')}
              </button>
            )}
            <span className="text-[52px] font-thin leading-none pb-1 select-none"
              style={{ color: 'oklch(0.969 0.008 20 / 0.2)', letterSpacing: '-0.04em' }}>
              :
            </span>
            {editing === 'minute' ? (
              <input
                ref={el => el?.focus()}
                aria-label="Dakika"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={draft}
                placeholder={String(minute).padStart(2, '0')}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
                  const n = parseInt(raw, 10)
                  setDraft(!isNaN(n) && n > 59 ? '59' : raw)
                }}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            ) : (
              <button type="button" onClick={() => startEdit('minute')}
                className="tabular-nums leading-none transition-opacity hover:opacity-70"
                style={bigDigitStyle}>
                {String(minute).padStart(2, '0')}
              </button>
            )}
          </div>
        </div>

        {/* ── Drum picker ── */}
        <div style={{ background: CARD }} className="px-6 py-5">
          <div className="flex gap-3 items-stretch">
            {/* Hour column */}
            <DrumColumn
              value={hour}
              max={24}
              label="Saat"
              onChange={setHour}
              orange={ORANGE}
              navy={NAVY}
              muted={MUTED}
              border={BORDER}
            />

            {/* Separator */}
            <div className="flex flex-col items-center justify-center gap-3 px-1">
              <span className="text-2xl font-light" style={{ color: MUTED }}>:</span>
            </div>

            {/* Minute column */}
            <DrumColumn
              value={minute}
              max={60}
              label="Dakika"
              onChange={setMinute}
              orange={ORANGE}
              navy={NAVY}
              muted={MUTED}
              border={BORDER}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 px-5 pb-4"
          style={{ background: CARD }}>
          <DialogClose asChild>
            <Button variant="ghost" type="button" className="h-9 px-4 text-sm">
              İptal
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            type="button"
            className="h-9 px-5 text-sm font-semibold hover:opacity-90"
            style={{ background: ORANGE, color: NAVY, border: 'none' }}
          >
            Ekle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DrumColumnProps {
  value: number
  max: number
  label: string
  onChange: (v: number) => void
  orange: string
  navy: string
  muted: string
  border: string
}

function fmt(n: number) {
  return String(n).padStart(2, '0')
}

function DrumColumn({ value, max, label, onChange, orange, navy, muted, border }: DrumColumnProps) {
  const prev = wrap(value - 1, max)
  const next = wrap(value + 1, max)

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: muted }}>
        {label}
      </span>

      {/* Up */}
      <button
        type="button"
        onClick={() => onChange(wrap(value - 1, max))}
        className="w-full flex justify-center py-1.5 rounded-lg transition-colors hover:bg-black/5 active:bg-black/10"
        aria-label={`${label} azalt`}
      >
        <ChevronUp size={18} style={{ color: muted }} strokeWidth={2} />
      </button>

      {/* Values */}
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{ border: `1px solid ${border}` }}
      >
        {/* Prev — clickable */}
        <button type="button" onClick={() => onChange(wrap(value - 1, max))}
          className="w-full flex justify-center py-2.5 hover:bg-black/5 transition-colors"
          style={{ borderBottom: `1px solid ${border}` }}>
          <span className="text-lg tabular-nums font-light" style={{ color: muted }}>
            {fmt(prev)}
          </span>
        </button>

        {/* Current — highlighted */}
        <div className="flex justify-center py-3" style={{ background: `${orange}18` }}>
          <span className="text-3xl tabular-nums font-semibold"
            style={{ color: navy, letterSpacing: '-0.02em' }}>
            {fmt(value)}
          </span>
        </div>

        {/* Next — clickable */}
        <button type="button" onClick={() => onChange(wrap(value + 1, max))}
          className="w-full flex justify-center py-2.5 hover:bg-black/5 transition-colors"
          style={{ borderTop: `1px solid ${border}` }}>
          <span className="text-lg tabular-nums font-light" style={{ color: muted }}>
            {fmt(next)}
          </span>
        </button>
      </div>

      {/* Down */}
      <button
        type="button"
        onClick={() => onChange(wrap(value + 1, max))}
        className="w-full flex justify-center py-1.5 rounded-lg transition-colors hover:bg-black/5 active:bg-black/10"
        aria-label={`${label} artır`}
      >
        <ChevronDown size={18} style={{ color: muted }} strokeWidth={2} />
      </button>
    </div>
  )
}
