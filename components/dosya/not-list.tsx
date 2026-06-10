'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { NotForm } from './not-form'

const noteSchema = z.object({
  icerik: z.string().min(1, 'Not içeriği zorunludur').max(5000),
})

type NoteEditValues = z.infer<typeof noteSchema>

interface NotListProps {
  dosyaId: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotList({ dosyaId }: NotListProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: notes, isLoading } = useQuery(
    trpc.notlar.list.queryOptions({ dosya_id: dosyaId })
  )

  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const updateMutation = useMutation(
    trpc.notlar.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notlar.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('Not güncellendi.')
        setEditingId(null)
      },
      onError: () => {
        toast.error('Not kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.notlar.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notlar.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('Not silindi.')
        setDeleteId(null)
      },
      onError: () => {
        toast.error('Not silinemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="h-20 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notlar</h3>
        <NotForm dosyaId={dosyaId} />
      </div>

      {/* Empty state */}
      {(!notes || notes.length === 0) && (
        <div className="text-center py-8 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Henüz not eklenmedi</p>
          <p className="text-xs text-muted-foreground">
            Bu dosyaya not eklemek için &apos;Not Ekle&apos; düğmesine tıklayın.
          </p>
        </div>
      )}

      {/* Notes list */}
      {notes && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id
            const isDeleting = deleteId === note.id

            return (
              <Card key={note.id}>
                <CardContent className="pt-4">
                  {isEditing ? (
                    <EditForm
                      note={note}
                      onSave={(icerik) => updateMutation.mutate({ id: note.id, icerik })}
                      onCancel={() => setEditingId(null)}
                      isPending={updateMutation.isPending}
                    />
                  ) : (
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap">{note.icerik}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(note.id)}
                          aria-label="Notu düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(note.id)}
                          aria-label="Notu sil"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu notu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditForm({
  note,
  onSave,
  onCancel,
  isPending,
}: {
  note: { id: number; icerik: string }
  onSave: (icerik: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const form = useForm<NoteEditValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { icerik: note.icerik },
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (values.icerik.trim()) onSave(values.icerik)
      })}
      className="space-y-3"
    >
      <Textarea
        {...form.register('icerik')}
        rows={3}
        className="whitespace-pre-wrap"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Kaydediliyor...' : 'Notu Kaydet'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Düzenlemeden Vazgeç
        </Button>
      </div>
    </form>
  )
}
