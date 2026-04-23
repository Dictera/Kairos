'use client'

import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmt, fmtK, tahsilatColor } from './finans-data'

const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const PieChart            = dynamic(() => import('recharts').then(m => m.PieChart),            { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> })
const Pie                 = dynamic(() => import('recharts').then(m => m.Pie),                 { ssr: false })
const Cell                = dynamic(() => import('recharts').then(m => m.Cell),                { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

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

export function SirketTur() {
  const trpc = useTRPC()

  const { data: sirketData, isLoading: sirketLoading } = useQuery(
    trpc.finans.sirket.queryOptions()
  )
  const { data: turData, isLoading: turLoading } = useQuery(
    trpc.finans.tur.queryOptions()
  )

  if (sirketLoading || turLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  const sirket = sirketData ?? []
  const tur    = turData    ?? []

  const totalTalep    = sirket.reduce((a, s) => a + s.talep,    0)
  const totalTahsilat = sirket.reduce((a, s) => a + s.tahsilat, 0)
  const ortOran       = totalTalep > 0 ? ((totalTahsilat / totalTalep) * 100).toFixed(1) : '0'

  const tahsilatData = sirket.map(s => ({ name: s.ad, Talep: s.talep, Tahsilat: s.tahsilat }))
  const oranData     = sirket.map(s => ({
    name: s.ad,
    Oran: s.talep > 0 ? +((s.tahsilat / s.talep) * 100).toFixed(1) : 0,
    fill: tahsilatColor(s.talep > 0 ? (s.tahsilat / s.talep) * 100 : 0),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <KPIPill value={fmt(totalTalep)}    label="Toplam Talep"        color="#1c768f" />
        <KPIPill value={fmt(totalTahsilat)} label="Toplam Tahsilat"     color="#22c55e" />
        <KPIPill value={`%${ortOran}`}      label="Ort. Tahsilat Oranı" color={parseFloat(ortOran) >= 75 ? '#22c55e' : '#f97316'} />
        <KPIPill value={sirket.length}      label="Şirket Sayısı"       color="var(--muted-foreground)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Şirket Bazlı Talep & Tahsilat</CardTitle>
            <p className="text-xs text-muted-foreground">Talep tutarı vs. tahsil edilen</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tahsilatData} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Talep"    fill="oklch(0.527 0.089 230 / 0.3)" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Tahsilat" fill="#1c768f"                       radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tahsilat Oranı (%)</CardTitle>
            <p className="text-xs text-muted-foreground">Şirket başına tahsilat verimliliği — yeşil ≥80%, turuncu ≥60%</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oranData} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `%${v}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: unknown) => `%${v}`} />
                  <Bar dataKey="Oran" radius={[0, 3, 3, 0]}>
                    {oranData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        {tur.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sigorta Türü Dağılımı</CardTitle>
              <p className="text-xs text-muted-foreground">Tahsilata göre kırılım</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tur} dataKey="gelen" nameKey="tur" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%">
                      {tur.map((entry, i) => <Cell key={i} fill={entry.renk} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Şirket Performans Tablosu</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {['Şirket', 'Dosya', 'Talep', 'Tahsilat', 'Oran'].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Şirket' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sirket.map((s, i) => {
                  const pct = s.talep > 0 ? (s.tahsilat / s.talep) * 100 : 0
                  const col = tahsilatColor(pct)
                  return (
                    <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{s.ad}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{s.dosya}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(s.talep)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium" style={{ color: '#1c768f' }}>{fmt(s.tahsilat)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14"><ProgressBar pct={pct} color={col} /></div>
                          <span className="text-xs font-semibold min-w-[36px] text-right tabular-nums" style={{ color: col }}>%{pct.toFixed(0)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sirket.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Henüz şirket verisi yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
