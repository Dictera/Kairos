'use client'

// Shared primitives for all report components
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, Download } from 'lucide-react'

const C = {
  gelen:  '#22c55e',
  giden:  '#ef4444',
  masraf: '#f59e0b',
  net:    '#1c768f',
  purple: '#746cac',
  orange: '#f97316',
} as const

export { C }

export const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export const fmtK = (v: number) => fmt(v)

export function KpiCard({
  label, value, sub, color, trend,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  trend?: number
}) {
  const up = trend != null && trend > 0
  return (
    <div
      className="bg-card border border-border rounded-r-xl rounded-l-none p-4 flex flex-col gap-1.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        {trend != null && (
          <span
            className="text-[10px] font-bold"
            style={{ color: up ? '#22c55e' : '#ef4444' }}
          >
            {up ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold leading-none tracking-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function ProgressBar({ pct, color, h = 5 }: { pct: number; color: string; h?: number }) {
  return (
    <div className="rounded-full bg-muted overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  )
}

export function Bdg({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

export const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export function ayLabel(ay: string) {
  const [y, m] = ay.split('-').map(Number)
  return `${MONTHS_TR[m - 1]}'${String(y).slice(2)}`
}

export function ayLabelFull(ay: string) {
  const [y, m] = ay.split('-').map(Number)
  return `${MONTHS_FULL[m - 1]} ${y}`
}

export function PrintExportButtons({ title }: { title: string }) {
  const handlePrint = () => {
    window.print()
  }
  
  const handleExport = () => {
    const html = document.querySelector('.space-y-4')?.outerHTML || ''
    const blob = new Blob([`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-1.5" />
        Yazdır
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-1.5" />
        Dışa Aktar
      </Button>
    </div>
  )
}

export function ReportDateFilter({
  currentDate,
  options,
  onChange,
}: {
  currentDate: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={currentDate} onValueChange={onChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Tarih seç" />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function trDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const gun = d.getDate()
  const ay = d.getMonth()
  const yil = d.getFullYear()
  const aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]
  return `${gun} ${aylar[ay]} ${yil}`
}
