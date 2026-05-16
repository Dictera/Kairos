'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface DosyaRaporuRow {
  id: number
  dosya_no: string
  tur: string
  durum: string
  muvekkil: string
  karsitaraf_sigorta: string
  talep_tutari: number
  karar_tutari: number
  sonuc: string
  tahsilat: number
  gider: number
  masraf: number
  net: number
  created_at: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

const sonucBadge = (sonuc: string) => {
  if (sonuc === 'kazanıldı') return 'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium'
  if (sonuc === 'uzlaşma')   return 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium'
  if (sonuc === 'kaybedildi') return 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium'
  return 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium'
}

const durumBadge = (durum: string) => {
  if (durum === 'aktif') return 'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium'
  return 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium'
}

const sonucLabel = (sonuc: string) => {
  if (sonuc === 'kazanıldı')  return 'Kazanıldı'
  if (sonuc === 'uzlaşma')    return 'Uzlaşma'
  if (sonuc === 'kaybedildi') return 'Kaybedildi'
  return 'Devam'
}

export function DosyaRaporu({ data }: { data: DosyaRaporuRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tüm Dosyalar ({data.length} kayıt)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dosya No</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Müvekkil</TableHead>
                <TableHead>Karşı Sigorta</TableHead>
                <TableHead className="text-right">Talep</TableHead>
                <TableHead className="text-right">Karar</TableHead>
                <TableHead>Sonuç</TableHead>
                <TableHead className="text-right">Tahsilat</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.dosya_no}</TableCell>
                  <TableCell>{row.tur}</TableCell>
                  <TableCell>
                    <span className={durumBadge(row.durum)}>
                      {row.durum === 'aktif' ? 'Aktif' : 'Arşiv'}
                    </span>
                  </TableCell>
                  <TableCell>{row.muvekkil}</TableCell>
                  <TableCell>{row.karsitaraf_sigorta || '-'}</TableCell>
                  <TableCell className="text-right">{fmt(row.talep_tutari)}</TableCell>
                  <TableCell className="text-right">
                    {row.karar_tutari > 0 ? fmt(row.karar_tutari) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={sonucBadge(row.sonuc)}>{sonucLabel(row.sonuc)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.tahsilat > 0 ? fmt(row.tahsilat) : '-'}
                  </TableCell>
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
  )
}
