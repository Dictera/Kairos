'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { enrichDosyaTur, fmt, fmtK } from './finans-data'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const LineChart           = dynamic(() => import('recharts').then(m => m.LineChart),           { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> })
const Line                = dynamic(() => import('recharts').then(m => m.Line),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const Cell                = dynamic(() => import('recharts').then(m => m.Cell),                { ssr: false })
const ReferenceLine       = dynamic(() => import('recharts').then(m => m.ReferenceLine),       { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const MONTHS_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function KPIPill({ value, label, color = 'var(--accent)' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-3 min-w-[110px]">
      <span className="text-xl font-bold tracking-tight" style={{ color }}>{value}</span>
      <span className="mt-1 text-[11px] font-medium text-muted-foreground text-center">{label}</span>
    </div>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

export function Karlilik() {
  const trpc = useTRPC()

  const { data: dosyaTurData, isLoading: dosyaTurLoading } = useQuery(
    trpc.finans.dosyaTur.queryOptions()
  )
  const { data: dashData, isLoading: dashLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({})
  )
  const { data: sirketData, isLoading: sirketLoading } = useQuery(
    trpc.finans.sirket.queryOptions()
  )

  const isLoading = dosyaTurLoading || dashLoading || sirketLoading

  const dosyaTurNet = useMemo(() => enrichDosyaTur(dosyaTurData ?? []), [dosyaTurData])

  const monthly = dashData?.monthly ?? []

  const totals = useMemo(() => monthly.reduce(
    (a, m) => ({
      gelen:  a.gelen  + m.gelen,
      giden:  a.giden  + m.giden,
      masraf: a.masraf + m.masraf,
      net:    a.net    + (m.gelen - m.giden - m.masraf),
    }),
    { gelen: 0, giden: 0, masraf: 0, net: 0 },
  ), [monthly])

  const masrafOranData = useMemo(() => monthly.map(m => {
    const [year, month] = m.ay.split('-')
    return {
      name: `${MONTHS_FULL[parseInt(month) - 1].slice(0, 3)} ${year}`,
      'Masraf/Gelir':         m.gelen > 0 ? +((m.masraf / m.gelen) * 100).toFixed(1) : 0,
      '(Giden+Masraf)/Gelir': m.gelen > 0 ? +(((m.giden + m.masraf) / m.gelen) * 100).toFixed(1) : 0,
    }
  }), [monthly])

  const turKarData = dosyaTurNet.map(d => ({
    name: d.tur, Gelen: d.gelen, Giden: d.giden, Masraf: d.masraf, Net: d.net,
  }))

  const sirket = sirketData ?? []
  const dosyaBasinaData = sirket
    .filter(s => s.dosya > 0)
    .map(s => ({ name: s.ad, 'Dosya Başına': Math.round(s.tahsilat / s.dosya) }))

  const masrafOrt = totals.gelen > 0 ? (totals.masraf / totals.gelen * 100).toFixed(1) : '0'
  const netMarj   = totals.gelen > 0 ? (totals.net    / totals.gelen * 100).toFixed(1) : '0'
  const aylikOrt  = monthly.length > 0 ? Math.round(totals.net / monthly.length) : 0
  const enKarliTur = [...dosyaTurNet].sort((a, b) => b.oran - a.oran)[0]?.tur ?? '—'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Skeleton className="h-[260px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <Skeleton className="h-[260px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <KPIPill value={`%${masrafOrt}`} label="Masraf / Gelir"  color="#f97316" />
        <KPIPill value={`%${netMarj}`}   label="Net Marj"        color={parseFloat(netMarj) >= 40 ? '#22c55e' : '#f97316'} />
        <KPIPill value={fmt(aylikOrt)}   label="Aylık Ort. Net"  color="#1c768f" />
        <KPIPill value={enKarliTur}      label="En Karlı Tür"    color="#22c55e" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Masraf / Gelir Oranı Trendi</CardTitle>
            <p className="text-xs text-muted-foreground">Aylık maliyet verimliliği — düşük = iyi</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={masrafOranData} margin={{ top: 4, right: 20, left: 0, bottom: 30 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={(v) => `%${v}`} domain={[0, 100]} tick={{ fontSize: 11 }} width={40} />
                  <Tooltip formatter={(v: unknown) => `%${v}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Masraf/Gelir"         stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="(Giden+Masraf)/Gelir" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {turKarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dosya Türü Kârlılığı</CardTitle>
              <p className="text-xs text-muted-foreground">STK / AT / AH karşılaştırmalı net bakiye</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turKarData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={50} />
                    <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Gelen"  fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Giden"  fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Masraf" fill="#f97316" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Net"    fill="#1c768f" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {dosyaBasinaData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dosya Başına Ortalama Tahsilat</CardTitle>
            <p className="text-xs text-muted-foreground">Şirket bazında verimlilik</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dosyaBasinaData} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Bar dataKey="Dosya Başına" radius={[0, 3, 3, 0]}>
                    {dosyaBasinaData.map((_, i) => (
                      <Cell key={i} fill={`oklch(0.527 0.089 ${230 - i * 12} / 0.8)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {dosyaTurNet.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Dosya Türü Detay Tablosu</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {['Tür', 'Gelen', 'Giden', 'Masraf', 'Net', 'Net Marj'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Tür' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dosyaTurNet.map((d, i) => (
                  <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-base">{d.tur}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium" style={{ color: '#22c55e' }}>{fmt(d.gelen)}</td>
                    <td className="px-5 py-3 text-right tabular-nums"            style={{ color: '#ef4444' }}>{fmt(d.giden)}</td>
                    <td className="px-5 py-3 text-right tabular-nums"            style={{ color: '#f97316' }}>{fmt(d.masraf)}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold" style={{ color: d.net >= 0 ? '#1c768f' : '#ef4444' }}>{fmt(d.net)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14"><ProgressBar pct={d.oran} color="#1c768f" /></div>
                        <span className="text-xs font-semibold min-w-[36px] text-right tabular-nums" style={{ color: '#1c768f' }}>%{d.oran.toFixed(0)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
