'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, Gavel, DollarSign } from 'lucide-react'

import { C, fmt, fmtK, fmtKN, type SirketRow } from './raporlar-data'
import { CardHead, Pill, ProgressBar, ReportLoading, ReportEmpty } from './raporlar-shared'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const TierBarChart = dynamic<{ data: { name: string; Tutar: number; fill: string }[] }>(
  async () => {
    const { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = await import('recharts')
    return function TierBarChart({ data }: { data: { name: string; Tutar: number; fill: string }[] }) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10.5 }} />
            <YAxis tickFormatter={fmtKN} tick={{ fontSize: 11 }} width={48} />
            <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
            <Bar dataKey="Tutar" radius={[6, 6, 0, 0]}>
              {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  },
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> },
)

export function Tahsilat() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.tahsilat.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<{ sirketler: SirketRow[] }> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.sirketler.length === 0) return <ReportEmpty />

  const sirketler = data.sirketler
  const totT   = sirketler.reduce((a, s) => a + s.talep,    0)
  const totK   = sirketler.reduce((a, s) => a + s.karar,    0)
  const totTah = sirketler.reduce((a, s) => a + s.tahsilat, 0)
  const kayipKarar    = totT - totK
  const kayipTahsilat = totK - totTah

  const tier3Data = [
    { name: 'Talep',           Tutar: totT,   fill: C.accent  },
    { name: 'Karar / Uzlaşma', Tutar: totK,   fill: C.success },
    { name: 'Fiilen Tahsil',   Tutar: totTah, fill: C.masraf  },
  ]

  const sirketChart = sirketler.map(s => ({
    name: s.ad, Talep: s.talep, Karar: s.karar, Tahsilat: s.tahsilat,
  }))

  const tiers = [
    { label: 'Talep Edilen',     value: totT,   color: C.accent,  Icon: Filter,
      sub: 'Müvekkil adına talep' },
    { label: 'Karar / Uzlaşma',  value: totK,   color: C.success, Icon: Gavel,
      sub: totT > 0 ? `Talepten ▼ ${fmt(kayipKarar)} kayıp (%${((kayipKarar / totT) * 100).toFixed(1)})` : undefined },
    { label: 'Fiilen Tahsil',    value: totTah, color: C.masraf,  Icon: DollarSign,
      sub: totK > 0 ? `Karardan ▼ ${fmt(kayipTahsilat)} kayıp (%${((kayipTahsilat / totK) * 100).toFixed(1)})` : undefined },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 md:grid-cols-3 rounded-xl border overflow-hidden bg-card">
        {tiers.map((c, i) => (
          <div
            key={c.label}
            className={`px-5 py-[18px] border-t-[3px] ${i < tiers.length - 1 ? 'md:border-r' : ''}`}
            style={{ borderTopColor: c.color }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <c.Icon className="h-3.5 w-3.5" style={{ color: c.color }} />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
            </div>
            <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums" style={{ color: c.color }}>
              {fmtK(c.value)}
            </p>
            {c.sub && <p className="text-[11.5px] text-muted-foreground mt-1.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="3 Kademe Karşılaştırma" sub="Toplam tahsilat hunisi" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[220px]">
              <TierBarChart data={tier3Data} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Şirket Bazlı — Talep / Karar / Tahsilat" sub="Her şirket için 3 kademedeki tutar" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sirketChart} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={fmtKN} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Talep"    fill={`${C.accent}66`}  radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Karar"    fill={C.success}        radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Tahsilat" fill={C.masraf}         radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead
          title="Şirket Detay Tablosu — 3 Kademeli"
          badge={`${sirketler.length} şirket`}
          sub="Talep: müvekkilin istediği · Karar: mahkeme/uzlaşma kararı · Tahsilat: ödenen"
        />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Şirket', 'Tür', 'Dosya', 'Talep', 'Karar', 'Karar Oranı', 'Tahsilat', 'Tahsilat Oranı', 'Toplam Kayıp'].map(h => (
                  <th key={h} className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${['Şirket','Tür'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sirketler.map((s) => {
                const kOran    = s.talep > 0 ? (s.karar / s.talep) * 100 : 0
                const tOran    = s.karar > 0 ? (s.tahsilat / s.karar) * 100 : 0
                const topKayip = s.talep - s.tahsilat
                const kCol     = kOran >= 80 ? C.success : kOran >= 65 ? C.warning : C.danger
                const tCol     = tOran >= 90 ? C.success : tOran >= 80 ? C.warning : C.danger
                return (
                  <tr key={s.ad} className="border-t">
                    <td className="px-3 py-2.5 font-semibold text-[13px]">{s.ad}</td>
                    <td className="px-3 py-2.5"><Pill label={s.tur} color={C.accent} /></td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">{s.dosya}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground text-[12px] tabular-nums">{fmt(s.talep)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-[#22c55e] tabular-nums">{fmt(s.karar)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-11"><ProgressBar pct={kOran} color={kCol} /></div>
                        <span className="text-[11.5px] font-bold min-w-[32px] tabular-nums" style={{ color: kCol }}>%{kOran.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#f97316] tabular-nums">{fmt(s.tahsilat)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-11"><ProgressBar pct={tOran} color={tCol} /></div>
                        <span className="text-[11.5px] font-bold min-w-[32px] tabular-nums" style={{ color: tCol }}>%{tOran.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#ef4444] text-[12px] tabular-nums">{fmt(topKayip)}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 bg-muted/50">
                <td colSpan={3} className="px-3 py-2.5 font-bold text-[12.5px]">TOPLAM</td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums">{fmt(totT)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#22c55e] tabular-nums">{fmt(totK)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#22c55e] tabular-nums">{totT > 0 ? `%${((totK / totT) * 100).toFixed(0)}` : '—'}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#f97316] tabular-nums">{fmt(totTah)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#f97316] tabular-nums">{totK > 0 ? `%${((totTah / totK) * 100).toFixed(0)}` : '—'}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#ef4444] tabular-nums">{fmt(totT - totTah)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
