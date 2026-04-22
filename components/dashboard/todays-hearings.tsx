import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowRight } from 'lucide-react'

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
    <Card className="overflow-hidden">
      <CardHeader className="border-b py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Bugünkü Duruşmalar</CardTitle>
          <Badge className="bg-accent/10 text-accent hover:bg-accent/10 border-0 rounded-full text-xs font-semibold">
            {hearings.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {hearings.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">Bugün duruşma yok</p>
            <p className="text-sm text-muted-foreground">
              Bugün için kayıtlı duruşma bulunmuyor.
            </p>
          </div>
        ) : (
          <TooltipProvider>
            {hearings.map((hearing) => {
              const mahkeme = hearing.mahkeme_kurum ?? ''
              const mahkemeTruncated = mahkeme.length > 28 ? mahkeme.slice(0, 28) + '…' : mahkeme

              return (
                <Link
                  key={hearing.id}
                  href={`/dosyalar/${hearing.dosya_id}`}
                  className="flex items-center gap-4 px-6 py-3.5 border-b last:border-0 hover:bg-muted/50 transition-colors group"
                >
                  {/* Saat chip */}
                  <div className="w-12 h-9 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent tracking-tight">
                      {hearing.saat ?? '—'}
                    </span>
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    {mahkeme ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium truncate">{mahkemeTruncated}</p>
                        </TooltipTrigger>
                        <TooltipContent>{mahkeme}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground">—</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dosya #{hearing.dosya_no}
                    </p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              )
            })}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
