'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { avukatSchema } from '@/lib/validators/ayarlar'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type FormValues = z.infer<typeof avukatSchema>

export interface AvukatFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  sigortaSirketiId: number
  defaultValues?: {
    id?: number
    ad?: string
    tbb_sicil_no?: string
    iban?: string | null
    eposta?: string | null
    telefon?: string | null
  }
  onSuccess?: () => void
}

export function AvukatFormDialog({
  open,
  onOpenChange,
  mode,
  sigortaSirketiId,
  defaultValues,
  onSuccess,
}: AvukatFormDialogProps) {
  const trpc = useTRPC()

  const form = useForm<FormValues>({
    resolver: zodResolver(avukatSchema),
    defaultValues: {
      ad: '',
      tbb_sicil_no: '',
      iban: '',
      eposta: '',
      telefon: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        ad: defaultValues?.ad ?? '',
        tbb_sicil_no: defaultValues?.tbb_sicil_no ?? '',
        iban: defaultValues?.iban ?? '',
        eposta: defaultValues?.eposta ?? '',
        telefon: defaultValues?.telefon ?? '',
      })
    }
  }, [open, defaultValues, form])

  const createMutation = useMutation(
    trpc.ayarlar.avukat.create.mutationOptions({
      onSuccess: async (row) => {
        try {
          await linkMutation.mutateAsync({
            avukat_id: row.id,
            sigorta_sirketi_id: sigortaSirketiId,
          })
          toast.success('Kaydedildi.')
          onSuccess?.()
          onOpenChange(false)
        } catch {
          toast.error('Avukat oluşturuldu fakat şirkete bağlanamadı. Lütfen tekrar deneyin.')
        }
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.ayarlar.avukat.update.mutationOptions({
      onSuccess: () => {
        toast.success('Kaydedildi.')
        onSuccess?.()
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const linkMutation = useMutation(
    trpc.ayarlar.avukat.addSirket.mutationOptions({})
  )

  const isPending =
    createMutation.isPending || updateMutation.isPending || linkMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (mode === 'create') {
      createMutation.mutate(values)
    } else if (defaultValues?.id != null) {
      updateMutation.mutate({ id: defaultValues.id, ...values })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Avukat Ekle' : 'Avukat Düzenle'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="ad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ad <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ad Soyad..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tbb_sicil_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    TBB Sicil No <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="TBB sicil numarası..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="TR00 0000 0000 0000 0000 0000 00 (opsiyonel)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eposta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Posta</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="avukat@mail.com (opsiyonel)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="05XXXXXXXXX (opsiyonel)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isPending}>
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}