'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
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

const mahkemeDataFormSchema = z.object({
  ilk_derece_esas_no: z.string().max(100).optional().or(z.literal('')),
  ilk_derece_karar_no: z.string().max(100).optional().or(z.literal('')),
  ilk_derece_mahkeme_adi: z.string().max(200).optional().or(z.literal('')),
  istinaf_esas_no: z.string().max(100).optional().or(z.literal('')),
  istinaf_karar_no: z.string().max(100).optional().or(z.literal('')),
  istinaf_mahkeme_adi: z.string().max(200).optional().or(z.literal('')),
  temyiz_esas_no: z.string().max(100).optional().or(z.literal('')),
  temyiz_karar_no: z.string().max(100).optional().or(z.literal('')),
  temyiz_mahkeme_adi: z.string().max(200).optional().or(z.literal('')),
  dava_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  cevap_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  replik_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  duplik_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  bilirkisi_ucret_talep_tarihi: z.string().max(10).optional().or(z.literal('')),
  bilirkisi_raporu_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  karar_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  istinaf_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  istinaf_karar_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  temyiz_dilekcesi_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  temyiz_karar_tebliğ_tarihi: z.string().max(10).optional().or(z.literal('')),
  kesinlesme_tarihi: z.string().max(10).optional().or(z.literal('')),
})

type MahkemeDataFormValues = z.infer<typeof mahkemeDataFormSchema>

type MahkemeDataFormProps = {
  dosyaId: number
  initialData: MahkemeSurecData | undefined
}

export function MahkemeDataForm({ dosyaId, initialData }: MahkemeDataFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<MahkemeDataFormValues>({
    resolver: zodResolver(mahkemeDataFormSchema),
    defaultValues: {
      ilk_derece_esas_no: initialData?.ilk_derece_esas_no ?? '',
      ilk_derece_karar_no: initialData?.ilk_derece_karar_no ?? '',
      ilk_derece_mahkeme_adi: initialData?.ilk_derece_mahkeme_adi ?? '',
      istinaf_esas_no: initialData?.istinaf_esas_no ?? '',
      istinaf_karar_no: initialData?.istinaf_karar_no ?? '',
      istinaf_mahkeme_adi: initialData?.istinaf_mahkeme_adi ?? '',
      temyiz_esas_no: initialData?.temyiz_esas_no ?? '',
      temyiz_karar_no: initialData?.temyiz_karar_no ?? '',
      temyiz_mahkeme_adi: initialData?.temyiz_mahkeme_adi ?? '',
      dava_dilekcesi_tebliğ_tarihi: initialData?.dava_dilekcesi_tebliğ_tarihi ?? '',
      cevap_dilekcesi_tebliğ_tarihi: initialData?.cevap_dilekcesi_tebliğ_tarihi ?? '',
      replik_dilekcesi_tebliğ_tarihi: initialData?.replik_dilekcesi_tebliğ_tarihi ?? '',
      duplik_dilekcesi_tebliğ_tarihi: initialData?.duplik_dilekcesi_tebliğ_tarihi ?? '',
      bilirkisi_ucret_talep_tarihi: initialData?.bilirkisi_ucret_talep_tarihi ?? '',
      bilirkisi_raporu_tebliğ_tarihi: initialData?.bilirkisi_raporu_tebliğ_tarihi ?? '',
      karar_tebliğ_tarihi: initialData?.karar_tebliğ_tarihi ?? '',
      istinaf_dilekcesi_tebliğ_tarihi: initialData?.istinaf_dilekcesi_tebliğ_tarihi ?? '',
      istinaf_karar_tebliğ_tarihi: initialData?.istinaf_karar_tebliğ_tarihi ?? '',
      temyiz_dilekcesi_tebliğ_tarihi: initialData?.temyiz_dilekcesi_tebliğ_tarihi ?? '',
      temyiz_karar_tebliğ_tarihi: initialData?.temyiz_karar_tebliğ_tarihi ?? '',
      kesinlesme_tarihi: initialData?.kesinlesme_tarihi ?? '',
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
        ilk_derece_esas_no: values.ilk_derece_esas_no || undefined,
        ilk_derece_karar_no: values.ilk_derece_karar_no || undefined,
        ilk_derece_mahkeme_adi: values.ilk_derece_mahkeme_adi || undefined,
        istinaf_esas_no: values.istinaf_esas_no || undefined,
        istinaf_karar_no: values.istinaf_karar_no || undefined,
        istinaf_mahkeme_adi: values.istinaf_mahkeme_adi || undefined,
        temyiz_esas_no: values.temyiz_esas_no || undefined,
        temyiz_karar_no: values.temyiz_karar_no || undefined,
        temyiz_mahkeme_adi: values.temyiz_mahkeme_adi || undefined,
        dava_dilekcesi_tebliğ_tarihi: values.dava_dilekcesi_tebliğ_tarihi || undefined,
        cevap_dilekcesi_tebliğ_tarihi: values.cevap_dilekcesi_tebliğ_tarihi || undefined,
        replik_dilekcesi_tebliğ_tarihi: values.replik_dilekcesi_tebliğ_tarihi || undefined,
        duplik_dilekcesi_tebliğ_tarihi: values.duplik_dilekcesi_tebliğ_tarihi || undefined,
        bilirkisi_ucret_talep_tarihi: values.bilirkisi_ucret_talep_tarihi || undefined,
        bilirkisi_raporu_tebliğ_tarihi: values.bilirkisi_raporu_tebliğ_tarihi || undefined,
        karar_tebliğ_tarihi: values.karar_tebliğ_tarihi || undefined,
        istinaf_dilekcesi_tebliğ_tarihi: values.istinaf_dilekcesi_tebliğ_tarihi || undefined,
        istinaf_karar_tebliğ_tarihi: values.istinaf_karar_tebliğ_tarihi || undefined,
        temyiz_dilekcesi_tebliğ_tarihi: values.temyiz_dilekcesi_tebliğ_tarihi || undefined,
        temyiz_karar_tebliğ_tarihi: values.temyiz_karar_tebliğ_tarihi || undefined,
        kesinlesme_tarihi: values.kesinlesme_tarihi || undefined,
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
              {/* İlk Derece Mahkeme - Esas No */}
              <FormField
                control={form.control}
                name="ilk_derece_esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlk Derece Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="İlk derece esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İlk Derece Mahkeme - Karar No */}
              <FormField
                control={form.control}
                name="ilk_derece_karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlk Derece Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="İlk derece karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İlk Derece Mahkeme - Mahkeme Adı (free text per D-15) */}
              <FormField
                control={form.control}
                name="ilk_derece_mahkeme_adi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlk Derece Mahkeme Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="İlk derece mahkeme adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İstinaf Esas No */}
              <FormField
                control={form.control}
                name="istinaf_esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstinaf Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="İstinaf esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İstinaf Karar No */}
              <FormField
                control={form.control}
                name="istinaf_karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstinaf Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="İstinaf karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İstinaf Mahkeme Adı (free text per D-15) */}
              <FormField
                control={form.control}
                name="istinaf_mahkeme_adi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstinaf Mahkeme Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="İstinaf mahkeme adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temyiz Esas No */}
              <FormField
                control={form.control}
                name="temyiz_esas_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temyiz Esas No</FormLabel>
                    <FormControl>
                      <Input placeholder="Temyiz esas numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temyiz Karar No */}
              <FormField
                control={form.control}
                name="temyiz_karar_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temyiz Karar No</FormLabel>
                    <FormControl>
                      <Input placeholder="Temyiz karar numarası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temyiz Mahkeme Adı (free text per D-15) */}
              <FormField
                control={form.control}
                name="temyiz_mahkeme_adi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temyiz Mahkeme Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Temyiz mahkeme adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dava Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="dava_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dava Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Dava dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cevap Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="cevap_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cevap Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Cevap dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Replik Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="replik_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replik Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Replik dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duplik Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="duplik_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duplik Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Duplik dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bilirkişi Ücreti Talep Tarihi */}
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

              {/* Bilirkişi Raporu Tebliğ Tarihi */}
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

              {/* Karar Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="karar_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karar Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Karar tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İstinaf Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="istinaf_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstinaf Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="İstinaf dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* İstinaf Karar Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="istinaf_karar_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstinaf Karar Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="İstinaf karar tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temyiz Dilekçesi Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="temyiz_dilekcesi_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temyiz Dilekçesi Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Temyiz dilekçesi tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temyiz Karar Tebliğ Tarihi */}
              <FormField
                control={form.control}
                name="temyiz_karar_tebliğ_tarihi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temyiz Karar Tebliğ Tarihi</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Temyiz karar tebliğ tarihi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kesinleşme Tarihi */}
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
