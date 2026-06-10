'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

import { C, fmt, fmtKN, type DosyaStatusRow, type DosyaTurRow } from './raporlar-data'
import { CardHead, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const StatusPieChart = dynamic<{ data: { name: string; value: number; fill: string }[] }>(
  async () => {
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = await import('recharts')
    return function StatusPieChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%">
              {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }
  },
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> },
)

interface DosyaRaporuData { status: DosyaStatusRow[]; tur: DosyaTurRow[] }

export function DosyaRaporu() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.dosya.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<DosyaRaporuData> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.status.length === 0) return <ReportEmpty />

  const { status, tur } = data
  const toplamDosya = status.reduce((a, d) => a + d.adet, 0)
  const turChart    = tur.map(t => ({ name: t.tur, Gelen: t.gelen, Giden: t.giden, Masraf: t.masraf }))
  const statusData  = status.map(s => ({ name: s.durum, value: s.adet, fill: s.renk }))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {status.map(d => (
          <div key={d.durum} className="rounded-b-xl bg-card border px-4 py-3.5 text-center" style={{ borderTopWidth: 3, borderTopColor: d.renk }}>
            <p className="text-[28px] font-bold tracking-tight tabular-nums" style={{ color: d.renk }}>{d.adet}</p>
            <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">{d.durum}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{toplamDosya > 0 ? `%${((d.adet / toplamDosya) * 100).toFixed(0)}` : '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Durum Dağılımı" sub={`Toplam ${toplamDosya} dosya`} />
          <CardContent className="px-[18px] py-4">
            <div className="h-[200px]">
              <StatusPieChart data={statusData} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Tür Bazlı Finansal Kırılım" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Gelen"  fill={C.success} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Giden"  fill={C.danger}  radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Masraf" fill={C.masraf}  radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Tür Detay Tablosu" />
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {['Tür', 'Adet', 'Gelen', 'Net', 'Kâr Marjı'].map(h => (
                <th key={h} className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Tür' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tur.map((d) => {
              const net  = d.gelen - d.giden - d.masraf
              const marj = d.gelen > 0 ? (net / d.gelen) * 100 : 0
              const col  = marj >= 40 ? C.success : marj >= 25 ? C.warning : C.danger
              return (
                <tr key={d.label} className="border-t">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.renk }} />
                      <span className="text-[12.5px] font-medium">{d.label}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-muted-foreground tabular-nums">{d.adet}</td>
                  <td className="px-3.5 py-2.5 text-right text-[#22c55e] font-medium tabular-nums">{fmt(d.gelen)}</td>
                  <td className="px-3.5 py-2.5 text-right text-[#1c768f] font-medium tabular-nums">{fmt(net)}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12"><ProgressBar pct={marj} color={col} /></div>
                      <span className="text-[12px] font-semibold min-w-[36px] tabular-nums" style={{ color: col }}>%{marj.toFixed(0)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
