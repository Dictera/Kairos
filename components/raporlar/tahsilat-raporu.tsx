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
const Legend          = dynamic(() => import('recharts').then(m => m.Legend),          { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface TahsilatRow {
  dosya_no: string
  tur: string
  muvekkil: string
  karsitaraf_sigorta: string
  talep_tutari: number
  karar_tutari: number
  tahsilat: number
  fark: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const fmtK = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

export function TahsilatRaporu({ data }: { data: TahsilatRow[] }) {
  const toplamTalep    = data.reduce((s, d) => s + d.talep_tutari,  0)
  const toplamKarar    = data.reduce((s, d) => s + d.karar_tutari,  0)
  const toplamTahsilat = data.reduce((s, d) => s + d.tahsilat,      0)
  const toplamFark     = data.reduce((s, d) => s + d.fark,          0)

  // Top 10 dosya by talep_tutari for chart
  const top10 = [...data]
    .sort((a, b) => b.talep_tutari - a.talep_tutari)
    .slice(0, 10)
    .map(d => ({
      name: d.dosya_no,
      Talep: d.talep_tutari,
      Karar: d.karar_tutari,
      Tahsilat: d.tahsilat,
    }))

  return (
    <div className="space-y-4">
      {top10.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Talep / Karar / Tahsilat Karşılaştırması (İlk 10)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis tickFormatter={fmtK} width={52} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => typeof v === 'number' ? fmt(v) : String(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Talep"    fill="#94a3b8" name="Talep"    />
                  <Bar dataKey="Karar"    fill="#3b82f6" name="Karar"    />
                  <Bar dataKey="Tahsilat" fill="#22c55e" name="Tahsilat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tahsilat Detayı ({data.length} dosya)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya No</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Müvekkil</TableHead>
                  <TableHead>Karşı Taraf Sigorta</TableHead>
                  <TableHead className="text-right">Talep</TableHead>
                  <TableHead className="text-right">Karar</TableHead>
                  <TableHead className="text-right">Tahsilat</TableHead>
                  <TableHead className="text-right">Fark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{row.dosya_no}</TableCell>
                    <TableCell>{row.tur}</TableCell>
                    <TableCell>{row.muvekkil}</TableCell>
                    <TableCell>{row.karsitaraf_sigorta || '-'}</TableCell>
                    <TableCell className="text-right">{fmt(row.talep_tutari)}</TableCell>
                    <TableCell className="text-right">{row.karar_tutari > 0 ? fmt(row.karar_tutari) : '-'}</TableCell>
                    <TableCell className="text-right">{row.tahsilat > 0 ? fmt(row.tahsilat) : '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${row.fark > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {row.karar_tutari > 0 ? fmt(row.fark) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={4}>Toplam</TableCell>
                  <TableCell className="text-right">{fmt(toplamTalep)}</TableCell>
                  <TableCell className="text-right">{fmt(toplamKarar)}</TableCell>
                  <TableCell className="text-right">{fmt(toplamTahsilat)}</TableCell>
                  <TableCell className={`text-right ${toplamFark > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(toplamFark)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
