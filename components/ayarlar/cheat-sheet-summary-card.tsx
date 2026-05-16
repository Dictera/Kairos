import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function CheatSheetSummaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Değişken Listesi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Şablonlarınızda kullanabileceğiniz tüm değişkenlerin listesi ve açıklamaları.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sablon-yonetimi/degiskenler">Tüm değişkenleri gör</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
