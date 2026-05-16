'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

const Bar             = dynamic(() => import('recharts').then(m => m.Bar),             { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> })
const XAxis           = dynamic(() => import('recharts').then(m => m.XAxis),           { ssr: false })
const YAxis           = dynamic(() => import('recharts').then(m => m.YAxis),           { ssr: false })
const Tooltip         = dynamic(() => import('recharts').then(m => m.Tooltip),         { ssr: false })
const Legend          = dynamic(() => import('recharts').then(m => m.Legend),          { ssr: false })
const ComposedChart   = dynamic(() => import('recharts').then(m => m.ComposedChart),   { ssr: false })
const AreaChart       = dynamic(() => import('recharts').then(m => m.AreaChart),       { ssr: false })
const Area            = dynamic(() => import('recharts').then(m => m.Area),            { ssr: false })
const Line            = dynamic(() => import('recharts').then(m => m.Line),            { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const ReferenceLine   = dynamic(() => import('recharts').then(m => m.ReferenceLine),   { ssr: false })

interface GenelBakisRow {
  ay: string
  gelen: number
  giden: number
  masraf: number
  net: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const fmtK = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

const C = { gelen: '#22c55e', giden: '#ef4444', masraf: '#f97316', net: '#1c768f', kasa: '#1c768f' }

export function GenelBakis({ data }: { data: GenelBakisRow[] }) {
  if (!data.length) {
    return <div className="py-12 text-center text-muted-foreground">Finansal kayıt bulunamadı.</div>
  }

  const chartData = data.map(d => ({
    name: d.ay,
    Gelen: d.gelen,
    Giden: d.giden,
    Masraf: d.masraf,
    Net: d.net,
  }))

  // Kümülatif net
  let kumulatif = 0
  const kasaData = data.map(d => {
    kumulatif += d.net
    return { name: d.ay, Kasa: kumulatif }
  })

  const toplamGelen  = data.reduce((s, d) => s + d.gelen,  0)
  const toplamGiden  = data.reduce((s, d) => s + d.giden,  0)
  const toplamMasraf = data.reduce((s, d) => s + d.masraf, 0)
  const toplamNet    = data.reduce((s, d) => s + d.net,    0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aylık Gelir/Gider Özeti</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 30 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={fmtK} width={52} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Gelen"  fill={C.gelen}  name="Gelen"  />
                <Bar dataKey="Giden"  fill={C.giden}  name="Giden"  />
                <Bar dataKey="Masraf" fill={C.masraf} name="Masraf" />
                <Line type="monotone" dataKey="Net" stroke={C.net} strokeWidth={2.5}
                  dot={{ r: 3, fill: C.net }} name="Net" strokeDasharray="6 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Kümülatif Kasa Bakiyesi</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kasaData} margin={{ top: 8, right: 16, left: 0, bottom: 30 }}>
                <defs>
                  <linearGradient id="kasaGradientGB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.kasa} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.kasa} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={fmtK} width={55} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Kasa" name="Kasa Bakiyesi"
                  stroke={C.kasa} strokeWidth={2.5} fill="url(#kasaGradientGB)"
                  dot={{ r: 4, fill: C.kasa, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Gelen', value: toplamGelen, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Toplam Giden', value: toplamGiden, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Toplam Masraf', value: toplamMasraf, color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Toplam Net', value: toplamNet, color: toplamNet >= 0 ? 'text-green-700' : 'text-red-700', bg: toplamNet >= 0 ? 'bg-green-50' : 'bg-red-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg p-4 ${item.bg}`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{fmt(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
