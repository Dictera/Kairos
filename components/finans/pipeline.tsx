'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MONTHS_TR, fmt, fmtK, tahsilatColor } from './finans-data'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart),           { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> })
const Area                = dynamic(() => import('recharts').then(m => m.Area),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ReferenceLine       = dynamic(() => import('recharts').then(m => m.ReferenceLine),       { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const MONTHS_FULL_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
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

export function Pipeline() {
  const trpc = useTRPC()

  const { data: sirketData, isLoading: sirketLoading } = useQuery(
    trpc.finans.sirket.queryOptions()
  )
  const { data: dashData, isLoading: dashLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({})
  )

  const isLoading = sirketLoading || dashLoading

  const sirket  = sirketData ?? []
  const monthly = dashData?.monthly ?? []

  const pipeline = useMemo(() =>
    sirket.map(s => ({ ...s, bekleyen: Math.max(0, s.talep - s.tahsilat) })),
  [sirket])

  // Last 6 months net average for projection
  const recent = monthly.slice(-6)
  const avgNet = recent.length
    ? recent.reduce((a, m) => a + (m.gelen - m.giden - m.masraf), 0) / recent.length
    : 0

  // Cumulative kasa from monthly data
  const kasaData = useMemo(() => {
    let running = 0
    return monthly.map(m => {
      const [year, month] = m.ay.split('-')
      running += m.gelen - m.giden - m.masraf
      return {
        name: `${MONTHS_FULL_SHORT[parseInt(month) - 1]} ${year}`,
        Kasa: running,
        Tahmin: undefined as number | undefined,
      }
    })
  }, [monthly])

  const lastKasa = kasaData[kasaData.length - 1]?.Kasa ?? 0
  const lastAy   = monthly[monthly.length - 1]?.ay ?? ''

  const proj = useMemo(() => {
    if (!lastAy) return []
    const [y, m] = lastAy.split('-').map(Number)
    return [1, 2, 3].map(i => {
      let nm = m + i; let ny = y
      if (nm > 12) { nm -= 12; ny++ }
      return {
        name: `${MONTHS_TR[nm - 1]} ${ny}`,
        Kasa: undefined as number | undefined,
        Tahmin: lastKasa + avgNet * i,
      }
    })
  }, [lastAy, lastKasa, avgNet])

  const kasaMerged = useMemo(() => {
    const merged = [...kasaData, ...proj]
    if (kasaData.length > 0) {
      merged[kasaData.length - 1] = {
        ...merged[kasaData.length - 1],
        Tahmin: lastKasa,
      }
    }
    return merged
  }, [kasaData, proj, lastKasa])

  const pipelineData   = pipeline.map(s => ({ name: s.ad, Tahsilat: s.tahsilat, Bekleyen: s.bekleyen }))
  const totalBekleyen  = pipeline.reduce((a, s) => a + s.bekleyen, 0)
  const totalTalep     = pipeline.reduce((a, s) => a + s.talep, 0)
  const totalTahsilat  = pipeline.reduce((a, s) => a + s.tahsilat, 0)
  const tahsilatPct    = totalTalep > 0 ? ((totalTahsilat / totalTalep) * 100).toFixed(0) : '0'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Skeleton className="h-[280px] w-full" />
          <Skeleton className="h-[280px] w-full" />
        </div>
        <Skeleton className="h-[260px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <KPIPill value={fmt(totalBekleyen)}                     label="Bekleyen Tahsilat"        color="#f97316" />
        <KPIPill value={`%${tahsilatPct}`}                      label="Genel Tahsilat Oranı"      color="#1c768f" />
        <KPIPill value={fmt(Math.round(avgNet))}                label="Aylık Ort. Net (son 6 ay)" color="#22c55e" />
        <KPIPill value={fmt(Math.round(lastKasa + avgNet * 3))} label="3 Aylık Kasa Tahmini"      color="#1c768f" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bekleyen Tahsilat Pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">Tahsil edilen vs. bekleyen — şirket bazlı</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Tahsilat" stackId="a" fill="#22c55e"                       radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Bekleyen" stackId="a" fill="oklch(0.527 0.089 230 / 0.35)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm">Kasa Bakiyesi + 3 Aylık Tahmin</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Son 6 ay ortalamasına göre projeksiyon</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                Projeksiyon
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kasaMerged} margin={{ top: 4, right: 20, left: 0, bottom: 30 }}>
                  <defs>
                    <linearGradient id="kasaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1c768f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1c768f" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1c768f" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#1c768f" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="Kasa"   name="Kasa"   stroke="#1c768f" strokeWidth={2.5} fill="url(#kasaGrad)" dot={{ r: 3, fill: '#1c768f', strokeWidth: 0 }} connectNulls={false} />
                  <Area type="monotone" dataKey="Tahmin" name="Tahmin" stroke="#1c768f" strokeWidth={2} strokeDasharray="6 4" fill="url(#projGrad)" dot={{ r: 4, fill: '#1c768f', strokeWidth: 0 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {pipeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bekleyen Tahsilat Detayı</CardTitle>
            <p className="text-xs text-muted-foreground">Her şirket için tahsil edilen, bekleyen ve oran</p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {['Şirket', 'Talep', 'Tahsil Edilen', 'Bekleyen', 'Tahsilat İlerlemesi'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${h === 'Şirket' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...pipeline].sort((a, b) => b.bekleyen - a.bekleyen).map((s, i) => {
                  const pct = s.talep > 0 ? (s.tahsilat / s.talep) * 100 : 0
                  const col = tahsilatColor(pct)
                  return (
                    <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-2.5 font-medium">{s.ad}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{fmt(s.talep)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-medium" style={{ color: '#22c55e' }}>{fmt(s.tahsilat)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-medium" style={{ color: '#f97316' }}>{fmt(s.bekleyen)}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex-1 max-w-[80px]"><ProgressBar pct={pct} color={col} /></div>
                          <span className="text-xs font-semibold min-w-[36px] text-right tabular-nums" style={{ color: col }}>%{pct.toFixed(0)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
