// Types, color tokens and pure helpers for the Raporlar module.

// ── Locale ───────────────────────────────────────────────────────────────────

const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
]

const MONTHS_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

// ── Palette ───────────────────────────────────────────────────────────────────

export const C = {
  gelen:    '#22c55e',
  giden:    '#ef4444',
  masraf:   '#f97316',
  net:      '#1c768f',
  kasa:     '#1c768f',
  accent:   '#1c768f',
  purple:   '#746cac',
  amber:    '#f59e0b',
  warning:  '#f97316',
  danger:   '#ef4444',
  success:  '#22c55e',
  primary:  '#FA991C',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export type YilFilter = 'all' | '2025' | '2026'

export interface AyRow {
  ay: string        // "YYYY-MM"
  gelen: number
  giden: number
  masraf: number
  dosya: number
}

export interface EnrichedAyRow extends AyRow {
  net: number
  kasa: number
  label: string
  labelFull: string
}

export interface SirketRow {
  ad: string
  talep: number
  karar: number
  tahsilat: number
  dosya: number
  tur: string
}

export interface DosyaStatusRow {
  durum: string
  adet: number
  renk: string
}

export interface DosyaTurRow {
  tur: string
  label: string
  gelen: number
  giden: number
  masraf: number
  adet: number
  renk: string
}

export interface MuvekkilRow {
  ad: string
  dosya: number
  tahsilat: number
  oran: number
  durum: 'Aktif' | 'Pasif'
  son: string
}

export interface SonucSirketRow {
  ad: string
  kazan: number
  uzlasma: number
  kaybet: number
}

export interface SonucTurRow {
  tur: string
  kazan: number
  uzlasma: number
  kaybet: number
  devam: number
  renk: string
}

export interface SonucAylikRow {
  ay: string
  kazan: number
  uzlasma: number
  kaybet: number
}

export interface ArabuluculukAylikRow {
  ay: string
  ara: number
  dava: number
  araCoz: number
  davaCoz: number
  araSure: number
  davaSure: number
}

export type ZamanasimıRisk = 'Acil' | 'Kritik' | 'Dikkat' | 'Güvenli'

export interface ZamanasimıRow {
  no: string
  muvekkil: string
  sirket: string
  tur: string
  basTarih: string
  zamanasimıYil: number
  kalanGun: number
  risk: ZamanasimıRisk
}

export interface AsamaRow {
  asama: string
  ort: number
  min: number
  max: number
  adet: number
  renk: string
}

export interface UzunDosyaRow {
  no: string
  muvekkil: string
  sirket: string
  asama: string
  gun: number
  tutar: number
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function enrichAy(rows: AyRow[]): EnrichedAyRow[] {
  let kasa = 0
  return rows.map((r) => {
    const net = r.gelen - r.giden - r.masraf
    kasa += net
    const [y, m] = r.ay.split('-').map(Number)
    return {
      ...r,
      net,
      kasa,
      label:     `${MONTHS_TR[m - 1]}'${String(y).slice(2)}`,
      labelFull: `${MONTHS_FULL[m - 1]} ${y}`,
    }
  })
}

export const fmt = (v: number): string =>
  v.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

export const fmtK = (v: number): string =>
  v.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

export const fmtKN = (v: number): string => {
  const a = Math.abs(v)
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (a >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

export const riskColor: Record<ZamanasimıRisk, string> = {
  Acil:    C.danger,
  Kritik:  C.warning,
  Dikkat:  C.amber,
  Güvenli: C.success,
}

export const riskLabel: Record<ZamanasimıRisk, string> = {
  Acil:    '60 günden az',
  Kritik:  '60–180 gün',
  Dikkat:  '180 gün – 1 yıl',
  Güvenli: '1 yıldan fazla',
}
