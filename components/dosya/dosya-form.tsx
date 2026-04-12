'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const TUR_VALUES = ['STK', 'AT', 'AH'] as const

const formSchema = z.object({
  muvekkil_id: z.number({ required_error: 'Müvekkil seçimi zorunludur' }).int(),
  dosya_no: z.string().min(1, 'Dosya numarası zorunludur').max(50),
  tur: z.enum(TUR_VALUES, { required_error: 'Dosya türü zorunludur' }),
  sigorta_turu_id: z.number().int().nullable().optional(),
  karsitaraf_sigorta_id: z.number().int().nullable().optional(),
  talep_tutari: z.number().positive('Geçerli bir tutar giriniz').nullable().optional(),
  muvekkil_plaka: z.string().max(10).optional().or(z.literal('')),
  aciklama: z.string().max(2000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

const EMPTY_DEFAULTS: FormValues = {
  muvekkil_id: 0,
  dosya_no: '',
  tur: 'STK',
  sigorta_turu_id: null,
  karsitaraf_sigorta_id: null,
  talep_tutari: null,
  muvekkil_plaka: '',
  aciklama: '',
}

interface DosyaFormProps {
  mode: 'create' | 'edit'
  dosyaId?: number
}

export function DosyaForm({ mode, dosyaId }: DosyaFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { data: sigortaTuruList } = useQuery(trpc.ayarlar.sigortaTuru.list.queryOptions())
  const { data: sigortaSirketiList } = useQuery(trpc.ayarlar.sigortaSirketi.list.queryOptions())
  const { data: muvekkilData } = useQuery(trpc.muvekkil.list.queryOptions({ pageSize: 100 }))
  const { data: dosyaData, isLoading: dosyaLoading } = useQuery({
    ...trpc.dosya.getById.queryOptions({ id: dosyaId! }),
    enabled: mode === 'edit' && !!dosyaId,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  // Populate form when edit data loads
  useEffect(() => {
    if (dosyaData && mode === 'edit') {
      form.reset({
        muvekkil_id: dosyaData.muvekkil_id,
        dosya_no: dosyaData.dosya_no,
        tur: dosyaData.tur as (typeof TUR_VALUES)[number],
        sigorta_turu_id: dosyaData.sigorta_turu_id ?? null,
        karsitaraf_sigorta_id: dosyaData.karsitaraf_sigorta_id ?? null,
        talep_tutari: dosyaData.talep_tutari ?? null,
        muvekkil_plaka: dosyaData.muvekkil_plaka ?? '',
        aciklama: dosyaData.aciklama ?? '',
      })
    }
  }, [dosyaData, mode, form])

  const createMutation = useMutation(
    trpc.dosya.create.mutationOptions({
      onSuccess: (row) => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success('Dosya başarıyla oluşturuldu.')
        router.push('/dosyalar/' + row.id)
      },
      onError: (err) => {
        if (
          err.message?.toLowerCase().includes('unique') ||
          err.message?.toLowerCase().includes('conflict')
        ) {
          form.setError('dosya_no', { message: 'Bu dosya numarası zaten kullanılıyor.' })
        } else {
          toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
        }
      },
    })
  )

  const updateMutation = useMutation(
    trpc.dosya.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success('Kaydedildi.')
        router.push('/dosyalar/' + dosyaId)
      },
      onError: (err) => {
        if (
          err.message?.toLowerCase().includes('unique') ||
          err.message?.toLowerCase().includes('conflict')
        ) {
          form.setError('dosya_no', { message: 'Bu dosya numarası zaten kullanılıyor.' })
        } else {
          toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
        }
      },
    })
  )

  const archiveMutation = useMutation(
    trpc.dosya.archive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success('Dosya arşivlendi.')
        router.push('/dosyalar/' + dosyaId)
      },
      onError: () => {
        toast.error('Arşivlenemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: FormValues) => {
    if (mode === 'create') {
      createMutation.mutate({
        muvekkil_id: values.muvekkil_id,
        dosya_no: values.dosya_no,
        tur: values.tur,
        sigorta_turu_id: values.sigorta_turu_id ?? undefined,
        karsitaraf_sigorta_id: values.karsitaraf_sigorta_id ?? undefined,
        talep_tutari: values.talep_tutari ?? undefined,
        muvekkil_plaka: values.muvekkil_plaka || undefined,
        aciklama: values.aciklama || undefined,
      })
    } else {
      updateMutation.mutate({
        id: dosyaId!,
        muvekkil_id: values.muvekkil_id,
        dosya_no: values.dosya_no,
        tur: values.tur,
        sigorta_turu_id: values.sigorta_turu_id ?? undefined,
        karsitaraf_sigorta_id: values.karsitaraf_sigorta_id ?? undefined,
        talep_tutari: values.talep_tutari ?? undefined,
        muvekkil_plaka: values.muvekkil_plaka || undefined,
        aciklama: values.aciklama || undefined,
      })
    }
  }

  if (mode === 'edit' && dosyaLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Dosya No */}
          <FormField
            control={form.control}
            name="dosya_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avukat Dosya No *</FormLabel>
                <FormControl>
                  <Input placeholder="2024/001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Müvekkil */}
          <FormField
            control={form.control}
            name="muvekkil_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müvekkil *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={field.value ? field.value.toString() : ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Müvekkil seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {muvekkilData?.rows.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.ad} {m.soyad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dosya Türü */}
          <FormField
            control={form.control}
            name="tur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosya Türü *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="STK">STK</SelectItem>
                    <SelectItem value="AT">Asliye Ticaret</SelectItem>
                    <SelectItem value="AH">Asliye Hukuk</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sigorta Türü */}
          <FormField
            control={form.control}
            name="sigorta_turu_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sigorta Türü</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v, 10))}
                  value={field.value != null ? field.value.toString() : 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Seçiniz</SelectItem>
                    {sigortaTuruList?.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.ad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Karşı Sigorta Şirketi */}
          <FormField
            control={form.control}
            name="karsitaraf_sigorta_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Karşı Sigorta Şirketi</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v, 10))}
                  value={field.value != null ? field.value.toString() : 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Yok / Bilinmiyor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Yok / Bilinmiyor</SelectItem>
                    {sigortaSirketiList?.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.ad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Talep Tutarı */}
          <FormField
            control={form.control}
            name="talep_tutari"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Talep Tutarı</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₺
                    </span>
                    <Input
                      className="pl-7"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Müvekkil Plaka No */}
          <FormField
            control={form.control}
            name="muvekkil_plaka"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müvekkil Plaka No</FormLabel>
                <FormControl>
                  <Input placeholder="34 ABC 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Açıklama */}
          <FormField
            control={form.control}
            name="aciklama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Kısa açıklama..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3 pt-2">
            {mode === 'edit' && dosyaId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-50"
                  >
                    Arşivle
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Dosyayı arşivle</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu dosya arşivlenecek. Arşivlenen dosyalar listede &quot;Arşivlenmiş&quot;
                      olarak görünür ve tekrar aktif hale getirilebilir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => archiveMutation.mutate({ id: dosyaId })}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Arşivle
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex-1" />
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
