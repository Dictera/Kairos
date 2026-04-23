'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableCell, TableRow } from '@/components/ui/table'
import { DataTable, ColumnMeta } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { C, fmt, fmtK } from './finans-data'

import dynamic from 'next/dynamic'
const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> })
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

const MONTHS_TR_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

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

// ── Row types ─────────────────────────────────────────────────────────────────

type MonthlyRow = { ay: string; gelen: number; giden: number; masraf: number; net: number }
type YearlyRow  = { yil: string; gelen: number; giden: number; masraf: number; net: number }

// ── Column definitions ─────────────────────────────────────────────────────────

const rightMeta: ColumnMeta = { align: 'right' }

const monthlyColumns: ColumnDef<MonthlyRow>[] = [
  { accessorKey: 'ay',     header: 'Ay',     meta: { align: 'left' } satisfies ColumnMeta },
  { accessorKey: 'gelen',  header: 'Gelen',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.gelen  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'giden',  header: 'Giden',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.giden  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'masraf', header: 'Masraf', meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.masraf }}>{fmt(getValue() as number)}</span> },
  {
    accessorKey: 'net', header: 'Net', meta: rightMeta,
    cell: ({ getValue }) => {
      const v = getValue() as number
      return <span className="font-semibold" style={{ color: v >= 0 ? C.net : C.giden }}>{fmt(v)}</span>
    },
  },
]

const yearlyColumns: ColumnDef<YearlyRow>[] = [
  { accessorKey: 'yil',    header: 'Yıl',    meta: { align: 'left' } satisfies ColumnMeta },
  { accessorKey: 'gelen',  header: 'Gelen',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.gelen  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'giden',  header: 'Giden',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.giden  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'masraf', header: 'Masraf', meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.masraf }}>{fmt(getValue() as number)}</span> },
  {
    accessorKey: 'net', header: 'Net', meta: rightMeta,
    cell: ({ getValue }) => {
      const v = getValue() as number
      return <span className="font-semibold" style={{ color: v >= 0 ? C.net : C.giden }}>{fmt(v)}</span>
    },
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function FinansDashboard() {
  const trpc = useTRPC()
  const [selectedYear, setSelectedYear] = useState<number | undefined>()

  const { data, isLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({ yil: selectedYear })
  )

  const availableYears = data?.yearly?.map(y => parseInt(y.yil)) ?? []

  const monthlyRows = useMemo<MonthlyRow[]>(() =>
    data?.monthly?.map(m => {
      const [year, month] = m.ay.split('-')
      return {
        ay: `${MONTHS_TR_FULL[parseInt(month) - 1]} – ${year}`,
        gelen: m.gelen, giden: m.giden, masraf: m.masraf,
        net: m.gelen - m.giden - m.masraf,
      }
    }) ?? [],
  [data?.monthly])

  const yearlyRows = useMemo<YearlyRow[]>(() =>
    data?.yearly?.map(y => ({
      yil: y.yil, gelen: y.gelen, giden: y.giden, masraf: y.masraf,
      net: y.gelen - y.giden - y.masraf,
    })) ?? [],
  [data?.yearly])

  const mTotals = monthlyRows.reduce((a, r) => ({ gelen: a.gelen+r.gelen, giden: a.giden+r.giden, masraf: a.masraf+r.masraf, net: a.net+r.net }), { gelen:0, giden:0, masraf:0, net:0 })
  const yTotals = yearlyRows .reduce((a, r) => ({ gelen: a.gelen+r.gelen, giden: a.giden+r.giden, masraf: a.masraf+r.masraf, net: a.net+r.net }), { gelen:0, giden:0, masraf:0, net:0 })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (!data) return null

  const { monthly, yearly } = data

  // ── Chart data ────────────────────────────────────────────────────────────────

  const monthlyChartData = monthly?.map(m => {
    const [year, month] = m.ay.split('-')
    const net = m.gelen - m.giden - m.masraf
    return {
      name: `${MONTHS_TR_FULL[parseInt(month)-1].slice(0,3)} ${year}`,
      Gelen: m.gelen, Giden: m.giden, Masraf: m.masraf, Net: net,
    }
  }) ?? []

  let running = 0
  const kasaData = monthlyChartData.map(e => {
    running += e.Net
    return { name: e.name, Kasa: running }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (value: any) =>
    typeof value === 'number' ? fmt(value) : String(value)

  return (
    <div className="space-y-6">
      {/* Year filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Yıl:</span>
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

      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="tables">Tablolar</TabsTrigger>
        </TabsList>

        {/* ── CHARTS ── */}
        <TabsContent value="charts" className="space-y-6">

          {/* 1. Aylık Özet — grouped bars + net line */}
          <Card>
            <CardHeader><CardTitle>Aylık Özet {selectedYear ? `(${selectedYear})` : ''}</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData} margin={{ top:10, right:30, left:10, bottom:30 }}>
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis tickFormatter={fmtK} width={55} />
                    <Tooltip formatter={tooltipFmt} />
                    <Legend />
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

          {/* 2. Aylık Net Bakiye — colored bars */}
          <Card>
            <CardHeader><CardTitle>Aylık Net Bakiye {selectedYear ? `(${selectedYear})` : ''}</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top:10, right:30, left:10, bottom:30 }}>
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis tickFormatter={fmtK} width={55} />
                    <Tooltip formatter={tooltipFmt} />
                    <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                    <Bar dataKey="Net" name="Net Bakiye" shape={<NetBarShape />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Yeşil = Kâr &nbsp;|&nbsp; Kırmızı = Zarar
              </p>
            </CardContent>
          </Card>

          {/* 3. Kasa Bakiyesi — cumulative area */}
          <Card>
            <CardHeader><CardTitle>Kasa Bakiyesi {selectedYear ? `(${selectedYear})` : ''}</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kasaData} margin={{ top:10, right:30, left:10, bottom:30 }}>
                    <defs>
                      <linearGradient id="kasaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.kasa} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.kasa} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis tickFormatter={fmtK} width={55} />
                    <Tooltip formatter={tooltipFmt} />
                    <ReferenceLine y={0} stroke="#888" strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="Kasa" name="Kasa Bakiyesi"
                      stroke={C.kasa} strokeWidth={2.5} fill="url(#kasaGradient)"
                      dot={{ r:4, fill:C.kasa, strokeWidth:0 }} activeDot={{ r:6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Her ay net bakiyenin kümülatif toplamı — kasada biriken tutar
              </p>
            </CardContent>
          </Card>

          {/* 4. Aylık Trend — all lines */}
          <Card>
            <CardHeader><CardTitle>Aylık Trend {selectedYear ? `(${selectedYear})` : ''}</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChartData} margin={{ top:10, right:30, left:10, bottom:30 }}>
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis tickFormatter={fmtK} width={55} />
                    <Tooltip formatter={tooltipFmt} />
                    <Legend />
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

        </TabsContent>

        {/* ── TABLES ── */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Aylık Detay {selectedYear ? `(${selectedYear})` : ''}</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                columns={monthlyColumns}
                data={monthlyRows}
                footerRows={
                  monthlyRows.length > 0 ? (
                    <TableRow className="bg-muted/40">
                      <TableCell className="text-left font-bold">Toplam</TableCell>
                      <TableCell className="text-right font-bold" style={{ color: C.gelen  }}>{fmt(mTotals.gelen)}</TableCell>
                      <TableCell className="text-right font-bold" style={{ color: C.giden  }}>{fmt(mTotals.giden)}</TableCell>
                      <TableCell className="text-right font-bold" style={{ color: C.masraf }}>{fmt(mTotals.masraf)}</TableCell>
                      <TableCell className="text-right font-bold" style={{ color: mTotals.net >= 0 ? C.net : C.giden }}>{fmt(mTotals.net)}</TableCell>
                    </TableRow>
                  ) : undefined
                }
              />
            </CardContent>
          </Card>

          {yearly && yearly.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Yıllık Özet</CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  columns={yearlyColumns}
                  data={yearlyRows}
                  footerRows={
                    yearlyRows.length > 0 ? (
                      <TableRow className="bg-muted/40">
                        <TableCell className="text-left font-bold">Toplam</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: C.gelen  }}>{fmt(yTotals.gelen)}</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: C.giden  }}>{fmt(yTotals.giden)}</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: C.masraf }}>{fmt(yTotals.masraf)}</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: yTotals.net >= 0 ? C.net : C.giden }}>{fmt(yTotals.net)}</TableCell>
                      </TableRow>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
