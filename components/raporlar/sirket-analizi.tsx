'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import dynamic from 'next/dynamic'

const BarChart        = dynamic(() => import('recharts').then(m => m.BarChart),        { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> })
const Bar             = dynamic(() => import('recharts').then(m => m.Bar),             { ssr: false })
const XAxis           = dynamic(() => import('recharts').then(m => m.XAxis),           { ssr: false })
const YAxis           = dynamic(() => import('recharts').then(m => m.YAxis),           { ssr: false })
const Tooltip         = dynamic(() => import('recharts').then(m => m.Tooltip),         { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface SirketAnaliziRow {
  id: number
  ad: string
  dosya_sayisi: number
  aktif: number
  toplam_talep: number
  toplam_karar: number
  tahsilat: number
  tahsilat_orani: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const fmtK = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

const oraniRenk = (oran: number) => {
  if (oran >= 80) return 'bg-green-100 text-green-800'
  if (oran >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export function SirketAnalizi({ data }: { data: SirketAnaliziRow[] }) {
  const top10 = data.slice(0, 10).map(s => ({
    name: s.ad.length > 12 ? s.ad.substring(0, 12) + '…' : s.ad,
    Tahsilat: s.tahsilat,
  }))

  return (
    <div className="space-y-4">
      {top10.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Şirket Bazında Tahsilat (İlk 10)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} margin={{ top: 8, right: 16, left: 0, bottom: 50 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={fmtK} width={52} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Bar dataKey="Tahsilat" fill="#22c55e" name="Tahsilat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Şirket Analizi ({data.length} şirket)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Karşı taraf sigorta şirketi olan dosya bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şirket</TableHead>
                    <TableHead className="text-center">Dosya</TableHead>
                    <TableHead className="text-center">Aktif</TableHead>
                    <TableHead className="text-right">Toplam Talep</TableHead>
                    <TableHead className="text-right">Toplam Karar</TableHead>
                    <TableHead className="text-right">Tahsilat</TableHead>
                    <TableHead className="text-center">Tahsilat Oranı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.ad}</TableCell>
                      <TableCell className="text-center">{row.dosya_sayisi}</TableCell>
                      <TableCell className="text-center">{row.aktif}</TableCell>
                      <TableCell className="text-right">{fmt(row.toplam_talep)}</TableCell>
                      <TableCell className="text-right">
                        {row.toplam_karar > 0 ? fmt(row.toplam_karar) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.tahsilat > 0 ? fmt(row.tahsilat) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${oraniRenk(row.tahsilat_orani)}`}>
                          %{row.tahsilat_orani}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
