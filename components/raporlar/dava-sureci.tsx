'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, AlertOctagon, Layers, CheckCircle2 } from 'lucide-react'

import { C, fmt, type AsamaRow, type UzunDosyaRow } from './raporlar-data'
import { KPICard, CardHead, Pill, ReportLoading, ReportEmpty } from './raporlar-shared'

interface DavaSureData {
  asamalar:       AsamaRow[]
  uzunDosyalar:   UzunDosyaRow[]
  sirketSureleri: { ad: string; ortGun: number }[]
  kapananYil:     number
}

type AsamaBarItem  = { name: string; 'Ort. Süre': number; 'Maks. Süre': number; fill: string }
type SirketBarItem = { name: string; Gun: number; fill: string }

// Computed once at module load (stable across SSR/hydration) — avoids new Date() in render
const PREV_YEAR = new Date().getFullYear() - 1

const AsamaBarChart = dynamic<{ data: AsamaBarItem[] }>(
  async () => {
    const {
      BarChart, Bar, Cell, XAxis, YAxis,
      CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    } = await import('recharts')

    return function AsamaBarChart({ data }: { data: AsamaBarItem[] }) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-12} textAnchor="end" height={56} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}g`} width={42} />
            <Tooltip formatter={(v: unknown) => `${v} gün`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Ort. Süre" fill={C.accent} radius={[4, 4, 0, 0]}>
              {data.map((a) => <Cell key={a.name} fill={a.fill} />)}
            </Bar>
            <Bar dataKey="Maks. Süre" fill="#94a3b8" radius={[4, 4, 0, 0]}>
              {data.map((d) => <Cell key={d.name} fill="#94a3b8" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  },
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> },
)

const SirketBarChart = dynamic<{ data: SirketBarItem[] }>(
  async () => {
    const {
      BarChart, Bar, Cell, XAxis, YAxis,
      CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
    } = await import('recharts')

    return function SirketBarChart({ data }: { data: SirketBarItem[] }) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} gün`} width={56} />
            <Tooltip formatter={(v: unknown) => `${v} gün`} />
            <ReferenceLine y={180} stroke={C.accent} strokeDasharray="6 4" />
            <Bar dataKey="Gun" radius={[5, 5, 0, 0]} name="Ort. Çözüm">
              {data.map((s) => <Cell key={s.name} fill={s.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  },
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> },
)

const ASAMA_COLORS: Record<string, string> = {
  'Başvuru':          C.accent,
  'Belge Toplama':    C.success,
  'Şirket Görüşme':   C.masraf,
  'Uzlaşma':          C.purple,
  'Dava':             C.danger,
  'Karar & Tahsilat': C.amber,
}

export function DavaSureci() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.davaSureci.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<DavaSureData> },
  )

  if (isLoading) return <ReportLoading />
  if (!data || data.asamalar.length === 0) return <ReportEmpty />

  const { asamalar, uzunDosyalar, sirketSureleri, kapananYil } = data
  const ortToplam = asamalar.reduce((a, s) => a + s.ort, 0)
  const enUzun    = asamalar.reduce((a, b) => (b.ort > a.ort ? b : a))
  const aktif     = asamalar.reduce((a, s) => a + s.adet, 0)

  const asamaChart: AsamaBarItem[]  = asamalar.map(a => ({ name: a.asama, 'Ort. Süre': a.ort, 'Maks. Süre': a.max, fill: a.renk }))
  const sirketChart: SirketBarItem[] = sirketSureleri.map(s => ({
    name: s.ad, Gun: s.ortGun,
    fill: s.ortGun > 270 ? C.danger : s.ortGun > 200 ? C.warning : C.success,
  }))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Ort. Toplam Süre" value={`${ortToplam} gün`} color={C.accent}  Icon={Clock}        sub="Açılıştan kapanışa" />
        <KPICard label="En Uzun Aşama"    value={enUzun.asama}        color={C.danger}  Icon={AlertOctagon} sub={`Ort. ${enUzun.ort} gün`} />
        <KPICard label="Aktif Dosya"      value={aktif}               color={C.success} Icon={Layers} />
        <KPICard label={`${PREV_YEAR} Kapanan`} value={kapananYil} color={C.masraf} Icon={CheckCircle2} sub="Yıl boyunca kapanan" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card className="overflow-hidden p-0">
          <CardHead title="Aşama Bazlı Süre" sub="Ortalama (koyu) ve maksimum (soluk) gün" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[260px]">
              <AsamaBarChart data={asamaChart} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHead title="Şirket Bazlı Ort. Çözüm Süresi" sub="Hedef: 180 gün — kırmızı aşıldı" />
          <CardContent className="px-[18px] py-4">
            <div className="h-[260px]">
              <SirketBarChart data={sirketChart} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="En Uzun Süren Aktif Dosyalar" badge={`${uzunDosyalar.length} dosya`} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Dosya No', 'Müvekkil', 'Şirket', 'Mevcut Aşama', 'Geçen Süre', 'Tutar'].map(h => (
                  <th key={h} className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${['Geçen Süre','Tutar'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uzunDosyalar.map((d) => {
                const col = d.gun > 300 ? C.danger : d.gun > 200 ? C.warning : C.amber
                return (
                  <tr key={d.no} className={`border-t ${d.gun > 300 ? 'bg-[#ef444406]' : ''}`}>
                    <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted-foreground">{d.no}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-[13px]">{d.muvekkil}</td>
                    <td className="px-3.5 py-2.5 text-[12.5px] text-muted-foreground">{d.sirket}</td>
                    <td className="px-3.5 py-2.5"><Pill label={d.asama} color={ASAMA_COLORS[d.asama] ?? C.accent} /></td>
                    <td className="px-3.5 py-2.5 text-right font-bold tabular-nums" style={{ color: col }}>{d.gun} gün</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-[#1c768f] tabular-nums">{fmt(d.tutar)}</td>
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
