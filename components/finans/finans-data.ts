// Types, color tokens, and pure helpers.
// No mock data — all data comes from tRPC queries.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EnrichedRow {
  ay: string        // "YYYY-MM"
  gelen: number
  giden: number
  masraf: number
  net: number
  kasa: number      // cumulative net
  label: string     // "Oca 2025"
  labelFull: string // "Ocak 2025"
}

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

export const MONTHS_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

// ── Color palette ─────────────────────────────────────────────────────────────

export const C = {
  gelen:  '#1fa570',  // warm emerald — harmonises with the steel-blue accent
  giden:  '#c94141',  // warm crimson — echoes the orange warmth without clashing
  masraf: '#ca8a04',  // golden ochre — deep amber, distinct from the orange primary
  net:    '#1c768f',  // project accent steel blue — unchanged
  kasa:   '#1c768f',
} as const

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function enrich(
  rows: Array<{ ay: string; gelen: number; giden: number; masraf: number }>,
): EnrichedRow[] {
  let kasa = 0
  return rows.map(x => {
    const net = x.gelen - x.giden - x.masraf
    kasa += net
    const [y, m] = x.ay.split('-').map(Number)
    return {
      ...x,
      net,
      kasa,
      label:     `${MONTHS_TR[m - 1]} ${y}`,
      labelFull: `${MONTHS_FULL[m - 1]} ${y}`,
    }
  })
}

export function tots(
  rows: Array<{ gelen: number; giden: number; masraf: number; net?: number }>,
): { gelen: number; giden: number; masraf: number; net: number } {
  return rows.reduce<{ gelen: number; giden: number; masraf: number; net: number }>(
    (a, r) => ({
      gelen:  a.gelen  + r.gelen,
      giden:  a.giden  + r.giden,
      masraf: a.masraf + r.masraf,
      net:    a.net    + (r.net ?? r.gelen - r.giden - r.masraf),
    }),
    { gelen: 0, giden: 0, masraf: 0, net: 0 },
  )
}

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
  pct >= 80 ? '#1fa570' : pct >= 60 ? '#ca8a04' : '#c94141'

// ── Ödeme Aşaması ─────────────────────────────────────────────────────────────

export const ODEME_ASAMASI_COLORS: Record<string, string> = {
  'İhtar':      '#ca8a04', // amber
  'Arabulucu':  '#1c768f', // blue
  'Bilirkişi':  '#7c3aed', // purple
  'İcra':       '#c94141', // red
}

export interface AsamaRow {
  asama: string
  gelen: number
  giden: number
  masraf: number
  net: number
}
