'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { CalendarIcon } from 'lucide-react'
import { DatePickerField } from '@/components/ui/date-picker'
import type { MahkemeSurecData } from '@/lib/schema'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const mahkemeDataFormSchema = z.object({
  esas_no: z.string().max(100).optional().or(z.literal('')),
  karar_no: z.string().max(100).optional().or(z.literal('')),
  mahkeme_id: z.number().int().optional().nullable(),
  dava_tarihi: z.string().max(10).optional().or(z.literal('')),
  tebligat_tarihi: z.string().max(10).optional().or(z.literal('')),
  karar_tarihi: z.string().max(10).optional().or(z.literal('')),
})

type MahkemeDataFormValues = z.infer<typeof mahkemeDataFormSchema>

type MahkemeDataFormProps = {
  dosyaId: number
  initialData: MahkemeSurecData | undefined
}

export function MahkemeDataForm({ dosyaId, initialData }: MahkemeDataFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: mahkemeler } = useQuery(trpc.ayarlar.mahkeme.list.queryOptions())

  const form = useForm<MahkemeDataFormValues>({
    resolver: zodResolver(mahkemeDataFormSchema),
    defaultValues: {
      esas_no: initialData?.esas_no ?? '',
      karar_no: initialData?.karar_no ?? '',
      mahkeme_id: initialData?.mahkeme_id ?? undefined,
      dava_tarihi: initialData?.dava_tarihi ?? '',
      tebligat_tarihi: initialData?.tebligat_tarihi ?? '',
      karar_tarihi: initialData?.karar_tarihi ?? '',
    },
  })

  const saveMutation = useMutation(
    trpc.surec.updateMahkemeData.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Bilgiler kaydedildi.')
      },
      onError: () => {
        toast.error('Kaydetme sırasında hata oluştu. Tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: MahkemeDataFormValues) => {
    saveMutation.mutate({
      dosya_id: dosyaId,
      data: {
        esas_no: values.esas_no || undefined,
        karar_no: values.karar_no || undefined,
        mahkeme_id: values.mahkeme_id || undefined,
        dava_tarihi: values.dava_tarihi || undefined,
        tebligat_tarihi: values.tebligat_tarihi || undefined,
        karar_tarihi: values.karar_tarihi || undefined,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mahkeme Veri Noktaları</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* esas_no */}
              <FormField
                control={form.control}
                name="esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="Esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* karar_no */}
              <FormField
                control={form.control}
                name="karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="Karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* mahkeme_id - dropdown from ayarlar */}
              <FormField
                control={form.control}
                name="mahkeme_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mahkeme Adı</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() ?? ''}
                        onValueChange={(val) => field.onChange(val ? parseInt(val, 10) : undefined)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Mahkeme seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {(mahkemeler ?? []).map((m) => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              {m.ad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* dava_tarihi */}
              <FormField
                control={form.control}
                name="dava_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dava Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Dava tarihi"
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

              {/* karar_tarihi */}
              <FormField
                control={form.control}
                name="karar_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karar Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Karar tarihi"
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
