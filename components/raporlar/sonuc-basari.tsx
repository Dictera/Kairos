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

interface SonucBasariData {
  kazanildi: number
  uzlasma: number
  kaybedildi: number
  devam: number
  basariOrani: number
  pieData: Array<{ name: string; value: number; fill: string }>
}

export function SonucBasari({ data }: { data: SonucBasariData }) {
  return (
    <div className="space-y-4">
      {/* Başarı oranı kartı */}
      <div className="flex justify-center">
        <div className="bg-green-50 rounded-2xl p-8 text-center w-64">
          <p className="text-sm text-muted-foreground mb-2">Başarı Oranı</p>
          <p className="text-6xl font-bold text-green-700">%{data.basariOrani}</p>
          <p className="text-xs text-muted-foreground mt-2">
            (Kazanılan + Uzlaşma) / Tüm Kapanan Dosyalar
          </p>
        </div>
      </div>

      {/* Pie chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sonuç Dağılımı</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

      {/* Sayım kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Kazanıldı', value: data.kazanildi, bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Uzlaşma', value: data.uzlasma, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Kaybedildi', value: data.kaybedildi, bg: 'bg-red-50', text: 'text-red-700' },
          { label: 'Devam Ediyor', value: data.devam, bg: 'bg-gray-50', text: 'text-gray-600' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg p-4 ${item.bg}`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-3xl font-bold ${item.text}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
