import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Yaklaşan Süreler</CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Yaklaşan süre yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Önümüzdeki 14 gün içinde süre bulunmuyor.
            </p>
          </div>
        ) : (
          <TooltipProvider>
            {deadlines.map((deadline) => {
              const days = getDaysUntil(deadline.son_tarih)
              const inAdliTatil = isInAdliTatil(deadline.son_tarih)

              let urgencyClass = 'bg-muted text-muted-foreground'
              let daysLabel = `${days} gün`

              if (days < 0) {
                urgencyClass = 'bg-destructive text-destructive-foreground'
                daysLabel = 'Geçti'
              } else if (days < 3) {
                urgencyClass = 'bg-destructive text-destructive-foreground'
                daysLabel = days === 0 ? 'Bugün' : `${days} gün`
              } else if (days < 7) {
                urgencyClass = 'bg-yellow-400 text-yellow-900'
                daysLabel = `${days} gün`
              }

              return (
                <div
                  key={deadline.id}
                  className="flex items-center gap-3 py-3 border-b last:border-0 min-h-[44px]"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={urgencyClass}>{daysLabel}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatDate(deadline.son_tarih)}
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{deadline.ad}</p>
                    <p className="text-sm text-muted-foreground">
                      <a
                        href={`/dosyalar/${deadline.dosya_id}`}
                        className="text-accent hover:underline"
                      >
                        {deadline.muvekkil_ad} — #{deadline.dosya_no}
                      </a>
                    </p>
                  </div>
                  {inAdliTatil && (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                      ⚠ Adli Tatil — manuel kontrol
                    </Badge>
                  )}
                </div>
              )
            })}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
