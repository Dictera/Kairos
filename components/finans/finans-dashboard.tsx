'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { C, fmt, fmtK } from './finans-data'

import dynamic from 'next/dynamic'
const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const Legend              = dynamic(() => import('recharts').then(m => m.Legend),              { ssr: false })
const LineChart           = dynamic(() => import('recharts').then(m => m.LineChart),           { ssr: false })
const Line                = dynamic(() => import('recharts').then(m => m.Line),                { ssr: false })
const ComposedChart       = dynamic(() => import('recharts').then(m => m.ComposedChart),       { ssr: false })
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart),           { ssr: false })
const Area                = dynamic(() => import('recharts').then(m => m.Area),                { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const ReferenceLine       = dynamic(() => import('recharts').then(m => m.ReferenceLine),       { ssr: false })

const MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ttFmt = (v: any) => typeof v === 'number' ? fmt(v) : String(v)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NetBarShape = (props: any) => {
  const { x, y, width, height, value } = props
  if (!width || !height) return null
  return (
    <rect x={x} y={y} width={width} height={height}
      fill={(value as number) >= 0 ? C.gelen : C.giden}
      rx={3} ry={3} />
  )
}
const netBarShape = <NetBarShape />

export function FinansDashboard() {
  const trpc = useTRPC()
  const [selectedYear, setSelectedYear] = useState<number | undefined>()

  const { data, isLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({ yil: selectedYear })
  )

  const availableYears = data?.yearly?.map(y => parseInt(y.yil)) ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Skeleton className="h-[280px] w-full" />
          <Skeleton className="h-[280px] w-full" />
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
    )
  }

  const monthly = data?.monthly ?? []

  const chartData = monthly.map(m => {
    const [year, month] = m.ay.split('-')
    const net = m.gelen - m.giden - m.masraf
    return {
      name: `${MONTHS_SHORT[parseInt(month) - 1]} ${year}`,
      Gelen: m.gelen, Giden: m.giden, Masraf: m.masraf, Net: net,
    }
  })

  const kasaData = chartData.reduce<{ name: string; Kasa: number }[]>((acc, e) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].Kasa : 0
    acc.push({ name: e.name, Kasa: prev + e.Net })
    return acc
  }, [])

  return (
    <div className="space-y-5">
      {/* Year filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Yıl:</span>
        <Tabs
          value={selectedYear?.toString() ?? 'all'}
          onValueChange={v => setSelectedYear(v === 'all' ? undefined : parseInt(v))}
        >
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            {availableYears.map(y => (
              <TabsTrigger key={y} value={y.toString()}>{y}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Row 1 — 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Aylık Özet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aylık Özet</CardTitle>
            <p className="text-xs text-muted-foreground">Gelen / Giden / Masraf ve Net</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top:32, right:16, left:0, bottom:55 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={fmtK} width={48} tick={{ fontSize:11 }} />
                  <Tooltip formatter={ttFmt} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize:12, paddingBottom:8 }} />
                  <Bar dataKey="Gelen"  fill={C.gelen}  name="Gelen"  />
                  <Bar dataKey="Giden"  fill={C.giden}  name="Giden"  />
                  <Bar dataKey="Masraf" fill={C.masraf} name="Masraf" />
                  <Line type="monotone" dataKey="Net" stroke={C.net} strokeWidth={2.5}
                    dot={{ r:3, fill:C.net }} name="Net" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Aylık Net Bakiye */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aylık Net Bakiye</CardTitle>
            <p className="text-xs text-muted-foreground">Pozitif = yeşil, negatif = kırmızı</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top:8, right:16, left:0, bottom:55 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={fmtK} width={48} tick={{ fontSize:11 }} />
                  <Tooltip formatter={ttFmt} />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                  <Bar dataKey="Net" name="Net Bakiye" shape={netBarShape} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Kasa Bakiyesi full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Kasa Bakiyesi</CardTitle>
          <p className="text-xs text-muted-foreground">Kümülatif net — kasada biriken tutar</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kasaData} margin={{ top:8, right:16, left:0, bottom:55 }}>
                <defs>
                  <linearGradient id="kasaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.kasa} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.kasa} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={fmtK} width={55} tick={{ fontSize:11 }} />
                <Tooltip formatter={ttFmt} />
                <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Kasa" name="Kasa Bakiyesi"
                  stroke={C.kasa} strokeWidth={2.5} fill="url(#kasaGradient)"
                  dot={{ r:4, fill:C.kasa, strokeWidth:0 }} activeDot={{ r:6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 3 — Aylık Trend full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aylık Trend</CardTitle>
          <p className="text-xs text-muted-foreground">4 serinin çizgi grafiği</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top:32, right:16, left:0, bottom:55 }}>
                <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={fmtK} width={48} tick={{ fontSize:11 }} />
                <Tooltip formatter={ttFmt} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize:12, paddingBottom:8 }} />
                <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Gelen"  stroke={C.gelen}  name="Gelen"  strokeWidth={2}   dot={{ r:3 }} />
                <Line type="monotone" dataKey="Giden"  stroke={C.giden}  name="Giden"  strokeWidth={2}   dot={{ r:3 }} />
                <Line type="monotone" dataKey="Masraf" stroke={C.masraf} name="Masraf" strokeWidth={2}   dot={{ r:3 }} />
                <Line type="monotone" dataKey="Net"    stroke={C.net}    name="Net"    strokeWidth={2.5} dot={{ r:4 }} strokeDasharray="6 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
