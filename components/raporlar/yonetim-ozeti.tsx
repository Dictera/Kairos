'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Filter,
  Gavel,
  DollarSign,
  Trophy,
  Briefcase,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'

import {
  C,
  fmt,
  fmtK,
  fmtKN,
  enrichAy,
  type AyRow,
  type SirketRow,
  type SonucTurRow,
  type DosyaStatusRow,
} from './raporlar-data'
import { KPICard, CardHead, Pill, ReportLoading, ReportEmpty } from './raporlar-shared'

const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
})
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), {
  ssr: false,
})

interface YonetimOzetiData {
  yil: string
  ayBuYil: AyRow[]
  toplam: { talep: number; karar: number; tahsilat: number }
  sirketler: SirketRow[]
  sonucTur: SonucTurRow[]
  dosyaStatus: DosyaStatusRow[]
}

export function YonetimOzeti() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.yonetimOzeti.queryOptions() as unknown as {
      queryKey: unknown[]
      queryFn: () => Promise<YonetimOzetiData>
    },
  )

  const ayBuYil = useMemo(() => enrichAy(data?.ayBuYil ?? []), [data?.ayBuYil])

  if (isLoading) return <ReportLoading />
  if (!data) return <ReportEmpty />

  const { yil, toplam, sirketler, sonucTur, dosyaStatus } = data

  // Portfolio-wide totals from the server (sirketler is only the top 8 companies).
  const { talep: topTalep, karar: topKarar, tahsilat: topTahsilat } = toplam
  const topDosya = dosyaStatus.reduce((a, d) => a + d.adet, 0)

  const sonucTot = sonucTur.reduce(
    (a, t) => ({ k: a.k + t.kazan, u: a.u + t.uzlasma, l: a.l + t.kaybet }),
    { k: 0, u: 0, l: 0 },
  )
  const winRate =
    sonucTot.k + sonucTot.u + sonucTot.l > 0
      ? (((sonucTot.k + sonucTot.u) / (sonucTot.k + sonucTot.u + sonucTot.l)) * 100).toFixed(0)
      : '0'

  const funnel = [
    { label: 'Talep', tutar: topTalep, renk: C.accent },
    { label: 'Karar', tutar: topKarar, renk: C.success },
    { label: 'Tahsilat', tutar: topTahsilat, renk: C.masraf },
  ]
  const fMax = funnel[0].tutar || 1

  const alerts = [
    topTalep > 0 && {
      sev: 'Bilgi',
      color: C.accent,
      Icon: CheckCircle2,
      msg: `Toplam tahsilat kayıp oranı: %${(((topTalep - topTahsilat) / topTalep) * 100).toFixed(1)} — talep → tahsilat farkı`,
    },
  ].filter(Boolean) as Array<{ sev: string; color: string; msg: string; Icon: LucideIcon }>

  const trendData = ayBuYil.map((d) => ({ name: d.label, Gelen: d.gelen, Net: d.net }))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Toplam Talep" value={fmtK(topTalep)} color={C.accent} Icon={Filter} />
        <KPICard
          label="Karar / Uzlaşma"
          value={fmtK(topKarar)}
          color={C.success}
          Icon={Gavel}
          sub={topTalep > 0 ? `Talepten %${((topKarar / topTalep) * 100).toFixed(0)}` : undefined}
        />
        <KPICard
          label="Tahsilat"
          value={fmtK(topTahsilat)}
          color={C.masraf}
          Icon={DollarSign}
          sub={
            topKarar > 0 ? `Karardan %${((topTahsilat / topKarar) * 100).toFixed(0)}` : undefined
          }
        />
        <KPICard
          label="Başarı Oranı"
          value={`%${winRate}`}
          color={C.purple}
          Icon={Trophy}
          sub={`${sonucTot.k} kazanıldı, ${sonucTot.u} uzlaşma`}
        />
        <KPICard label="Toplam Dosya" value={topDosya} color={C.accent} Icon={Briefcase} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Tazminat Hunisi" sub="Talep → Mahkeme Kararı → Fiilen Tahsil Edilen" />
          <CardContent className="px-[18px] py-4">
            <div className="flex flex-col gap-2.5">
              {funnel.map((f, i) => {
                const pct = (f.tutar / fMax) * 100
                const kayip = i > 0 ? funnel[i - 1].tutar - f.tutar : 0
                return (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: f.renk }} />
                        <span className="text-[13px] font-semibold">{f.label}</span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="text-[14px] font-bold" style={{ color: f.renk }}>
                          {fmt(f.tutar)}
                        </span>
                        {kayip > 0 && (
                          <span className="text-[11px] text-[#ef4444] ml-2">
                            ▼ {fmt(kayip)} kayıp
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-7 rounded-md bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-md flex items-center pl-2.5 transition-all duration-500"
                        style={{ width: `${pct}%`, background: f.renk }}
                      >
                        <span className="text-[11px] font-bold text-white whitespace-nowrap">
                          %{pct.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title={`${yil} Yılı Gelir Trendi`} sub="Aylık gelen tahsilat ve net gelir" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={50} />
                  <Tooltip
                    formatter={(v: unknown) => (typeof v === 'number' ? fmt(v) : String(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="Gelen"
                    stroke={C.success}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Net"
                    stroke={C.accent}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Öne Çıkan Uyarılar & Bilgiler" />
        <CardContent className="px-[18px] py-4">
          <div className="flex flex-col gap-2">
            {alerts.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Aktif uyarı bulunmuyor.</p>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.msg}
                  className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                  style={{ background: `${a.color}0d`, border: `1px solid ${a.color}30` }}
                >
                  <a.Icon className="h-4 w-4 flex-shrink-0" style={{ color: a.color }} />
                  <Pill label={a.sev} color={a.color} />
                  <span className="text-[13px]">{a.msg}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Dava Türü Özeti" />
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Tür', 'Kazanılan', 'Kayb.', 'Oran'].map((h) => (
                  <th
                    key={h}
                    className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Tür' ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sonucTur.map((t) => {
                const tot = t.kazan + t.uzlasma + t.kaybet
                const oran = tot > 0 ? ((t.kazan + t.uzlasma) / tot) * 100 : 0
                const col = oran >= 80 ? C.success : oran >= 65 ? C.warning : C.danger
                return (
                  <tr key={t.tur} className="border-t">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-sm" style={{ background: t.renk }} />
                        <span className="text-[12.5px] font-medium">{t.tur}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-[#22c55e] font-semibold tabular-nums">
                      {t.kazan + t.uzlasma}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-[#ef4444] tabular-nums">
                      {t.kaybet}
                    </td>
                    <td
                      className="px-3.5 py-2.5 text-right font-bold tabular-nums"
                      style={{ color: col }}
                    >
                      %{oran.toFixed(0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Şirket Bazlı Tazminat Özeti" sub="3 kademeli karşılaştırma" />
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Şirket', 'Talep', 'Karar', 'Tahsilat'].map((h) => (
                  <th
                    key={h}
                    className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Şirket' ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sirketler.map((s) => (
                <tr key={s.ad} className="border-t">
                  <td className="px-3.5 py-2.5 font-medium text-[12.5px]">{s.ad}</td>
                  <td className="px-3.5 py-2.5 text-right text-muted-foreground text-[12px] tabular-nums">
                    {fmtK(s.talep)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-[#22c55e] text-[12px] font-medium tabular-nums">
                    {fmtK(s.karar)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-[#f97316] text-[12px] font-semibold tabular-nums">
                    {fmtK(s.tahsilat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
