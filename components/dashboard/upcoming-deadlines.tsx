import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getDaysUntil, isInAdliTatil } from '@/lib/deadline-service'

type Deadline = {
  id: number
  ad: string
  son_tarih: string
  tur: string
  dosya_id: number
  dosya_no: string
  muvekkil_ad: string
}

type UpcomingDeadlinesProps = {
  deadlines: Deadline[]
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}.${y}`
}

/**
 * Urgency badge sınıfları — globals.css token'larını kullanır.
 * Hardcoded yellow-* yerine amber Tailwind sınıfı kullanıldı;
 * kırmızı için destructive token'ı korundu.
 */
function urgencyClasses(days: number): { badge: string; dot: string } {
  if (days < 0)  return { badge: 'bg-destructive/10 text-destructive border-0', dot: 'bg-destructive' }
  if (days === 0) return { badge: 'bg-destructive/10 text-destructive border-0', dot: 'bg-destructive' }
  if (days < 3)  return { badge: 'bg-destructive/10 text-destructive border-0', dot: 'bg-destructive' }
  if (days < 7)  return { badge: 'bg-amber-100 text-amber-700 border-0', dot: 'bg-amber-400' }
  return { badge: 'bg-muted text-muted-foreground border-0', dot: 'bg-muted-foreground/40' }
}

function urgencyLabel(days: number): string {
  if (days < 0)  return 'Geçti'
  if (days === 0) return 'Bugün'
  return `${days} gün`
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const urgentCount = deadlines.filter(d => getDaysUntil(d.son_tarih) < 3).length

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Yaklaşan Süreler</CardTitle>
          {urgentCount > 0 && (
            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-0 rounded-full text-xs font-semibold">
              {urgentCount} acil
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {deadlines.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">Yaklaşan süre yok</p>
            <p className="text-sm text-muted-foreground">
              Önümüzdeki 14 gün içinde süre bulunmuyor.
            </p>
          </div>
        ) : (
          <TooltipProvider>
            {deadlines.map((deadline) => {
              const days = getDaysUntil(deadline.son_tarih)
              const inAdliTatil = isInAdliTatil(deadline.son_tarih)
              const { badge, dot } = urgencyClasses(days)

              return (
                <Link
                  key={deadline.id}
                  href={`/dosyalar/${deadline.dosya_id}`}
                  className="flex items-center gap-4 px-6 py-3.5 border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  {/* Urgency dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deadline.ad}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {deadline.muvekkil_ad} — #{deadline.dosya_no}
                    </p>
                  </div>

                  {/* Sağ: gün badge + adli tatil uyarısı */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inAdliTatil && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                            Adli Tatil
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatDate(deadline.son_tarih)} — adli tatil dönemine denk geliyor, manuel kontrol yapın.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`${badge} text-xs font-semibold`}>
                          {urgencyLabel(days)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{formatDate(deadline.son_tarih)}</TooltipContent>
                    </Tooltip>
                  </div>
                </Link>
              )
            })}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
