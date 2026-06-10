'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Printer, Download, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { YonetimOzeti }   from './yonetim-ozeti'
import { GenelBakis }     from './genel-bakis'
import { Tahsilat }       from './tahsilat'
import { SonucBasari }    from './sonuc-basari'
import { Arabuluculuk }   from './arabuluculuk'
import { Zamanasimi }     from './zamanasimi'
import { DosyaRaporu }    from './dosya-raporu'
import { MuvekkilRaporu } from './muvekkil-raporu'
import { DavaSureci }     from './dava-sureci'
import { SirketAnalizi }  from './sirket-analizi'
import { Pill } from './raporlar-shared'
import { REPORTS, REPORT_ICONS } from './reports-config'
import type { YilFilter } from './raporlar-data'

function ReportBody({ slug, yil }: { slug: string; yil: YilFilter }) {
  switch (slug) {
    case 'yonetim-ozeti':  return <YonetimOzeti />
    case 'genel-bakis':    return <GenelBakis yil={yil} />
    case 'tahsilat':       return <Tahsilat />
    case 'sonuc-basari':   return <SonucBasari />
    case 'arabuluculuk':   return <Arabuluculuk />
    case 'zamanasimi':     return <Zamanasimi />
    case 'dosya-raporu':   return <DosyaRaporu />
    case 'muvekkil-raporu':return <MuvekkilRaporu />
    case 'dava-sureci':    return <DavaSureci />
    case 'sirket-analizi': return <SirketAnalizi />
    default:               return null
  }
}

export function RaporDetay({ slug }: { slug: string }) {
  const router   = useRouter()
  const [yil, setYil] = useState<YilFilter>('2026')

  const currentIndex = REPORTS.findIndex(r => r.id === slug)
  const rpt          = REPORTS[currentIndex] ?? null
  const prevRpt      = currentIndex > 0 ? REPORTS[currentIndex - 1] : null
  const nextRpt      = currentIndex >= 0 && currentIndex < REPORTS.length - 1 ? REPORTS[currentIndex + 1] : null

  if (!rpt) {
    router.replace('/raporlar')
    return null
  }

  const Icon: LucideIcon = REPORT_ICONS[rpt.iconKey]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/raporlar"
            className="flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Raporlar
          </Link>
          <span className="text-border">›</span>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: rpt.tagColor }} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{rpt.tag}</p>
              <h1 className="text-xl font-semibold tracking-tight leading-tight">{rpt.label}</h1>
            </div>
            <Pill label={rpt.tag} color={rpt.tagColor} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prev / Next */}
          {prevRpt ? (
            <Link href={`/raporlar/${prevRpt.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ChevronLeft className="h-3.5 w-3.5" />
                {prevRpt.label}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              <ChevronLeft className="h-3.5 w-3.5" /> Önceki
            </Button>
          )}
          {nextRpt ? (
            <Link href={`/raporlar/${nextRpt.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                {nextRpt.label}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              Sonraki <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {rpt.hasYilFilter && (
            <Select value={yil} onValueChange={(v) => setYil(v as YilFilter)}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Yazdır
          </Button>
          <Button size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div key={slug + (rpt.hasYilFilter ? `:${yil}` : '')}>
        <ReportBody slug={slug} yil={yil} />
      </div>
    </div>
  )
}
