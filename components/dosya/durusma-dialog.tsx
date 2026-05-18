'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { CalendarIcon } from 'lucide-react'
import { DatePickerField } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimeField } from '@/components/ui/time-field'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const durusmaFormSchema = z.object({
  tarih: z.string().min(1, 'Tarih seçilmelidir.'),
  saat: z.string().max(10).optional().or(z.literal('')),
  mahkeme_kurum: z.string().max(200).optional().or(z.literal('')),
  tur: z.string().max(100).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

type DurusmaFormValues = z.infer<typeof durusmaFormSchema>

type DurusmaDialogProps = {
  dosyaId: number
  durusma?: {
    id: number
    tarih: string
    saat: string | null
    mahkeme_kurum: string | null
    tur: string | null
    notlar: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DurusmaDialog({
  dosyaId,
  durusma,
  open,
  onOpenChange,
}: DurusmaDialogProps) {
  const trpc = useTRPC()

  const form = useForm<DurusmaFormValues>({
    resolver: zodResolver(durusmaFormSchema),
    defaultValues: {
      tarih: '',
      saat: '',
      mahkeme_kurum: '',
      tur: '',
      notlar: '',
    },
  })

  // Reset form when dialog opens/closes or durusma changes
  useEffect(() => {
    if (!open) {
      form.reset({
        tarih: '',
        saat: '',
        mahkeme_kurum: '',
        tur: '',
        notlar: '',
      })
    } else if (durusma) {
      form.reset({
        tarih: durusma.tarih,
        saat: durusma.saat ?? '',
        mahkeme_kurum: durusma.mahkeme_kurum ?? '',
        tur: durusma.tur ?? '',
        notlar: durusma.notlar ?? '',
      })
    } else {
      form.reset({
        tarih: '',
        saat: '',
        mahkeme_kurum: '',
        tur: '',
        notlar: '',
      })
    }
  }, [open, durusma, form])

  const createMutation = useMutation(
    trpc.surec.durusmaCreate.mutationOptions({
      onSuccess: () => {
        toast.success('Duruşma eklendi.')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('İşlem sırasında hata oluştu. Tekrar deneyin.')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.surec.durusmaUpdate.mutationOptions({
      onSuccess: () => {
        toast.success('Duruşma güncellendi.')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('İşlem sırasında hata oluştu. Tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: DurusmaFormValues) => {
    if (durusma) {
      updateMutation.mutate({
        id: durusma.id,
        tarih: values.tarih,
        saat: values.saat || undefined,
        mahkeme_kurum: values.mahkeme_kurum || undefined,
        tur: values.tur || undefined,
        notlar: values.notlar || undefined,
      })
    } else {
      createMutation.mutate({
        dosya_id: dosyaId,
        tarih: values.tarih,
        saat: values.saat || undefined,
        mahkeme_kurum: values.mahkeme_kurum || undefined,
        tur: values.tur || undefined,
        notlar: values.notlar || undefined,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{durusma ? 'Duruşma Düzenle' : 'Duruşma Ekle'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* tarih - required */}
            <FormField
              control={form.control}
              name="tarih"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tarih</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Tarih seçin"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* saat */}
            <FormField
              control={form.control}
              name="saat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saat</FormLabel>
                  <FormControl>
                    <TimeField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* mahkeme_kurum */}
            <FormField
              control={form.control}
              name="mahkeme_kurum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mahkeme/Kurum</FormLabel>
                  <FormControl>
                    <Input placeholder="Mahkeme veya kurum adı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* tur */}
            <FormField
              control={form.control}
              name="tur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duruşma Türü</FormLabel>
                  <FormControl>
                    <Input placeholder="Esas / ara karar / bilirkişi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* notlar */}
            <FormField
              control={form.control}
              name="notlar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Duruşma notları..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" variant="default" disabled={isPending}>
                {isPending
                  ? 'Kaydediliyor...'
                  : durusma
                    ? 'Değişiklikleri Kaydet'
                    : 'Duruşmayı Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
