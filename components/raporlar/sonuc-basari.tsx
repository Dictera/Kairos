'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, CheckCircle2, Handshake, XCircle, Clock } from 'lucide-react'

import {
  C, type SonucSirketRow, type SonucTurRow, type SonucAylikRow,
} from './raporlar-data'
import { KPICard, CardHead, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[160px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart),            { ssr: false, loading: () => <Skeleton className="h-[160px] w-full" /> })
const Pie                 = dynamic(() => import('recharts').then(m => m.Pie),                 { ssr: false })
const Cell                = dynamic(() => import('recharts').then(m => m.Cell),                { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface SonucBasariData {
  sirket: SonucSirketRow[]
  tur:    SonucTurRow[]
  aylik:  SonucAylikRow[]
}

export function SonucBasari() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.sonucBasari.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<SonucBasariData> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.tur.length === 0) return <ReportEmpty />

  const { sirket, tur, aylik } = data

  const totKazan   = tur.reduce((a, t) => a + t.kazan,   0)
  const totUzlasma = tur.reduce((a, t) => a + t.uzlasma, 0)
  const totKaybet  = tur.reduce((a, t) => a + t.kaybet,  0)
  const totDevam   = tur.reduce((a, t) => a + t.devam,   0)
  const winBase    = totKazan + totUzlasma + totKaybet
  const winRate    = winBase > 0 ? ((totKazan + totUzlasma) / winBase * 100).toFixed(1) : '0'

  const aylikChart  = aylik.map(a => ({ name: a.ay, Kazanıldı: a.kazan, Uzlaşma: a.uzlasma, Kaybedildi: a.kaybet }))
  const sirketChart = sirket.map(s => ({ name: s.ad, Kazanıldı: s.kazan, Uzlaşma: s.uzlasma, Kaybedildi: s.kaybet }))

  const donut = [
    { name: 'Kazanıldı',    value: totKazan,   fill: C.success },
    { name: 'Uzlaşma',      value: totUzlasma, fill: C.accent  },
    { name: 'Kaybedildi',   value: totKaybet,  fill: C.danger  },
    { name: 'Devam ediyor', value: totDevam,   fill: '#94a3b8' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Başarı Oranı" value={`%${winRate}`} color={C.success} Icon={Trophy}
          sub="Kazanılan + uzlaşma" />
        <KPICard label="Kazanıldı"    value={totKazan}      color={C.success} Icon={CheckCircle2} />
        <KPICard label="Uzlaşma"      value={totUzlasma}    color={C.accent}  Icon={Handshake} />
        <KPICard label="Kaybedildi"   value={totKaybet}     color={C.danger}  Icon={XCircle} />
        <KPICard label="Devam Ediyor" value={totDevam}      color="#94a3b8"   Icon={Clock} />
      </div>

      {/* Row 2 — 3 charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Aylık Sonuç" sub="Yığılmış bar" />
          <CardContent className="px-3 py-2">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aylikChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Kazanıldı"  stackId="s" fill={C.success} />
                  <Bar dataKey="Uzlaşma"    stackId="s" fill={C.accent}  />
                  <Bar dataKey="Kaybedildi" stackId="s" fill={C.danger}  radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Genel Dağılım" />
          <CardContent className="px-3 py-2">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="75%">
                    {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Şirket Bazlı Sonuç" sub="Kazanılan / uzlaşma / kayıp" />
          <CardContent className="px-3 py-2">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sirketChart} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
                  <Tooltip />
                  <Bar dataKey="Kazanıldı"  stackId="w" fill={C.success} />
                  <Bar dataKey="Uzlaşma"    stackId="w" fill={C.accent}  />
                  <Bar dataKey="Kaybedildi" stackId="w" fill={C.danger}  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Tür table */}
      <Card className="overflow-hidden p-0">
        <CardHead title="Dava Türü Başarı Tablosu" />
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {['Tür', 'Kazanıldı', 'Uzlaşma', 'Kayıp', 'Devam', 'Başarı Oranı'].map(h => (
                <th key={h} className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Tür' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tur.map((t, i) => {
              const tot  = t.kazan + t.uzlasma + t.kaybet
              const oran = tot > 0 ? ((t.kazan + t.uzlasma) / tot) * 100 : 0
              const col  = oran >= 80 ? C.success : oran >= 65 ? C.warning : C.danger
              return (
                <tr key={i} className="border-t">
                  <td className="px-3.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.renk }} />
                      <span className="font-medium text-[13px]">{t.tur}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2 text-right text-[#22c55e] font-semibold tabular-nums">{t.kazan}</td>
                  <td className="px-3.5 py-2 text-right text-[#1c768f] font-semibold tabular-nums">{t.uzlasma}</td>
                  <td className="px-3.5 py-2 text-right text-[#ef4444] tabular-nums">{t.kaybet}</td>
                  <td className="px-3.5 py-2 text-right text-muted-foreground tabular-nums">{t.devam}</td>
                  <td className="px-3.5 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14"><ProgressBar pct={oran} color={col} /></div>
                      <span className="text-[12px] font-bold min-w-[38px] tabular-nums" style={{ color: col }}>%{oran.toFixed(1)}</span>
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
