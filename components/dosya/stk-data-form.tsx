'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { CalendarIcon } from 'lucide-react'
import type { StkSurecData } from '@/lib/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const stkDataFormSchema = z.object({
  basvuru_no: z.string().max(100).optional().or(z.literal('')),
  basvuru_tarihi: z.string().max(10).optional().or(z.literal('')),
  kabul_tarihi: z.string().max(10).optional().or(z.literal('')),
  raportor_adi: z.string().max(200).optional().or(z.literal('')),
  bilirkisi: z.string().max(200).optional().or(z.literal('')),
  hakem_karar_tarihi: z.string().max(10).optional().or(z.literal('')),
  tebligat_tarihi: z.string().max(10).optional().or(z.literal('')),
  itiraz_tarihi: z.string().max(10).optional().or(z.literal('')),
})

type StkDataFormValues = z.infer<typeof stkDataFormSchema>

type StkDataFormProps = {
  dosyaId: number
  initialData: StkSurecData | undefined
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string | null | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
}) {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {date ? format(date, 'dd.MM.yyyy', { locale: tr }) : placeholder ?? 'Tarih seçin'}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : undefined)}
          locale={tr}
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  )
}

export function StkDataForm({ dosyaId, initialData }: StkDataFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<StkDataFormValues>({
    resolver: zodResolver(stkDataFormSchema),
    defaultValues: {
      basvuru_no: initialData?.basvuru_no ?? '',
      basvuru_tarihi: initialData?.basvuru_tarihi ?? '',
      kabul_tarihi: initialData?.kabul_tarihi ?? '',
      raportor_adi: initialData?.raportor_adi ?? '',
      bilirkisi: initialData?.bilirkisi ?? '',
      hakem_karar_tarihi: initialData?.hakem_karar_tarihi ?? '',
      tebligat_tarihi: initialData?.tebligat_tarihi ?? '',
      itiraz_tarihi: initialData?.itiraz_tarihi ?? '',
    },
  })

  const saveMutation = useMutation(
    trpc.surec.updateStkData.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Bilgiler kaydedildi.')
      },
      onError: () => {
        toast.error('Kaydetme sırasında hata oluştu. Tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: StkDataFormValues) => {
    saveMutation.mutate({
      dosya_id: dosyaId,
      data: {
        basvuru_no: values.basvuru_no || undefined,
        basvuru_tarihi: values.basvuru_tarihi || undefined,
        kabul_tarihi: values.kabul_tarihi || undefined,
        raportor_adi: values.raportor_adi || undefined,
        bilirkisi: values.bilirkisi || undefined,
        hakem_karar_tarihi: values.hakem_karar_tarihi || undefined,
        tebligat_tarihi: values.tebligat_tarihi || undefined,
        itiraz_tarihi: values.itiraz_tarihi || undefined,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">STK Veri Noktaları</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* basvuru_no */}
              <FormField
                control={form.control}
                name="basvuru_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STK Başvuru No</FormLabel>
                    <FormControl>
                      <Input placeholder="Başvuru numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* basvuru_tarihi */}
              <FormField
                control={form.control}
                name="basvuru_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başvuru Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Başvuru tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* kabul_tarihi */}
              <FormField
                control={form.control}
                name="kabul_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kabul Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Kabul tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* raportor_adi */}
              <FormField
                control={form.control}
                name="raportor_adi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raportör Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Raportör adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* bilirkisi */}
              <FormField
                control={form.control}
                name="bilirkisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bilirkişi</FormLabel>
                    <FormControl>
                      <Input placeholder="Bilirkişi adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* hakem_karar_tarihi */}
              <FormField
                control={form.control}
                name="hakem_karar_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hakem Karar Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Hakem karar tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* tebligat_tarihi */}
              <FormField
                control={form.control}
                name="tebligat_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tebligat Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Tebligat tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* itiraz_tarihi */}
              <FormField
                control={form.control}
                name="itiraz_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İtiraz Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="İtiraz tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-start">
              <Button type="submit" variant="default" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
