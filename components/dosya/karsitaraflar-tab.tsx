'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TarafRow = {
  id: number
  dosya_id: number
  sigorta_sirketi_id: number | null
  avukat_id: number | null
  karsitaraf_ad: string | null
  police_no: string | null
  karsitaraf_plaka: string | null
  karsitaraf_tc_vergi_no: string | null
  surucu_ad: string | null
  surucu_soyad: string | null
  surucu_plaka: string | null
  surucu_telefon: string | null
  surucu_police_no: string | null
  sigortaSirketi: {
    id: number
    ad: string
    mersis_no: string | null
    vergi_no: string
    bagli_oldugu_vergi_dairesi: string | null
    ihtar_mail: string | null
    kep_mail: string | null
  } | null
  avukat: {
    id: number
    ad: string
    tbb_sicil_no: string
    iban: string | null
    eposta: string | null
    telefon: string | null
  } | null
}

interface KarsitaraflarTabProps {
  dosyaId: number
  taraf: TarafRow | null
  karsitarafSirketAd?: string | null
}

const editSchema = z.object({
  sigorta_sirketi_id: z.number().int().nullable().optional(),
  avukat_id: z.number().int().nullable().optional(),
  surucu_ad: z.string().max(200).optional().or(z.literal('')),
  surucu_soyad: z.string().max(200).optional().or(z.literal('')),
  surucu_plaka: z.string().max(10).optional().or(z.literal('')),
  surucu_telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .optional()
    .or(z.literal('')),
  surucu_police_no: z.string().max(100).optional().or(z.literal('')),
  karsitaraf_tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
})

type EditValues = z.infer<typeof editSchema>

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}

export function KarsitaraflarTab({ dosyaId, taraf, karsitarafSirketAd }: KarsitaraflarTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: sigortaSirketiList } = useQuery(trpc.ayarlar.sigortaSirketi.list.queryOptions())

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      sigorta_sirketi_id: taraf?.sigorta_sirketi_id ?? null,
      avukat_id: taraf?.avukat_id ?? null,
      surucu_ad: taraf?.surucu_ad ?? '',
      surucu_soyad: taraf?.surucu_soyad ?? '',
      surucu_plaka: taraf?.surucu_plaka ?? '',
      surucu_telefon: taraf?.surucu_telefon ?? '',
      surucu_police_no: taraf?.surucu_police_no ?? '',
      karsitaraf_tc_vergi_no: taraf?.karsitaraf_tc_vergi_no ?? '',
    },
  })

  const selectedSirketId = form.watch('sigorta_sirketi_id')
  const { data: avukatList } = useQuery(
    trpc.ayarlar.avukat.bySirket.queryOptions(
      { sigorta_sirketi_id: selectedSirketId ?? 0 },
      { enabled: !!selectedSirketId }
    )
  )

  const isMounted = useRef(false)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    form.setValue('avukat_id', null)
  }, [selectedSirketId, form])

  const handleStartEditing = () => {
    isMounted.current = false
    form.reset({
      sigorta_sirketi_id: taraf?.sigorta_sirketi_id ?? null,
      avukat_id: taraf?.avukat_id ?? null,
      surucu_ad: taraf?.surucu_ad ?? '',
      surucu_soyad: taraf?.surucu_soyad ?? '',
      surucu_plaka: taraf?.surucu_plaka ?? '',
      surucu_telefon: taraf?.surucu_telefon ?? '',
      surucu_police_no: taraf?.surucu_police_no ?? '',
      karsitaraf_tc_vergi_no: taraf?.karsitaraf_tc_vergi_no ?? '',
    })
    setIsEditing(true)
  }

  const upsertMutation = useMutation(
    trpc.dosya.upsertTaraf.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dosya', 'getById', { id: dosyaId }] })
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        queryClient.invalidateQueries({ queryKey: ['dosya'] })
        toast.success('Kaydedildi.')
        setIsEditing(false)
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const onSubmit = (values: EditValues) => {
    upsertMutation.mutate({
      dosya_id: dosyaId,
      sigorta_sirketi_id: values.sigorta_sirketi_id ?? undefined,
      avukat_id: values.avukat_id ?? undefined,
      surucu_ad: values.surucu_ad || undefined,
      surucu_soyad: values.surucu_soyad || undefined,
      surucu_plaka: values.surucu_plaka || undefined,
      surucu_telefon: values.surucu_telefon || undefined,
      surucu_police_no: values.surucu_police_no || undefined,
      karsitaraf_tc_vergi_no: values.karsitaraf_tc_vergi_no || undefined,
    })
  }

  const isEmpty =
    !taraf ||
    (!taraf.avukat_id &&
      !taraf.sigorta_sirketi_id &&
      !taraf.surucu_ad &&
      !taraf.surucu_soyad &&
      !taraf.surucu_plaka &&
      !taraf.surucu_telefon &&
      !taraf.surucu_police_no)

  const hasDriverInfo = !!(
    taraf?.surucu_ad || taraf?.surucu_soyad ||
    taraf?.surucu_plaka || taraf?.surucu_telefon || taraf?.surucu_police_no
  )

  if (isEditing) {
    return (
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Karşı Taraf Sigorta Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="sigorta_sirketi_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karşı Sigorta Şirketi</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v, 10))}
                        value={field.value?.toString() ?? 'none'}
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
                <FormField
                  control={form.control}
                  name="avukat_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karşı Taraf Avukatı</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v, 10))}
                        value={!selectedSirketId ? '' : (field.value?.toString() ?? 'none')}
                        disabled={!selectedSirketId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedSirketId ? 'Avukat seçin...' : 'Önce sigorta şirketi seçin'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Yok / Bilinmiyor</SelectItem>
                          {avukatList?.map((a) => (
                            <SelectItem key={a.id} value={a.id.toString()}>
                              {a.ad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Karşı Taraf Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="surucu_ad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sürücü Adı</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surucu_soyad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sürücü Soyadı</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surucu_plaka"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plaka</FormLabel>
                        <FormControl><Input placeholder="34 ABC 123" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surucu_telefon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl><Input placeholder="05XXXXXXXXX" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground">Format: 05XXXXXXXXX</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surucu_police_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poliçe No</FormLabel>
                        <FormControl><Input placeholder="XXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="karsitaraf_tc_vergi_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TC / Vergi No</FormLabel>
                        <FormControl><Input placeholder="TC veya Vergi No" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Karşı Taraf Sigorta Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Karşı taraf bilgisi henüz girilmedi.</p>
          <Button variant="outline" onClick={handleStartEditing}>
            Düzenle
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Karşı Sigorta Şirketi</CardTitle>
          <Button variant="outline" size="sm" onClick={handleStartEditing}>
            Düzenle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Şirket Adı" value={taraf?.sigortaSirketi?.ad ?? karsitarafSirketAd} />
            <InfoRow label="Vergi No" value={taraf?.sigortaSirketi?.vergi_no} />
            <InfoRow label="Mersis No" value={taraf?.sigortaSirketi?.mersis_no} />
            <InfoRow label="Bağlı Olduğu Vergi Dairesi" value={taraf?.sigortaSirketi?.bagli_oldugu_vergi_dairesi} />
            <InfoRow label="İhtar Mail" value={taraf?.sigortaSirketi?.ihtar_mail} />
            <InfoRow label="KEP Mail" value={taraf?.sigortaSirketi?.kep_mail} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Karşı Taraf Avukatı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Ad" value={taraf?.avukat?.ad ?? null} />
            <InfoRow label="TBB Sicil No" value={taraf?.avukat?.tbb_sicil_no} />
            <InfoRow label="Telefon" value={taraf?.avukat?.telefon} />
            <InfoRow label="E-posta" value={taraf?.avukat?.eposta} />
            <InfoRow label="IBAN" value={taraf?.avukat?.iban} />
          </div>
        </CardContent>
      </Card>
      {hasDriverInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Karşı Taraf Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Sürücü Adı" value={taraf?.surucu_ad} />
              <InfoRow label="Sürücü Soyadı" value={taraf?.surucu_soyad} />
              <InfoRow label="Plaka" value={taraf?.surucu_plaka} />
              <InfoRow label="Telefon" value={taraf?.surucu_telefon} />
              <InfoRow label="Poliçe No" value={taraf?.surucu_police_no} />
              <InfoRow label="TC / Vergi No" value={taraf?.karsitaraf_tc_vergi_no} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
