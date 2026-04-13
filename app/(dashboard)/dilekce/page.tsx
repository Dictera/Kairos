'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function DilekcelerPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dilekçe Şablonları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            HTML veya ODT şablonlarla dilekçe oluşturun
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Dilekçe Özelliği Askıya Alındı</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Dilekçe şablonları ve oluşturma özelliği şu anda askıya alınmıştır. 
            Yeni bir çözüm bulunduğunda aktive edilecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
