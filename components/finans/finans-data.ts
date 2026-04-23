// Types, color tokens, and pure helpers.
// No mock data — all data comes from tRPC queries.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SirketRow {
  ad: string
  talep: number
  tahsilat: number
  dosya: number
}

export interface TurRow {
  tur: string
  gelen: number
  renk: string
}

export interface DosyaTurRow {
  tur: string
  gelen: number
  giden: number
  masraf: number
}

export interface DosyaTurEnriched extends DosyaTurRow {
  net: number
  oran: number  // net margin %
}

// ── Locale constants ──────────────────────────────────────────────────────────

export const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
]

// ── Color palette ─────────────────────────────────────────────────────────────

export const C = {
  gelen:  '#22c55e',
  giden:  '#ef4444',
  masraf: '#f97316',
  net:    '#1c768f',
  kasa:   '#1c768f',
} as const

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function enrichDosyaTur(rows: DosyaTurRow[]): DosyaTurEnriched[] {
  return rows.map(d => ({
    ...d,
    net:  d.gelen - d.giden - d.masraf,
    oran: d.gelen > 0 ? ((d.gelen - d.giden - d.masraf) / d.gelen) * 100 : 0,
  }))
}

export const fmt = (v: number): string =>
  v.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  })

export const fmtK = (v: number): string => {
  const a = Math.abs(v)
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (a >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

export const tahsilatColor = (pct: number): string =>
  pct >= 80 ? '#22c55e' : pct >= 60 ? '#f97316' : '#ef4444'
