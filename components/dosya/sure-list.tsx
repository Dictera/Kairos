'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { isInAdliTatil, getDaysUntil } from '@/lib/deadline-service'

// Zod schema (must match sureRouter.createManuel/updateManuel)
const sureFormSchema = z.object({
  ad: z.string().min(1, 'Süre adı zorunludur').max(100),
  son_tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı'),
  notlar: z.string().max(500).optional().or(z.literal('')),
})
type SureFormValues = z.infer<typeof sureFormSchema>

type SureRow = {
  id: number
  dosya_id: number
  ad: string
  son_tarih: string
  tur: string
  notlar: string | null
  created_at: string
}

function urgencyBadgeClass(days: number): string {
  if (days < 0) return 'bg-destructive text-destructive-foreground'
  if (days < 3) return 'bg-destructive text-destructive-foreground'
  if (days < 7) return 'bg-yellow-400 text-yellow-900'
  return 'bg-muted text-muted-foreground'
}

function daysLabel(days: number): string {
  if (days < 0) return 'Geçti'
  if (days === 0) return 'Bugün'
  return `${days} gün`
}

export function SureList({ dosyaId }: { dosyaId: number }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editingSure, setEditingSure] = useState<SureRow | null>(null)
  const [deletingSure, setDeletingSure] = useState<SureRow | null>(null)

  const { data: sureList = [], isLoading } = useQuery(
    trpc.sure.list.queryOptions({ dosya_id: dosyaId })
  )

  const createMutation = useMutation(
    trpc.sure.createManuel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['sure', 'list']] })
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Süre kaydedildi.')
        form.reset()
        setShowForm(false)
      },
      onError: () => {
        toast.error('Süre kaydedilemedi. Tekrar deneyin.')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.sure.updateManuel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['sure', 'list']] })
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Süre güncellendi.')
        setEditingSure(null)
      },
      onError: () => {
        toast.error('Süre güncellenemedi. Tekrar deneyin.')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.sure.deleteSure.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['sure', 'list']] })
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Süre silindi.')
        setDeletingSure(null)
      },
      onError: () => {
        toast.error('Süre silinemedi. Tekrar deneyin.')
      },
    })
  )

  const form = useForm<SureFormValues>({
    resolver: zodResolver(sureFormSchema),
    defaultValues: {
      ad: '',
      son_tarih: '',
      notlar: '',
    },
  })

  const editForm = useForm<SureFormValues>({
    resolver: zodResolver(sureFormSchema),
  })

  const handleCreate = (values: SureFormValues) => {
    createMutation.mutate({
      dosya_id: dosyaId,
      ad: values.ad,
      son_tarih: values.son_tarih,
      notlar: values.notlar || undefined,
    })
  }

  const handleEditOpen = (sure: SureRow) => {
    setEditingSure(sure)
    editForm.reset({
      ad: sure.ad,
      son_tarih: sure.son_tarih,
      notlar: sure.notlar ?? '',
    })
  }

  const handleEditSubmit = (values: SureFormValues) => {
    if (!editingSure) return
    updateMutation.mutate({
      id: editingSure.id,
      ad: values.ad,
      son_tarih: values.son_tarih,
      notlar: values.notlar || undefined,
    })
  }

  const handleDelete = () => {
    if (!deletingSure) return
    deleteMutation.mutate({ id: deletingSure.id })
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: tr })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  return (
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Manuel Süre Ekle
        </Button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreate)}
            className="space-y-3 border rounded-md p-4 bg-card"
          >
            <FormField
              control={form.control}
              name="ad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Süre Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="örn. Yargılama Süresi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="son_tarih"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Son Tarih</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notlar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar (opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ek notlar..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  form.reset()
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Sure List */}
      {sureList.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground py-4">
          Henüz süre kaydı yok.
        </p>
      ) : (
        <div className="space-y-2">
          {sureList.map((sure: SureRow) => {
            const days = getDaysUntil(sure.son_tarih)
            const inAdliTatil = isInAdliTatil(sure.son_tarih)
            const isManuel = sure.tur === 'manuel'

            return (
              <div
                key={sure.id}
                className="flex items-center gap-3 py-2 px-3 border rounded-md bg-card"
              >
                <Badge className={urgencyBadgeClass(days)}>
                  {daysLabel(days)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{sure.ad}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sure.son_tarih)}
                    {inAdliTatil && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠ Adli Tatil — manuel kontrol
                      </Badge>
                    )}
                  </p>
                </div>
                {isManuel && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditOpen(sure)}
                      aria-label="Süreyi düzenle"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingSure(sure)}
                      aria-label="Süreyi sil"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletingSure !== null}
        onOpenChange={(open) => !open && setDeletingSure(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Süreyi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu süre kaydı kalıcı olarak silinecek. Emin misiniz?
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingSure(null)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editingSure !== null}
        onOpenChange={(open) => !open && setEditingSure(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Süreyi Düzenle</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-3"
            >
              <FormField
                control={editForm.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Süre Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="son_tarih"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Son Tarih</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notlar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar (opsiyonel)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingSure(null)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
