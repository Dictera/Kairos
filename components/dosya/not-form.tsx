'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const noteSchema = z.object({
  icerik: z.string().min(1, 'Not içeriği zorunludur').max(5000),
})

type NoteFormValues = z.infer<typeof noteSchema>

interface NotFormProps {
  dosyaId: number
  onSuccess?: () => void
}

export function NotForm({ dosyaId, onSuccess }: NotFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { icerik: '' },
  })

  const createMutation = useMutation(
    trpc.notlar.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notlar.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('Not eklendi.')
        form.reset()
        setIsOpen(false)
        onSuccess?.()
      },
      onError: () => {
        toast.error('Not kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: NoteFormValues) => {
    createMutation.mutate({ dosya_id: dosyaId, icerik: values.icerik })
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        Not Ekle
      </Button>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...form.register('icerik')}
        placeholder="Notunuzu yazın..."
        rows={3}
        className="whitespace-pre-wrap"
      />
      {form.formState.errors.icerik && (
        <p className="text-sm text-destructive">{form.formState.errors.icerik.message}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Kaydediliyor...' : 'Not Ekle'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false)
            form.reset()
          }}
        >
          Vazgeç
        </Button>
      </div>
    </form>
  )
}
