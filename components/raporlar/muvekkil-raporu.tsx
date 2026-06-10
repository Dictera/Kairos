'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Users, DollarSign, Folder, PieChart as PieIcon } from 'lucide-react'

import { C, fmt, fmtK, fmtKN, type MuvekkilRow } from './raporlar-data'
import { KPICard, CardHead, Pill, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

export function MuvekkilRaporu() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.muvekkil.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<{ rows: MuvekkilRow[] }> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.rows.length === 0) return <ReportEmpty />

  const rows = data.rows
  const topTahsilat = rows.reduce((a, m) => a + m.tahsilat, 0)
  const topDosya    = rows.reduce((a, m) => a + m.dosya, 0)
  const aktif       = rows.filter(m => m.durum === 'Aktif').length
  const ortOran     = rows.length > 0 ? rows.reduce((a, m) => a + m.oran, 0) / rows.length : 0
  const chartData   = rows.map(m => ({ name: m.ad.split(' ')[0], Tahsilat: m.tahsilat }))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Toplam Müvekkil"     value={rows.length}              color={C.accent}  Icon={Users}      sub={`${aktif} aktif`} />
        <KPICard label="Toplam Tahsilat"     value={fmtK(topTahsilat)}        color={C.success} Icon={DollarSign} />
        <KPICard label="Toplam Dosya"        value={topDosya}                 color={C.masraf}  Icon={Folder} />
        <KPICard label="Ort. Tahsilat Oranı" value={`%${ortOran.toFixed(0)}`} color={C.purple}  Icon={PieIcon} />
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Müvekkil Bazlı Tahsilat" />
        <CardContent className="px-[18px] py-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                <Bar dataKey="Tahsilat" fill={C.accent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHead title="Müvekkil Performans Tablosu" badge={`${rows.length} müvekkil`} />
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {['Müvekkil', 'Durum', 'Dosya', 'Tahsilat', 'Oran', 'Son Aktivite'].map(h => (
                <th key={h} className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${['Tahsilat','Oran'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const col = m.oran >= 85 ? C.success : m.oran >= 70 ? C.warning : C.danger
              return (
                <tr key={m.ad} className="border-t">
                  <td className="px-3.5 py-2.5 font-semibold text-[13px]">{m.ad}</td>
                  <td className="px-3.5 py-2.5"><Pill label={m.durum} color={m.durum === 'Aktif' ? C.success : C.warning} /></td>
                  <td className="px-3.5 py-2.5 text-muted-foreground tabular-nums">{m.dosya}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-[#1c768f] tabular-nums">{fmt(m.tahsilat)}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16"><ProgressBar pct={m.oran} color={col} /></div>
                      <span className="text-[12px] font-semibold min-w-[32px] tabular-nums" style={{ color: col }}>%{m.oran}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground text-[12.5px]">{m.son}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
