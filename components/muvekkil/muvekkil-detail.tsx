'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface MuvekkilDetailProps {
  muvekkilId: number
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTutar(tutar: number | null | undefined) {
  if (tutar == null) return '—'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar)
}

type DosyaTur = 'STK' | 'AT' | 'AH' | string
type DosyaDurum = 'aktif' | 'arsiv' | string

function TurBadge({ tur }: { tur: DosyaTur }) {
  if (tur === 'STK') {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{tur}</Badge>
  }
  return <Badge className="bg-muted text-muted-foreground hover:bg-muted">{tur}</Badge>
}

function DurumBadge({ durum }: { durum: DosyaDurum }) {
  if (durum === 'aktif') {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
  }
  return <Badge className="bg-muted text-muted-foreground hover:bg-muted">Arşiv</Badge>
}

export function MuvekkilDetail({ muvekkilId }: MuvekkilDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLinkedError, setShowLinkedError] = useState(false)

  const { data, isLoading, isError } = useQuery(
    trpc.muvekkil.getById.queryOptions({ id: muvekkilId })
  )

  const deleteMutation = useMutation(
    trpc.muvekkil.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Silindi.')
        queryClient.invalidateQueries({ queryKey: ['muvekkil'] })
        router.push('/muvekkiller')
      },
      onError: (err) => {
        setShowDeleteDialog(false)
        if (err.data?.code === 'PRECONDITION_FAILED') {
          setShowLinkedError(true)
        } else {
          toast.error('Silinemedi. Lütfen tekrar deneyin.')
        }
      },
    })
  )

  const handleDeleteClick = () => {
    setShowLinkedError(false)
    if (data && data.dosyalar.length > 0) {
      setShowLinkedError(true)
    } else {
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteConfirm = () => {
    deleteMutation.mutate({ id: muvekkilId })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Müvekkil bulunamadı.
      </div>
    )
  }

  const dosyalar = data.dosyalar ?? []
  const visibleDosyalar = dosyalar.slice(0, 10)
  const hasMore = dosyalar.length > 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {data.ad} {data.soyad}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/muvekkiller/${muvekkilId}/duzenle`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Linked dosyalar error banner (D-07) */}
      {showLinkedError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
          Bu müvekkile ait {dosyalar.length} dosya bulunuyor. Müvekkili silmek için önce tüm dosyaları silin veya arşivleyin.
          <Link href={`/dosyalar?muvekkil=${muvekkilId}`} className="ml-1 underline">
            Dosyaları Gör
          </Link>
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Müvekkil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Ad Soyad</dt>
              <dd className="text-sm mt-1">{data.ad} {data.soyad}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Telefon</dt>
              <dd className="text-sm mt-1">{data.telefon ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">IBAN</dt>
              <dd className="text-sm mt-1">{data.iban ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">TC / Vergi No</dt>
              <dd className="text-sm mt-1">{data.tc_vergi_no ?? '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">Adres</dt>
              <dd className="text-sm mt-1 whitespace-pre-wrap">{data.adres ?? '—'}</dd>
            </div>
            {data.notlar && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-muted-foreground">Notlar</dt>
                <dd className="text-sm mt-1 whitespace-pre-wrap">{data.notlar}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">Kayıt Tarihi</dt>
              <dd className="text-sm mt-1">{formatDate(data.created_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Linked Dosyalar */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Bağlı Dosyalar</h2>
        {dosyalar.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu müvekkile ait dosya bulunmuyor.</p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Dosya No</TableHead>
                    <TableHead className="font-semibold">Tür</TableHead>
                    <TableHead className="font-semibold">Durum</TableHead>
                    <TableHead className="font-semibold">Talep Tutarı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleDosyalar.map((dosya) => (
                    <TableRow key={dosya.id}>
                      <TableCell>
                        <Link
                          href={`/dosyalar/${dosya.id}`}
                          className="text-sm font-medium hover:underline text-primary"
                        >
                          {dosya.dosya_no}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TurBadge tur={dosya.tur} />
                      </TableCell>
                      <TableCell>
                        <DurumBadge durum={dosya.durum} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTutar(dosya.talep_tutari)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {hasMore && (
              <div className="text-sm">
                <Link
                  href={`/dosyalar?muvekkil=${muvekkilId}`}
                  className="text-primary hover:underline"
                >
                  Tüm Dosyaları Gör ({dosyalar.length} dosya)
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog (D-08) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müvekkili Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müvekkili silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
