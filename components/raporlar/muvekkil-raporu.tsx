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

interface MuvekkilRaporuRow {
  id: number
  ad: string
  telefon: string | null
  dosya_sayisi: number
  aktif_dosya: number
  tahsilat: number
  gider: number
  masraf: number
  net: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const fmtK = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

export function MuvekkilRaporu({ data }: { data: MuvekkilRaporuRow[] }) {
  const top10 = data.slice(0, 10).map(m => ({
    name: m.ad.split(' ')[0], // first name only for chart label
    Tahsilat: m.tahsilat,
  }))

  return (
    <div className="space-y-4">
      {top10.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Müvekkil Tahsilatı (İlk 10)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
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
          <CardTitle className="text-sm">Müvekkil Bazında Özet ({data.length} müvekkil)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müvekkil</TableHead>
                  <TableHead className="text-center">Dosya</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-right">Tahsilat</TableHead>
                  <TableHead className="text-right">Gider</TableHead>
                  <TableHead className="text-right">Masraf</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.ad}</TableCell>
                    <TableCell className="text-center">{row.dosya_sayisi}</TableCell>
                    <TableCell className="text-center">{row.aktif_dosya}</TableCell>
                    <TableCell className="text-right text-green-700">{row.tahsilat > 0 ? fmt(row.tahsilat) : '-'}</TableCell>
                    <TableCell className="text-right text-red-600">{row.gider > 0 ? fmt(row.gider) : '-'}</TableCell>
                    <TableCell className="text-right text-orange-600">{row.masraf > 0 ? fmt(row.masraf) : '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${row.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {fmt(row.net)}
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
