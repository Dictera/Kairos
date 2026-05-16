'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronRight, FileIcon, Download } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TUR_LABELS: Record<string, string> = {
  STK: 'STK',
  AT: 'Asliye Ticaret',
  AH: 'Asliye Hukuk',
}
const TUR_ORDER = ['STK', 'AT', 'AH']

type BelgeRow = {
  id: number
  dosya_id: number
  dosya_adi: string
  dosya_yolu: string
  dosya_boyutu: number
  kategori: string
  created_at: string
  sablon_id: number | null
  tur: string
  dosya_no: string
  muvekkil_plaka: string | null
  muvekkil_ad: string
  muvekkil_soyad: string
  sigorta_turu_ad: string | null
}

type DosyaGroup = {
  dosya_id: number
  dosya_no: string
  muvekkilLabel: string
  belgeler: BelgeRow[]
}

type SigortaGroup = {
  ad: string
  dosyalar: DosyaGroup[]
}

type TurGroup = {
  tur: string
  turLabel: string
  sigortaTurleri: SigortaGroup[]
}

function muvekkilLabel(ad: string, soyad: string, plaka: string | null): string {
  const name = `${ad} ${soyad}`.trim()
  return plaka ? `${name} - ${plaka}` : name
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function BelgeRow({ belge }: { belge: BelgeRow }) {
  const fileUrl = belge.dosya_yolu.startsWith('/') ? belge.dosya_yolu : `/${belge.dosya_yolu}`
  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-md hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <Link
            href={`/dosyalar/${belge.dosya_id}`}
            className="text-sm font-medium hover:underline truncate block"
          >
            {belge.dosya_adi}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs py-0">
              {belge.kategori}
            </Badge>
            <span>{format(new Date(belge.created_at), 'dd MMM yyyy', { locale: tr })}</span>
            <span>{formatBytes(belge.dosya_boyutu)}</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="flex-shrink-0" asChild>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}

function DosyaSection({ dosya }: { dosya: DosyaGroup }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors group">
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="font-medium truncate">{dosya.muvekkilLabel}</span>
        <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
          {dosya.belgeler.length} belge
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 mt-1 space-y-0.5 border-l pl-2">
          {dosya.belgeler.map(b => (
            <BelgeRow key={b.id} belge={b} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SigortaSection({ sigorta }: { sigorta: SigortaGroup }) {
  const totalBelge = sigorta.dosyalar.reduce((sum, d) => sum + d.belgeler.length, 0)
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group">
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="font-semibold">{sigorta.ad}</span>
        <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
          {sigorta.dosyalar.length} dosya • {totalBelge} belge
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-1 space-y-0.5">
          {sigorta.dosyalar.map(d => (
            <DosyaSection key={d.dosya_id} dosya={d} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TurSection({ turGroup }: { turGroup: TurGroup }) {
  const totalBelge = turGroup.sigortaTurleri.reduce(
    (sum, s) => sum + s.dosyalar.reduce((s2, d) => s2 + d.belgeler.length, 0),
    0
  )
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className={cn(
        'flex w-full items-center gap-2 rounded-lg px-4 py-3 font-semibold',
        'bg-muted/50 hover:bg-muted transition-colors group'
      )}>
        <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform group-data-[state=open]:rotate-90" />
        <span>{turGroup.turLabel}</span>
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {turGroup.sigortaTurleri.length} sigorta türü • {totalBelge} belge
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 ml-2 space-y-0.5">
          {turGroup.sigortaTurleri.map(s => (
            <SigortaSection key={s.ad} sigorta={s} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function BelgelerPage() {
  const trpc = useTRPC()
  const { data: rows = [], isLoading } = useQuery(trpc.belge.treeList.queryOptions())

  const tree: TurGroup[] = useMemo(() => {
    const turMap = new Map<string, Map<string, Map<number, DosyaGroup>>>()

    for (const row of rows as BelgeRow[]) {
      const tur = row.tur
      const sigortaAd = row.sigorta_turu_ad ?? 'Belirtilmemiş'

      if (!turMap.has(tur)) turMap.set(tur, new Map())
      const sigortaMap = turMap.get(tur)!

      if (!sigortaMap.has(sigortaAd)) sigortaMap.set(sigortaAd, new Map())
      const dosyaMap = sigortaMap.get(sigortaAd)!

      if (!dosyaMap.has(row.dosya_id)) {
        dosyaMap.set(row.dosya_id, {
          dosya_id: row.dosya_id,
          dosya_no: row.dosya_no,
          muvekkilLabel: muvekkilLabel(row.muvekkil_ad, row.muvekkil_soyad, row.muvekkil_plaka),
          belgeler: [],
        })
      }
      dosyaMap.get(row.dosya_id)!.belgeler.push(row)
    }

    return TUR_ORDER
      .filter(tur => turMap.has(tur))
      .map(tur => ({
        tur,
        turLabel: TUR_LABELS[tur] ?? tur,
        sigortaTurleri: Array.from(turMap.get(tur)!.entries()).map(([ad, dosyaMap]) => ({
          ad,
          dosyalar: Array.from(dosyaMap.values()),
        })),
      }))
  }, [rows])

  if (isLoading) {
    return (
      <div className="container py-8 space-y-3">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold mb-6">Belgeler</h1>
      {tree.length === 0 ? (
        <p className="text-muted-foreground">Henüz belge yüklenmedi.</p>
      ) : (
        <div className="space-y-2">
          {tree.map(g => <TurSection key={g.tur} turGroup={g} />)}
        </div>
      )}
    </div>
  )
}
