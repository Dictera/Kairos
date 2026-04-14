'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { DatePickerField } from '@/components/ui/date-picker'
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

const stkDataFormSchema = z.object({
  ihtar_tarihi: z.string().max(10).optional().or(z.literal('')),
  arabuluculuk_son_tutanak_tarihi: z.string().max(10).optional().or(z.literal('')),
  basvuru_tarihi: z.string().max(10).optional().or(z.literal('')),
  stk_esas_no: z.string().max(100).optional().or(z.literal('')),
  stk_karar_no: z.string().max(100).optional().or(z.literal('')),
  stk_itiraz_esas_no: z.string().max(100).optional().or(z.literal('')),
  stk_itiraz_karar_no: z.string().max(100).optional().or(z.literal('')),
  bilirkisi_ucret_talep_tarihi: z.string().max(10).optional().or(z.literal('')),
  bilirkisi_raporu_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  islah_tarihi: z.string().max(10).optional().or(z.literal('')),
  karar_tarihi: z.string().max(10).optional().or(z.literal('')),
  kesinlesme_tarihi: z.string().max(10).optional().or(z.literal('')),
})

type StkDataFormValues = z.infer<typeof stkDataFormSchema>

type StkDataFormProps = {
  dosyaId: number
  initialData: StkSurecData | undefined
}

export function StkDataForm({ dosyaId, initialData }: StkDataFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<StkDataFormValues>({
    resolver: zodResolver(stkDataFormSchema),
    defaultValues: {
      ihtar_tarihi: initialData?.ihtar_tarihi ?? '',
      arabuluculuk_son_tutanak_tarihi: initialData?.arabuluculuk_son_tutanak_tarihi ?? '',
      basvuru_tarihi: initialData?.basvuru_tarihi ?? '',
      stk_esas_no: initialData?.stk_esas_no ?? '',
      stk_karar_no: initialData?.stk_karar_no ?? '',
      stk_itiraz_esas_no: initialData?.stk_itiraz_esas_no ?? '',
      stk_itiraz_karar_no: initialData?.stk_itiraz_karar_no ?? '',
      bilirkisi_ucret_talep_tarihi: initialData?.bilirkisi_ucret_talep_tarihi ?? '',
      bilirkisi_raporu_tebliğ_tarihi: initialData?.bilirkisi_raporu_tebliğ_tarihi ?? '',
      islah_tarihi: initialData?.islah_tarihi ?? '',
      karar_tarihi: initialData?.karar_tarihi ?? '',
      kesinlesme_tarihi: initialData?.kesinlesme_tarihi ?? '',
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
        ihtar_tarihi: values.ihtar_tarihi || undefined,
        arabuluculuk_son_tutanak_tarihi: values.arabuluculuk_son_tutanak_tarihi || undefined,
        basvuru_tarihi: values.basvuru_tarihi || undefined,
        stk_esas_no: values.stk_esas_no || undefined,
        stk_karar_no: values.stk_karar_no || undefined,
        stk_itiraz_esas_no: values.stk_itiraz_esas_no || undefined,
        stk_itiraz_karar_no: values.stk_itiraz_karar_no || undefined,
        bilirkisi_ucret_talep_tarihi: values.bilirkisi_ucret_talep_tarihi || undefined,
        bilirkisi_raporu_tebliğ_tarihi: values.bilirkisi_raporu_tebliğ_tarihi || undefined,
        islah_tarihi: values.islah_tarihi || undefined,
        karar_tarihi: values.karar_tarihi || undefined,
        kesinlesme_tarihi: values.kesinlesme_tarihi || undefined,
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
              {/* ihtar_tarihi */}
              <FormField
                control={form.control}
                name="ihtar_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İhtar Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="İhtar tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* arabuluculuk_son_tutanak_tarihi */}
              <FormField
                control={form.control}
                name="arabuluculuk_son_tutanak_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arabuluculuk Son Tutanak Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Arabuluculuk son tutanak tarihi"
                      />
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

              {/* stk_esas_no */}
              <FormField
                control={form.control}
                name="stk_esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STK Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="STK esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* stk_karar_no */}
              <FormField
                control={form.control}
                name="stk_karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STK Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="STK karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* stk_itiraz_esas_no */}
              <FormField
                control={form.control}
                name="stk_itiraz_esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STK İtiraz Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="İtiraz esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* stk_itiraz_karar_no */}
              <FormField
                control={form.control}
                name="stk_itiraz_karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STK İtiraz Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="İtiraz karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* bilirkisi_ucret_talep_tarihi */}
              <FormField
                control={form.control}
                name="bilirkisi_ucret_talep_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bilirkişi Ücreti Talep Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Bilirkişi ücreti talep tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* bilirkisi_raporu_tebliğ_tarihi */}
              <FormField
                control={form.control}
                name="bilirkisi_raporu_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bilirkişi Raporu Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Bilirkişi raporu tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* islah_tarihi */}
              <FormField
                control={form.control}
                name="islah_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Islah Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Islah tarihi"
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

              {/* kesinlesme_tarihi */}
              <FormField
                control={form.control}
                name="kesinlesme_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesinleşme Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Kesinleşme tarihi"
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
