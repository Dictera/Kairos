'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Scale, CheckCircle2, PieChart as PieIcon } from 'lucide-react'

import { C, fmt, fmtK, type SirketRow } from './raporlar-data'
import { KPICard, CardHead, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const LineChart           = dynamic(() => import('recharts').then(m => m.LineChart),           { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> })
const Line                = dynamic(() => import('recharts').then(m => m.Line),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface SirketAnaliziData {
  sirketler:    SirketRow[]
  oranTrend:    Array<{ ay: string } & Record<string, number | string>>
  trendSeries?: string[]
}

export function SirketAnalizi() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.sirket.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<SirketAnaliziData> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.sirketler.length === 0) return <ReportEmpty />

  const { sirketler, oranTrend } = data
  const trendSeries = data.trendSeries ?? sirketler.slice(0, 4).map(s => s.ad)

  const sorted = [...sirketler].sort((a, b) => {
    const ra = a.karar > 0 ? a.tahsilat / a.karar : 0
    const rb = b.karar > 0 ? b.tahsilat / b.karar : 0
    return rb - ra
  })

  const totTalep    = sirketler.reduce((a, s) => a + s.talep,    0)
  const totTahsilat = sirketler.reduce((a, s) => a + s.tahsilat, 0)

  const LINE_COLORS = [C.accent, C.success, C.masraf, C.purple]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Şirket Sayısı"    value={sirketler.length}    color={C.accent}  Icon={Shield} />
        <KPICard label="Toplam Talep"     value={fmtK(totTalep)}      color={C.purple}  Icon={Scale} />
        <KPICard label="Toplam Tahsilat"  value={fmtK(totTahsilat)}   color={C.success} Icon={CheckCircle2} />
        <KPICard label="Tahsilat / Talep" value={totTalep > 0 ? `%${((totTahsilat / totTalep) * 100).toFixed(0)}` : '—'} color={C.masraf} Icon={PieIcon} />
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Tahsilat Oranı Trendi" sub="Üst 4 şirket — aylık trend (%)" />
        <CardContent className="px-[18px] py-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={oranTrend} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `%${v}`} domain={[60, 100]} width={42} />
                <Tooltip formatter={(v: unknown) => `%${v}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {trendSeries.map((s, i) => (
                  <Line
                    key={s} type="monotone" dataKey={s}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHead title="Şirket Sıralaması — 3 Kademeli" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['#', 'Şirket', 'Dosya', 'Talep', 'Karar', 'Tahsilat', 'Talep→Tahsilat', 'Karar→Tahsilat'].map(h => (
                  <th key={h} className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${['Talep','Karar','Tahsilat'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const talepOran = s.talep > 0 ? (s.tahsilat / s.talep) * 100 : 0
                const kararOran = s.karar > 0 ? (s.tahsilat / s.karar) * 100 : 0
                const talepCol  = talepOran >= 75 ? C.success : talepOran >= 60 ? C.warning : C.danger
                const kararCol  = kararOran >= 90 ? C.success : kararOran >= 80 ? C.warning : C.danger
                const rank      = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2.5 text-muted-foreground text-[12px] w-9">{rank}</td>
                    <td className="px-3 py-2.5 font-semibold text-[13px]">{s.ad}</td>
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{s.dosya}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground text-[12px] tabular-nums">{fmt(s.talep)}</td>
                    <td className="px-3 py-2.5 text-right text-[#22c55e] text-[12px] font-medium tabular-nums">{fmt(s.karar)}</td>
                    <td className="px-3 py-2.5 text-right text-[#f97316] font-semibold tabular-nums">{fmt(s.tahsilat)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-11"><ProgressBar pct={talepOran} color={talepCol} /></div>
                        <span className="text-[11px] font-bold min-w-[30px] tabular-nums" style={{ color: talepCol }}>%{talepOran.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-11"><ProgressBar pct={kararOran} color={kararCol} /></div>
                        <span className="text-[11px] font-bold min-w-[30px] tabular-nums" style={{ color: kararCol }}>%{kararOran.toFixed(0)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
