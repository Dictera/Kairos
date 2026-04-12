import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Hearing = {
  id: number
  tarih: string
  saat: string | null
  mahkeme_kurum: string | null
  dosya_id: number
  dosya_no: string
}

type TodaysHearingsProps = {
  hearings: Hearing[]
}

export function TodaysHearings({ hearings }: TodaysHearingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Bugünkü Duruşmalar</CardTitle>
      </CardHeader>
      <CardContent>
        {hearings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Bugün duruşma yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Bugün için kayıtlı duruşma bulunmuyor.
            </p>
          </div>
        ) : (
          hearings.map((hearing) => {
            const mahkume = hearing.mahkeme_kurum ?? ''
            const mahkumeTruncated =
              mahkume.length > 20 ? mahkume.slice(0, 20) + '…' : mahkume

            return (
              <div
                key={hearing.id}
                className="flex items-center gap-3 py-3 border-b last:border-0 min-h-[44px]"
              >
                <span className="text-sm font-semibold w-12 shrink-0">
                  {hearing.saat ?? '—'}
                </span>
                <div className="flex-1 min-w-0">
                  {mahkume ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm truncate">
                            <a
                              href={`/dosyalar/${hearing.dosya_id}`}
                              className="text-accent hover:underline"
                            >
                              {mahkumeTruncated} — Dosya #{hearing.dosya_no}
                            </a>
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>{mahkume}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="text-sm truncate">
                      <a
                        href={`/dosyalar/${hearing.dosya_id}`}
                        className="text-accent hover:underline"
                      >
                        Dosya #{hearing.dosya_no}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
