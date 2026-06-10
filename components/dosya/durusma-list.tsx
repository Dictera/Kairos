'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DurusmaDialog } from './durusma-dialog'

type DurusmaRow = {
  id: number
  tarih: string
  saat: string | null
  mahkeme_kurum: string | null
  tur: string | null
  notlar: string | null
}

type DurusmaListProps = {
  dosyaId: number
}

function formatTarih(tarih: string) {
  try {
    return format(parseISO(tarih), 'dd.MM.yyyy')
  } catch {
    return tarih
  }
}

function truncate(text: string | null | undefined, maxLen: number) {
  if (!text) return null
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export function DurusmaList({ dosyaId }: DurusmaListProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDurusma, setEditingDurusma] = useState<DurusmaRow | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: durusmaList = [] } = useQuery(
    trpc.surec.durusmaList.queryOptions({ dosya_id: dosyaId })
  )

  const deleteMutation = useMutation(
    trpc.surec.durusmaDelete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['surec', 'durusmaList']] })
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Duruşma silindi.')
        setDeletingId(null)
      },
      onError: () => {
        toast.error('İşlem sırasında hata oluştu. Tekrar deneyin.')
        setDeletingId(null)
      },
    })
  )

  const handleEdit = (durusma: DurusmaRow) => {
    setEditingDurusma(durusma)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingDurusma(null)
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingDurusma(null)
    }
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id })
  }

  if (durusmaList.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Duruşmalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Henüz duruşma kaydı yok
            </p>
            <p className="text-sm text-muted-foreground">
              Bu dosyaya ait duruşma kaydı bulunmuyor. Duruşma eklemek için aşağıdaki butonu kullanın.
            </p>
            <Button variant="default" onClick={handleAdd}>
              Duruşma Ekle
            </Button>
          </CardContent>
        </Card>

        <DurusmaDialog
          dosyaId={dosyaId}
          durusma={editingDurusma}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duruşmalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Tarih</th>
                  <th className="text-left py-2 pr-4 font-semibold">Saat</th>
                  <th className="text-left py-2 pr-4 font-semibold">Mahkeme/Kurum</th>
                  <th className="text-left py-2 pr-4 font-semibold">Tür</th>
                  <th className="text-left py-2 pr-4 font-semibold">Notlar</th>
                  <th className="text-left py-2 font-semibold">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {durusmaList.map((d: DurusmaRow) => (
                  <tr key={d.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">{formatTarih(d.tarih)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{d.saat || '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{d.mahkeme_kurum || '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{d.tur || '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {d.notlar ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {truncate(d.notlar, 40)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{d.notlar}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(d)}
                          aria-label="Duruşmayı düzenle"
                          className="h-9 w-9"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(d.id)}
                          aria-label="Duruşmayı sil"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-start">
            <Button variant="default" onClick={handleAdd}>
              Duruşma Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Duruşmayı Sil</AlertDialogTitle>
          <AlertDialogDescription>
            Bu duruşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeletingId(null)}
            >
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletingId !== null && handleDelete(deletingId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit/Add dialog */}
      <DurusmaDialog
        dosyaId={dosyaId}
        durusma={editingDurusma}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  )
}
