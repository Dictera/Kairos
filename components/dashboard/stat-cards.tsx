import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardsProps = {
  totalDosya: number
  aktivDosya: number
  buAyAcilan: number
}

export function StatCards({ totalDosya, aktivDosya, buAyAcilan }: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Toplam Dosya</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{totalDosya}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Aktif Dosya</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{aktivDosya}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Bu Ay Açılan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{buAyAcilan}</p>
        </CardContent>
      </Card>
    </div>
  )
}
