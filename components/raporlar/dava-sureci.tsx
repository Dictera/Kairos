'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import dynamic from 'next/dynamic'

const BarChart        = dynamic(() => import('recharts').then(m => m.BarChart),        { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> })
const Bar             = dynamic(() => import('recharts').then(m => m.Bar),             { ssr: false })
const XAxis           = dynamic(() => import('recharts').then(m => m.XAxis),           { ssr: false })
const YAxis           = dynamic(() => import('recharts').then(m => m.YAxis),           { ssr: false })
const Tooltip         = dynamic(() => import('recharts').then(m => m.Tooltip),         { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface DavaSureciRow {
  id: number
  dosya_no: string
  tur: string
  durum: string
  asama: string
  olusturma_tarihi: string
  gecen_gun: number
}

const gunRenk = (gun: number) => {
  if (gun > 730) return 'text-red-700 font-semibold'
  if (gun > 365) return 'text-yellow-700 font-semibold'
  return 'text-green-700'
}

export function DavaSureci({ data }: { data: DavaSureciRow[] }) {
  // Histogram grupları
  const gruplari = [
    { label: '0-180 gün', count: data.filter(d => d.gecen_gun <= 180).length },
    { label: '181-365 gün', count: data.filter(d => d.gecen_gun > 180 && d.gecen_gun <= 365).length },
    { label: '366-730 gün', count: data.filter(d => d.gecen_gun > 365 && d.gecen_gun <= 730).length },
    { label: '730+ gün', count: data.filter(d => d.gecen_gun > 730).length },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Geçen Gün Dağılımı</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gruplari} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Dosya Sayısı" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dava Süreci Detayı ({data.length} dosya)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya No</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Mevcut Aşama</TableHead>
                  <TableHead>Açılış Tarihi</TableHead>
                  <TableHead className="text-right">Geçen Gün</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.dosya_no}</TableCell>
                    <TableCell>{row.tur}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.durum === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {row.durum === 'aktif' ? 'Aktif' : 'Arşiv'}
                      </span>
                    </TableCell>
                    <TableCell>{row.asama}</TableCell>
                    <TableCell>{row.olusturma_tarihi}</TableCell>
                    <TableCell className={`text-right ${gunRenk(row.gecen_gun)}`}>
                      {row.gecen_gun}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
