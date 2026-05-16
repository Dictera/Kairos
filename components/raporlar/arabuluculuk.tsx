'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Handshake, Gavel, Clock } from 'lucide-react'

import { C, type ArabuluculukAylikRow } from './raporlar-data'
import { KPICard, CardHead, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const Cell                = dynamic(() => import('recharts').then(m => m.Cell),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

export function Arabuluculuk() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.arabuluculuk.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<{ aylik: ArabuluculukAylikRow[] }> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.aylik.length === 0) return <ReportEmpty />

  const aylik = data.aylik
  const totAra     = aylik.reduce((a, r) => a + r.ara, 0)
  const totDava    = aylik.reduce((a, r) => a + r.dava, 0)
  const totAraCoz  = aylik.reduce((a, r) => a + r.araCoz, 0)
  const totDavaCoz = aylik.reduce((a, r) => a + r.davaCoz, 0)
  const araBasari  = totAra > 0 ? ((totAraCoz / totAra) * 100).toFixed(0) : '0'
  const davaBasari = totDava > 0 ? ((totDavaCoz / totDava) * 100).toFixed(0) : '0'
  const ortAraSure  = Math.round(aylik.reduce((a, r) => a + r.araSure, 0) / aylik.length)
  const ortDavaSure = Math.round(aylik.reduce((a, r) => a + r.davaSure, 0) / aylik.length)

  const karisikChart = aylik.map(r => ({ name: r.ay, Arabuluculuk: r.ara, Dava: r.dava }))
  const sureChart    = [
    { name: 'Arabuluculuk', Sure: ortAraSure,  fill: C.accent },
    { name: 'Dava',         Sure: ortDavaSure, fill: C.danger },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Arabuluculuk"     value={totAra}               color={C.accent}  Icon={Handshake} sub={`${totAraCoz} çözüldü (%${araBasari})`} />
        <KPICard label="Dava"             value={totDava}              color={C.danger}  Icon={Gavel}     sub={`${totDavaCoz} sonuçlandı (%${davaBasari})`} />
        <KPICard label="Ort. Ara Süresi"  value={`${ortAraSure} gün`}  color={C.success} Icon={Clock}     sub="Arabuluculuk tamamlanma" />
        <KPICard label="Ort. Dava Süresi" value={`${ortDavaSure} gün`} color={C.masraf}  Icon={Clock}
          sub={ortAraSure > 0 ? `${Math.round(ortDavaSure / ortAraSure)}× daha uzun` : undefined} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Aylık Arabuluculuk / Dava Dağılımı" sub="Yığılmış — mavi arabuluculuk, kırmızı dava" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={karisikChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip formatter={(v: unknown, n: unknown) => `${v} ${String(n)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Arabuluculuk" stackId="s" fill={C.accent} />
                  <Bar dataKey="Dava"         stackId="s" fill={C.danger} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Ortalama Çözüm Süresi" sub="Yol bazlı karşılaştırma" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sureChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} gün`} width={56} />
                  <Tooltip formatter={(v: unknown) => `${v} gün`} />
                  <Bar dataKey="Sure" radius={[6, 6, 0, 0]} barSize={60}>
                    {sureChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Yol Bazlı Başarı Karşılaştırması" />
          <CardContent className="px-[18px] py-4">
            <div className="flex flex-col gap-3.5">
              {[
                { label: 'Arabuluculuk', coz: totAraCoz, top: totAra, oran: araBasari, color: C.accent, avantaj: 'Hızlı sonuç · düşük maliyet · gizlilik' },
                { label: 'Dava', coz: totDavaCoz, top: totDava, oran: davaBasari, color: C.danger, avantaj: 'Kesin hüküm · icra kabiliyeti · emsal' },
              ].map((r, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[14px]" style={{ color: r.color }}>{r.label}</span>
                    <span className="text-[22px] font-extrabold tabular-nums" style={{ color: r.color }}>%{r.oran}</span>
                  </div>
                  <ProgressBar pct={parseFloat(r.oran)} color={r.color} h={7} />
                  <p className="text-[11.5px] text-muted-foreground mt-2">
                    {r.coz}/{r.top} dosya çözüldü · {r.avantaj}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Aylık Çözüm Detayı" />
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Ay', 'Ara', 'Ara Çöz', 'Dava', 'Dava Çöz'].map(h => (
                  <th key={h} className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Ay' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aylik.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-1.5 font-medium text-[12.5px]">{r.ay}</td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground text-[12px] tabular-nums">{r.ara}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-[#1c768f] text-[12px] tabular-nums">{r.araCoz}</td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground text-[12px] tabular-nums">{r.dava}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-[#ef4444] text-[12px] tabular-nums">{r.davaCoz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
