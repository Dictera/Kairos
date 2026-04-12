'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type DosyaDetail = {
  id: number
  dosya_no: string
  tur: 'STK' | 'AT' | 'AH'
  durum: 'aktif' | 'arsiv'
  talep_tutari: number | null
  muvekkil_plaka: string | null
  aciklama: string | null
  created_at: string
  muvekkil: { id: number; ad: string; soyad: string }
  sigortaTuru: { id: number; ad: string } | null
  karsitarafSigorta: { id: number; ad: string } | null
  taraflar: Array<{
    id: number
    police_no: string | null
    karsitaraf_plaka: string | null
  }>
}

interface GenelBilgilerTabProps {
  dosya: DosyaDetail
}

const turLabel: Record<string, string> = {
  STK: 'STK',
  AT: 'Asliye Ticaret',
  AH: 'Asliye Hukuk',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  )
}

export function GenelBilgilerTab({ dosya }: GenelBilgilerTabProps) {
  const primaryTaraf = dosya.taraflar[0]

  const formatTutar = (amount: number | null) => {
    if (amount == null) return '—'
    return '₺' + amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Genel Bilgiler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Row label="Dosya No" value={dosya.dosya_no} />
          <Row
            label="Müvekkil"
            value={
              <Link
                href={`/muvekkiller/${dosya.muvekkil.id}`}
                className="text-primary underline underline-offset-2"
              >
                {dosya.muvekkil.ad} {dosya.muvekkil.soyad}
              </Link>
            }
          />
          <Row label="Dosya Türü" value={turLabel[dosya.tur] ?? dosya.tur} />
          <Row
            label="Durum"
            value={
              <Badge
                className={
                  dosya.durum === 'aktif'
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }
              >
                {dosya.durum === 'aktif' ? 'Aktif' : 'Arşivlenmiş'}
              </Badge>
            }
          />
          <Row label="Sigorta Türü" value={dosya.sigortaTuru?.ad ?? '—'} />
          <Row label="Karşı Sigorta Şirketi" value={dosya.karsitarafSigorta?.ad ?? '—'} />
          <Row label="Poliçe No" value={primaryTaraf?.police_no ?? '—'} />
          <Row label="Talep Tutarı" value={formatTutar(dosya.talep_tutari)} />
          <Row label="Müvekkil Plaka No" value={dosya.muvekkil_plaka ?? '—'} />
          <Row label="Oluşturma Tarihi" value={formatDate(dosya.created_at)} />
          {dosya.aciklama && (
            <div className="col-span-full space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">Açıklama</p>
              <p className="text-sm whitespace-pre-wrap">{dosya.aciklama}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
