'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, DollarSign, TrendingUp, Briefcase } from 'lucide-react'

import {
  C, fmt, fmtK, fmtKN, enrichAy,
  type AyRow, type YilFilter,
} from './raporlar-data'
import { KPICard, CardHead, ReportLoading, ReportEmpty } from './raporlar-shared'

const LineChart           = dynamic(() => import('recharts').then(m => m.LineChart),           { ssr: false, loading: () => <Skeleton className="h-[230px] w-full" /> })
const Line                = dynamic(() => import('recharts').then(m => m.Line),                { ssr: false })
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart),           { ssr: false })
const Area                = dynamic(() => import('recharts').then(m => m.Area),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface GenelBakisProps {
  yil: YilFilter
}

export function GenelBakis({ yil }: GenelBakisProps) {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.genelBakis.queryOptions({ yil }) as unknown as { queryKey: unknown[]; queryFn: () => Promise<{ rows: AyRow[] }> },
  )

  const data_ = useMemo(() => enrichAy(data?.rows ?? []), [data?.rows])

  if (isLoading) return <ReportLoading />
  if (data_.length === 0) return <ReportEmpty />

  const t = data_.reduce(
    (a, r) => ({
      gelen: a.gelen + r.gelen, giden: a.giden + r.giden,
      masraf: a.masraf + r.masraf, dosya: a.dosya + r.dosya,
    }),
    { gelen: 0, giden: 0, masraf: 0, dosya: 0 },
  )
  const net = t.gelen - t.giden - t.masraf

  const chartData = data_.map(d => ({ name: d.label, Gelen: d.gelen, Giden: d.giden, Net: d.net }))
  const kasaData  = data_.map(d => ({ name: d.label, Kasa: d.kasa }))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Toplam Tahsilat" value={fmtK(t.gelen)} color={C.success} Icon={ArrowDown}
          sub={`${data_.length} aylık dönem`} />
        <KPICard label="Toplam Ödeme"    value={fmtK(t.giden)} color={C.danger}  Icon={DollarSign} />
        <KPICard label="Net Kâr"          value={fmtK(net)}     color={C.accent}  Icon={TrendingUp}
          sub={t.gelen > 0 ? `Kâr marjı %${((net / t.gelen) * 100).toFixed(1)}` : undefined} />
        <KPICard label="Toplam Dosya"    value={t.dosya}        color={C.purple}  Icon={Briefcase} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Aylık Gelir / Gider / Net" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gxGelen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.success} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.success} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gxGiden" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.danger} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.danger} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Gelen" stroke={C.success} fill="url(#gxGelen)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Giden" stroke={C.danger}  fill="url(#gxGiden)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Net" stroke={C.accent} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Kümülatif Kasa" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kasaData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gxKasa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Area type="monotone" dataKey="Kasa" stroke={C.primary} fill="url(#gxKasa)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Aylık Özet Tablo" badge={`${data_.length} kayıt`} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-muted/50">
                {['Dönem', 'Gelen', 'Giden', 'Masraf', 'Net', 'Dosya'].map(h => (
                  <th key={h} className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Dönem' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data_.map((d, i) => (
                <tr key={i} className={`border-t ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="px-3.5 py-2 font-medium">{d.labelFull}</td>
                  <td className="px-3.5 py-2 text-right text-[#22c55e] font-medium tabular-nums">{fmt(d.gelen)}</td>
                  <td className="px-3.5 py-2 text-right text-[#ef4444] tabular-nums">{fmt(d.giden)}</td>
                  <td className="px-3.5 py-2 text-right text-[#f97316] tabular-nums">{fmt(d.masraf)}</td>
                  <td className="px-3.5 py-2 text-right font-semibold tabular-nums" style={{ color: d.net >= 0 ? C.accent : C.danger }}>{fmt(d.net)}</td>
                  <td className="px-3.5 py-2 text-right text-muted-foreground tabular-nums">{d.dosya}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
