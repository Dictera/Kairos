'use client'

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
import { Separator } from '@/components/ui/separator'
import { DatePickerField } from '@/components/ui/date-picker'
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
  dosya_no: z.string().min(1).max(50).optional(),
  tur: z.enum(TUR_VALUES, { required_error: 'Dosya türü zorunludur' }),
  sigorta_turu_id: z.number().int().nullable().optional(),
  karsitaraf_sigorta_id: z.number().int().nullable().optional(),
  muvekkil_sigorta_id: z.number().int().nullable().optional(),
  muvekkil_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
  talep_tutari: z.number().positive('Geçerli bir tutar giriniz').nullable().optional(),
  muvekkil_plaka: z.string().max(10).optional().or(z.literal('')),
  hasar_dosya_no: z.string().max(200).nullable().optional().or(z.literal('')),
  kaza_tarihi: z.string().max(10).nullable().optional().or(z.literal('')),
  kusur_orani_karsi: z.number().int().min(0).max(100).nullable().optional(),
  aciklama: z.string().max(2000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

const EMPTY_DEFAULTS: FormValues = {
  muvekkil_id: 0,
  dosya_no: undefined,
  tur: 'STK',
  sigorta_turu_id: null,
  karsitaraf_sigorta_id: null,
  muvekkil_sigorta_id: null,
  muvekkil_police_no: '',
  talep_tutari: null,
  muvekkil_plaka: '',
  hasar_dosya_no: '',
  kaza_tarihi: '',
  kusur_orani_karsi: null,
  aciklama: '',
}

interface DosyaFormProps {
  mode: 'create' | 'edit'
  dosyaId?: number
}

// Inner form component — only mounted once all data is available, so defaultValues
// are correct from the first render and Radix UI Select components initialise properly.
function DosyaFormInner({
  mode,
  dosyaId,
  defaultValues,
  sigortaTuruList,
  sigortaSirketiList,
  muvekkilData,
}: {
  mode: 'create' | 'edit'
  dosyaId?: number
  defaultValues: FormValues
  sigortaTuruList: Array<{ id: number; ad: string }>
  sigortaSirketiList: Array<{ id: number; ad: string }>
  muvekkilData: { rows: Array<{ id: number; ad: string; soyad: string }> }
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const createMutation = useMutation(
    trpc.dosya.create.mutationOptions({
      onSuccess: (row) => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success(`Dosya başarıyla oluşturuldu. Dosya No: ${row.dosya_no}`)
        router.push('/dosyalar/' + row.id)
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
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
        if (err.data?.code === 'CONFLICT') {
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
        tur: values.tur,
        sigorta_turu_id: values.sigorta_turu_id ?? undefined,
        karsitaraf_sigorta_id: values.karsitaraf_sigorta_id ?? undefined,
        muvekkil_sigorta_id: values.muvekkil_sigorta_id ?? undefined,
        muvekkil_police_no: values.muvekkil_police_no || undefined,
        talep_tutari: values.talep_tutari ?? undefined,
        muvekkil_plaka: values.muvekkil_plaka || undefined,
        hasar_dosya_no: values.hasar_dosya_no || undefined,
        kaza_tarihi: values.kaza_tarihi || undefined,
        kusur_orani_karsi: values.kusur_orani_karsi ?? undefined,
        aciklama: values.aciklama || undefined,
      })
    } else {
      updateMutation.mutate({
        id: dosyaId!,
        muvekkil_id: values.muvekkil_id,
        dosya_no: values.dosya_no!,
        tur: values.tur,
        sigorta_turu_id: values.sigorta_turu_id ?? undefined,
        karsitaraf_sigorta_id: values.karsitaraf_sigorta_id ?? undefined,
        muvekkil_sigorta_id: values.muvekkil_sigorta_id ?? undefined,
        muvekkil_police_no: values.muvekkil_police_no || undefined,
        talep_tutari: values.talep_tutari ?? undefined,
        muvekkil_plaka: values.muvekkil_plaka || undefined,
        hasar_dosya_no: values.hasar_dosya_no || undefined,
        kaza_tarihi: values.kaza_tarihi || undefined,
        kusur_orani_karsi: values.kusur_orani_karsi ?? undefined,
        aciklama: values.aciklama || undefined,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const kusur_orani_karsi = form.watch('kusur_orani_karsi')

  return (
    <div className="max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Group 1: Temel Bilgiler */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Temel Bilgiler</h3>
            <Separator />

            {/* Dosya No */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="dosya_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avukat Dosya No</FormLabel>
                    <FormControl>
                      <Input placeholder="2026/1" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                      {muvekkilData.rows.map((m) => (
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
          </div>

          {/* Group 2: Sigorta Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Sigorta Bilgileri</h3>
            <Separator />

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
                      {sigortaTuruList.map((s) => (
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
                      {sigortaSirketiList.map((s) => (
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

            {/* Müvekkil Sigorta/Kasko Şirketi */}
            <FormField
              control={form.control}
              name="muvekkil_sigorta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Müvekkil Sigorta/Kasko Şirketi</FormLabel>
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
                      {sigortaSirketiList.map((s) => (
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

            {/* Müvekkil Poliçe No */}
            <FormField
              control={form.control}
              name="muvekkil_police_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Müvekkil Poliçe No</FormLabel>
                  <FormControl>
                    <Input placeholder="Poliçe numarası" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
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

            {/* Hasar Dosya No */}
            <FormField
              control={form.control}
              name="hasar_dosya_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasar Dosya No</FormLabel>
                  <FormControl>
                    <Input placeholder="Sigorta Şirketi - 111" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Group 3: Kaza Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Kaza Bilgileri</h3>
            <Separator />

            {/* Kaza Tarihi */}
            <FormField
              control={form.control}
              name="kaza_tarihi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kaza Tarihi</FormLabel>
                  <DatePickerField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Tarih seçin"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kusur Oranı - 2 column grid */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kusur_orani_karsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karşı Taraf Kusur Oranı (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  Müvekkil Kusur Oranı: {kusur_orani_karsi != null && kusur_orani_karsi >= 0 ? `${100 - kusur_orani_karsi}%` : '—'}
                </div>
              </div>
            </div>

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
          </div>

          {/* Group 4: Açıklama */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Açıklama</h3>
            <Separator />

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
          </div>

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

export function DosyaForm({ mode, dosyaId }: DosyaFormProps) {
  const trpc = useTRPC()

  const { data: sigortaTuruList } = useQuery(trpc.ayarlar.sigortaTuru.list.queryOptions())
  const { data: sigortaSirketiList } = useQuery(trpc.ayarlar.sigortaSirketi.list.queryOptions())
  const { data: muvekkilData } = useQuery(trpc.muvekkil.list.queryOptions({ pageSize: 100 }))
  const { data: dosyaData, isLoading: dosyaLoading } = useQuery({
    ...trpc.dosya.getById.queryOptions({ id: dosyaId! }),
    enabled: mode === 'edit' && !!dosyaId,
  })

  const lookupsReady = !!sigortaTuruList && !!sigortaSirketiList && !!muvekkilData

  if (mode === 'edit' && (dosyaLoading || !lookupsReady)) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // For create mode, also wait for lookups
  if (mode === 'create' && !lookupsReady) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // Build defaultValues from loaded data — ensures Radix UI Select components
  // are initialised with the correct value on first mount (not patched via reset()).
  const defaultValues: FormValues = mode === 'edit' && dosyaData
    ? {
        muvekkil_id: dosyaData.muvekkil_id,
        dosya_no: dosyaData.dosya_no,
        tur: dosyaData.tur as (typeof TUR_VALUES)[number],
        sigorta_turu_id: dosyaData.sigorta_turu_id ?? null,
        karsitaraf_sigorta_id: dosyaData.karsitaraf_sigorta_id ?? null,
        muvekkil_sigorta_id: dosyaData.muvekkil_sigorta_id ?? null,
        muvekkil_police_no: dosyaData.muvekkil_police_no ?? '',
        talep_tutari: dosyaData.talep_tutari ?? null,
        muvekkil_plaka: dosyaData.muvekkil_plaka ?? '',
        hasar_dosya_no: dosyaData.hasar_dosya_no ?? '',
        kaza_tarihi: dosyaData.kaza_tarihi ?? '',
        kusur_orani_karsi: dosyaData.kusur_orani_karsi ?? null,
        aciklama: dosyaData.aciklama ?? '',
      }
    : EMPTY_DEFAULTS

  return (
    <DosyaFormInner
      key={dosyaData?.id ?? 'create'}
      mode={mode}
      dosyaId={dosyaId}
      defaultValues={defaultValues}
      sigortaTuruList={sigortaTuruList!}
      sigortaSirketiList={sigortaSirketiList!}
      muvekkilData={muvekkilData!}
    />
  )
}
