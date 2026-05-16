'use client'

import { Card, CardContent } from '@/components/ui/card'

interface YonetimOzetiData {
  toplamDosya: number
  aktif: number
  arsiv: number
  toplamTahsilat: number
  toplamGider: number
  toplamMasraf: number
  net: number
  kazanilan: number
  uzlasma: number
  kaybedilen: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

interface KpiCardProps {
  label: string
  value: string | number
  bg: string
  textColor?: string
}

function KpiCard({ label, value, bg, textColor = 'text-foreground' }: KpiCardProps) {
  return (
    <Card className={`${bg} border-0`}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function YonetimOzeti({ data }: { data: YonetimOzetiData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Toplam Dosya" value={data.toplamDosya} bg="bg-blue-50" />
        <KpiCard label="Aktif Dosya" value={data.aktif} bg="bg-green-50" textColor="text-green-700" />
        <KpiCard label="Toplam Tahsilat" value={fmt(data.toplamTahsilat)} bg="bg-emerald-50" textColor="text-emerald-700" />
        <KpiCard
          label="Net Bakiye"
          value={fmt(data.net)}
          bg={data.net >= 0 ? 'bg-green-50' : 'bg-red-50'}
          textColor={data.net >= 0 ? 'text-green-700' : 'text-red-700'}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Kazanılan" value={data.kazanilan} bg="bg-green-50" textColor="text-green-700" />
        <KpiCard label="Uzlaşma" value={data.uzlasma} bg="bg-blue-50" textColor="text-blue-700" />
        <KpiCard label="Kaybedilen" value={data.kaybedilen} bg="bg-red-50" textColor="text-red-700" />
        <KpiCard label="Toplam Gider" value={fmt(data.toplamGider + data.toplamMasraf)} bg="bg-orange-50" textColor="text-orange-700" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Arşivlenen Dosya" value={data.arsiv} bg="bg-gray-50" textColor="text-gray-600" />
        <KpiCard label="Toplam Gider (operasyonel)" value={fmt(data.toplamGider)} bg="bg-red-50" textColor="text-red-600" />
        <KpiCard label="Toplam Masraf" value={fmt(data.toplamMasraf)} bg="bg-orange-50" textColor="text-orange-600" />
      </div>
    </div>
  )
}
