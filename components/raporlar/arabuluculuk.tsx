'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

const PieChart  = dynamic(() => import('recharts').then(m => m.PieChart),  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> })
const Pie       = dynamic(() => import('recharts').then(m => m.Pie),       { ssr: false })
const Cell      = dynamic(() => import('recharts').then(m => m.Cell),      { ssr: false })
const Tooltip   = dynamic(() => import('recharts').then(m => m.Tooltip),   { ssr: false })
const Legend    = dynamic(() => import('recharts').then(m => m.Legend),    { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface ArabuluculukData {
  toplamStk: number
  arabuluculukta: number
  davayaGiden: number
  diger: number
  pieData: Array<{ name: string; value: number; fill: string }>
}

export function Arabuluculuk({ data }: { data: ArabuluculukData }) {
  const cozumOrani = data.toplamStk > 0
    ? Math.round((data.arabuluculukta / data.toplamStk) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Sayım kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Arabuluculukta</p>
          <p className="text-3xl font-bold text-blue-700">{data.arabuluculukta}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Davaya Giden</p>
          <p className="text-3xl font-bold text-red-700">{data.davayaGiden}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Diğer / İhtar</p>
          <p className="text-3xl font-bold text-gray-600">{data.diger}</p>
        </div>
      </div>

      {/* Pie chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">STK Dosyaları Dağılımı ({data.toplamStk} dosya)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.toplamStk === 0 ? (
            <div className="py-12 text-center text-muted-foreground">STK dosyası bulunamadı.</div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData.filter(d => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.pieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yorum kartı */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">
          Arabuluculuk Çözüm Oranı: %{cozumOrani}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Toplam {data.toplamStk} STK dosyasının {data.arabuluculukta} adedi arabuluculuk aşamasındadır.
        </p>
      </div>
    </div>
  )
}
