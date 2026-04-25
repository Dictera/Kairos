'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface ZamanasimDosya {
  dosya_no: string
  tur: string
  muvekkil: string
  kaza_tarihi: string | null
  yil: number
  son_tarih: string
  kalan_gun: number
  risk: 'kritik' | 'uyari' | 'normal'
  durum: string
}

interface ZamanasimRiskiData {
  tumDosyalar: ZamanasimDosya[]
  kritik: number
  uyari: number
  normal: number
}

const riskBadge = (risk: 'kritik' | 'uyari' | 'normal') => {
  if (risk === 'kritik') return 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium'
  if (risk === 'uyari')  return 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium'
  return 'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium'
}

const riskLabel = (risk: 'kritik' | 'uyari' | 'normal') => {
  if (risk === 'kritik') return 'Kritik'
  if (risk === 'uyari')  return 'Uyarı'
  return 'Normal'
}

export function ZamanasimRiski({ data }: { data: ZamanasimRiskiData }) {
  const aktifDosyalar = data.tumDosyalar.filter(d => d.durum === 'aktif')

  return (
    <div className="space-y-4">
      {/* Risk özet kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Kritik (Geçmiş)</p>
          <p className="text-3xl font-bold text-red-700">{data.kritik}</p>
          <p className="text-xs text-muted-foreground mt-1">Zamanaşımı süresi dolmuş</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Uyarı (&lt;180 gün)</p>
          <p className="text-3xl font-bold text-yellow-700">{data.uyari}</p>
          <p className="text-xs text-muted-foreground mt-1">Acil takip gerektirir</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Normal</p>
          <p className="text-3xl font-bold text-green-700">{data.normal}</p>
          <p className="text-xs text-muted-foreground mt-1">Süre yeterli</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Aktif Dosyalar Zamanaşımı ({aktifDosyalar.length} dosya)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {aktifDosyalar.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Kaza tarihi olan aktif dosya bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dosya No</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Müvekkil</TableHead>
                    <TableHead>Kaza Tarihi</TableHead>
                    <TableHead className="text-center">Süre (yıl)</TableHead>
                    <TableHead>Son Tarih</TableHead>
                    <TableHead className="text-right">Kalan Gün</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aktifDosyalar.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{row.dosya_no}</TableCell>
                      <TableCell>{row.tur}</TableCell>
                      <TableCell>{row.muvekkil}</TableCell>
                      <TableCell>{row.kaza_tarihi || '-'}</TableCell>
                      <TableCell className="text-center">{row.yil}</TableCell>
                      <TableCell>{row.son_tarih}</TableCell>
                      <TableCell className={`text-right font-medium ${row.kalan_gun < 0 ? 'text-red-700 font-bold' : ''}`}>
                        {row.kalan_gun < 0 ? 'GEÇMİŞ' : row.kalan_gun}
                      </TableCell>
                      <TableCell>
                        <span className={riskBadge(row.risk)}>{riskLabel(row.risk)}</span>
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
