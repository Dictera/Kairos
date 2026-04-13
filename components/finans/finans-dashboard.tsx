'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic import for recharts to avoid SSR issues
import dynamic from 'next/dynamic'
const BarChart = dynamic(
  () => import('recharts').then(m => m.BarChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
)
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })

// Turkish month names for chart labels
const turkishMonthsFull = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

export function FinansDashboard() {
  const trpc = useTRPC()
  const [selectedYear, setSelectedYear] = useState<number | undefined>()
  
  const { data, isLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({ yil: selectedYear })
  )
  
  // Get available years from yearly data
  const availableYears = data?.yearly?.map(y => parseInt(y.yil)) ?? []
  
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
  
  // Prepare chart data for monthly view
  const monthlyChartData = monthly?.map(m => {
    const [year, month] = m.ay.split('-')
    return {
      name: turkishMonthsFull[parseInt(month) - 1],
      Gelen: m.gelen,
      Giden: m.giden,
      Masraf: m.masraf,
    }
  }) ?? []
  
  return (
    <div className="space-y-6">
      {/* Year filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Yıl:</span>
        <Tabs value={selectedYear?.toString() ?? 'all'} onValueChange={(v) => setSelectedYear(v === 'all' ? undefined : parseInt(v))}>
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            {availableYears.map(yil => (
              <TabsTrigger key={yil} value={yil.toString()}>{yil}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Charts and Tables Tabs */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="tables">Tablolar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-6">
          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Özet {selectedYear ? `(${selectedYear})` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full min-h-[300px]">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }} width={600} height={280}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip 
                    formatter={(value) => typeof value === 'number' ? value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : String(value)}
                    contentStyle={{ textAlign: 'left' }}
                  />
                  <Legend />
                  <Bar dataKey="Gelen" fill="#22c55e" name="Gelen" />
                  <Bar dataKey="Giden" fill="#ef4444" name="Giden" />
                  <Bar dataKey="Masraf" fill="#f97316" name="Masraf" />
                </BarChart>
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Trend {selectedYear ? `(${selectedYear})` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full min-h-[300px]">
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }} width={600} height={280}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip 
                    formatter={(value) => typeof value === 'number' ? value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : String(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Gelen" stroke="#22c55e" name="Gelen" strokeWidth={2} />
                  <Line type="monotone" dataKey="Giden" stroke="#ef4444" name="Giden" strokeWidth={2} />
                  <Line type="monotone" dataKey="Masraf" stroke="#f97316" name="Masraf" strokeWidth={2} />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tables" className="space-y-6">
          {/* Monthly Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Detay {selectedYear ? `(${selectedYear})` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Ay</TableHead>
                    <TableHead className="text-right">Gelen</TableHead>
                    <TableHead className="text-right">Giden</TableHead>
                    <TableHead className="text-right">Masraf</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthly?.map((m) => {
                    const [year, month] = m.ay.split('-')
                    const net = m.gelen - m.giden - m.masraf
                    return (
                      <TableRow key={m.ay}>
                        <TableCell className="text-right font-medium">{turkishMonthsFull[parseInt(month) - 1]} {year}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {m.gelen.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {m.giden.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {m.masraf.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${net >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {net.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {!monthly?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Veri yok
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Yearly Table */}
          <Card>
            <CardHeader>
              <CardTitle>Yıllık Özet</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Yıl</TableHead>
                    <TableHead className="text-right">Gelen</TableHead>
                    <TableHead className="text-right">Giden</TableHead>
                    <TableHead className="text-right">Masraf</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearly?.map((y) => {
                    const net = y.gelen - y.giden - y.masraf
                    return (
                      <TableRow key={y.yil}>
                        <TableCell className="text-right font-medium">{y.yil}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {y.gelen.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {y.giden.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {y.masraf.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${net >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {net.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {!yearly?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Veri yok
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
