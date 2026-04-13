'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const KATEGORI_LABELS: Record<string, string> = {
  'İtiraz Dilekçesi': 'İtiraz',
  'Cevap Dilekçesi': 'Cevap',
  'Genel': 'Genel',
}

const KATEGORI_COLORS: Record<string, string> = {
  'İtiraz Dilekçesi': 'bg-orange-100 text-orange-800 border-orange-200',
  'Cevap Dilekçesi': 'bg-blue-100 text-blue-800 border-blue-200',
  'Genel': 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function DilekcelerPage() {
  const trpc = useTRPC()
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: sablonlar, isLoading } = useQuery(trpc.dilekce.list.queryOptions())

  const deleteMutation = useMutation(trpc.dilekce.delete.mutationOptions({
    onSuccess: () => {
      setDeleteId(null)
      router.invalidate()
    },
  }))

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return <div className="p-8">Yükleniyor...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dilekçe Şablonları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dilekçe şablonlarınızı oluşturun ve yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/dilekce/yeni">Yeni Şablon</Link>
        </Button>
      </div>

      {!sablonlar || sablonlar.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Henüz dilekçe şablonu yok</p>
            <p className="text-sm text-muted-foreground mb-6">
              İlk şablonunuzu oluşturarak başlayın.
            </p>
            <Button asChild>
              <Link href="/dilekce/yeni">İlk Şablonu Oluştur</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sablonlar.map((sablon) => (
            <Card key={sablon.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium">{sablon.baslik}</CardTitle>
                  <Badge 
                    className={`${KATEGORI_COLORS[sablon.kategori] || ''}`}
                    variant="outline"
                  >
                    {KATEGORI_LABELS[sablon.kategori] || sablon.kategori}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-4">
                  Güncellenme: {formatDate(sablon.updated_at)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dilekce/${sablon.id}`}>Düzenle</Link>
                  </Button>
                  <AlertDialog open={deleteId === sablon.id} onOpenChange={(open) => setDeleteId(open ? sablon.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{sablon.baslik}" şablonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate({ id: sablon.id })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}