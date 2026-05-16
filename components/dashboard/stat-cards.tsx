import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardsProps = {
  totalDosya: number
  aktivDosya: number
  buAyAcilan: number
  totalDelta?: number
  aktivDelta?: number
  buAyDelta?: number
}

function StatCard({
  label,
  value,
  delta,
}: {
  label: string
  value: number
  delta?: number
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-4xl font-semibold tracking-tight leading-none">{value}</p>
        {delta !== undefined && (
          <p className="text-xs text-muted-foreground">
            <span
              className={
                delta >= 0
                  ? 'text-green-600 font-medium'
                  : 'text-destructive font-medium'
              }
            >
              {delta >= 0 ? '+' : ''}
              {delta}
            </span>{' '}
            geçen aya göre
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCards({
  totalDosya,
  aktivDosya,
  buAyAcilan,
  totalDelta,
  aktivDelta,
  buAyDelta,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Toplam Dosya" value={totalDosya} delta={totalDelta} />
      <StatCard label="Aktif Dosya"  value={aktivDosya}  delta={aktivDelta} />
      <StatCard label="Bu Ay Açılan" value={buAyAcilan}  delta={buAyDelta} />
    </div>
  )
}
