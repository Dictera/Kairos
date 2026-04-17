'use client'

import { Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { sigortaSirketiSchema } from '@/lib/validators/ayarlar'
import { AvukatFormDialog } from './avukat-form-dialog'

type SigortaSirketiRow = NonNullable<
  Awaited<ReturnType<ReturnType<typeof useTRPC>['ayarlar']['sigortaSirketi']['listWithAvukatlar']['queryOptions']>>
> extends { queryFn: () => Promise<infer T> } ? T extends Array<infer U> ? U : never : never

// Use a simpler inline type from the query data
type ListItem = {
  id: number
  ad: string
  mersis_no: string | null
  vergi_no: string
  bagli_oldugu_vergi_dairesi: string | null
  ihtar_mail: string | null
  kep_mail: string | null
  avukatlar: Array<{
    avukat: {
      id: number
      ad: string
      tbb_sicil_no: string
      iban: string | null
      eposta: string | null
      telefon: string | null
    }
  }>
}

type AvukatRow = ListItem['avukatlar'][number]['avukat']

export function SigortaSirketiSection() {
  const trpc = useTRPC()
  const qc = useQueryClient()

  const listOpts = trpc.ayarlar.sigortaSirketi.listWithAvukatlar.queryOptions()
  const { data: list, isLoading } = useQuery(listOpts)

  const invalidate = () => qc.invalidateQueries({ queryKey: listOpts.queryKey })

  const createSirketi = useMutation(
    trpc.ayarlar.sigortaSirketi.create.mutationOptions({
      onSuccess: () => { invalidate(); toast.success('Kaydedildi.') },
      onError: () => toast.error('Kaydedilemedi. Lütfen tekrar deneyin.'),
    })
  )
  const updateSirketi = useMutation(
    trpc.ayarlar.sigortaSirketi.update.mutationOptions({
      onSuccess: () => { invalidate(); toast.success('Kaydedildi.') },
      onError: () => toast.error('Kaydedilemedi. Lütfen tekrar deneyin.'),
    })
  )
  const deleteSirketi = useMutation(
    trpc.ayarlar.sigortaSirketi.delete.mutationOptions({
      onSuccess: () => { invalidate(); toast.success('Silindi.') },
      onError: () => toast.error('Silinemedi.'),
    })
  )
  const removeAvukat = useMutation(
    trpc.ayarlar.avukat.removeSirket.mutationOptions({
      onSuccess: () => { invalidate(); toast.success('Silindi.') },
      onError: () => toast.error('Silinemedi.'),
    })
  )

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [sirketiDialogOpen, setSirketiDialogOpen] = useState(false)
  const [editingSirketi, setEditingSirketi] = useState<ListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ListItem | null>(null)
  const [avukatDialogOpen, setAvukatDialogOpen] = useState(false)
  const [avukatDialogContext, setAvukatDialogContext] = useState<{
    mode: 'create' | 'edit'
    sirketiId: number
    avukat?: AvukatRow
  } | null>(null)
  const [avukatDeleteTarget, setAvukatDeleteTarget] = useState<{
    avukatId: number
    sirketiId: number
    avukatAd: string
  } | null>(null)

  const form = useForm<z.infer<typeof sigortaSirketiSchema>>({
    resolver: zodResolver(sigortaSirketiSchema),
    defaultValues: {
      ad: '',
      mersis_no: '',
      vergi_no: '',
      bagli_oldugu_vergi_dairesi: '',
      ihtar_mail: '',
      kep_mail: '',
    },
  })

  function openAddDialog() {
    setEditingSirketi(null)
    form.reset({
      ad: '',
      mersis_no: '',
      vergi_no: '',
      bagli_oldugu_vergi_dairesi: '',
      ihtar_mail: '',
      kep_mail: '',
    })
    setSirketiDialogOpen(true)
  }

  function openEditDialog(sirketi: ListItem) {
    setEditingSirketi(sirketi)
    form.reset({
      ad: sirketi.ad,
      mersis_no: sirketi.mersis_no ?? '',
      vergi_no: sirketi.vergi_no,
      bagli_oldugu_vergi_dairesi: sirketi.bagli_oldugu_vergi_dairesi ?? '',
      ihtar_mail: sirketi.ihtar_mail ?? '',
      kep_mail: sirketi.kep_mail ?? '',
    })
    setSirketiDialogOpen(true)
  }

  const onSubmitSirketi = (values: z.infer<typeof sigortaSirketiSchema>) => {
    if (editingSirketi) {
      updateSirketi.mutate(
        { id: editingSirketi.id, ...values },
        { onSuccess: () => setSirketiDialogOpen(false) }
      )
    } else {
      createSirketi.mutate(values, { onSuccess: () => setSirketiDialogOpen(false) })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Sigorta Şirketleri</CardTitle>
          <CardAction>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-1 h-4 w-4" />
              Sigorta Şirketi Ekle
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : !list || list.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Henüz kayıt eklenmedi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Vergi No</TableHead>
                  <TableHead>İhtar Mail</TableHead>
                  <TableHead className="w-36 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list as ListItem[]).map((sirketi) => (
                  <Fragment key={sirketi.id}>
                    <TableRow>
                      <TableCell>{sirketi.ad}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sirketi.vergi_no || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sirketi.ihtar_mail || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-9 w-9"
                            aria-label={`${sirketi.ad} avukatları göster/gizle`}
                            aria-expanded={expandedId === sirketi.id}
                            onClick={() =>
                              setExpandedId(expandedId === sirketi.id ? null : sirketi.id)
                            }
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform duration-150',
                                expandedId === sirketi.id && 'rotate-180'
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-9 w-9"
                            aria-label={`${sirketi.ad} düzenle`}
                            onClick={() => openEditDialog(sirketi)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            aria-label={`${sirketi.ad} sil`}
                            onClick={() => setDeleteTarget(sirketi)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedId === sirketi.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-0">
                          <div className="ml-8 border-l-2 border-primary/20 pl-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold">Avukatlar</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAvukatDialogContext({
                                    mode: 'create',
                                    sirketiId: sirketi.id,
                                  })
                                  setAvukatDialogOpen(true)
                                }}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Avukat Ekle
                              </Button>
                            </div>
                            {sirketi.avukatlar.length === 0 ? (
                              <p className="py-3 text-center text-sm text-muted-foreground">
                                Bu şirkete bağlı avukat bulunmuyor.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Ad</TableHead>
                                    <TableHead>TBB Sicil No</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead className="w-24 text-right">İşlemler</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sirketi.avukatlar.map((link) => (
                                    <TableRow key={link.avukat.id}>
                                      <TableCell>{link.avukat.ad}</TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {link.avukat.tbb_sicil_no}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {link.avukat.telefon || '—'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-9 w-9"
                                            aria-label={`${link.avukat.ad} düzenle`}
                                            onClick={() => {
                                              setAvukatDialogContext({
                                                mode: 'edit',
                                                sirketiId: sirketi.id,
                                                avukat: link.avukat,
                                              })
                                              setAvukatDialogOpen(true)
                                            }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-9 w-9 text-destructive hover:text-destructive"
                                            aria-label={`${link.avukat.ad} sil`}
                                            onClick={() =>
                                              setAvukatDeleteTarget({
                                                avukatId: link.avukat.id,
                                                sirketiId: sirketi.id,
                                                avukatAd: link.avukat.ad,
                                              })
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sigorta Şirketi Add/Edit Dialog */}
      <Dialog open={sirketiDialogOpen} onOpenChange={setSirketiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSirketi ? 'Sigorta Şirketi Düzenle' : 'Sigorta Şirketi Ekle'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSirketi)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Sigorta şirketi adı..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vergi_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi No <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="VKN (10 hane) veya TCKN (11 hane)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mersis_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MERSİS No</FormLabel>
                    <FormControl>
                      <Input placeholder="MERSİS numarası (opsiyonel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bagli_oldugu_vergi_dairesi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi Dairesi</FormLabel>
                    <FormControl>
                      <Input placeholder="Bağlı olduğu vergi dairesi (opsiyonel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ihtar_mail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İhtar Mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ihtar@sigorta.com (opsiyonel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kep_mail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KEP Mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="kep@sigorta.com (opsiyonel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSirketiDialogOpen(false)}
                  disabled={createSirketi.isPending || updateSirketi.isPending}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createSirketi.isPending || updateSirketi.isPending}
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Sigorta Şirketi Delete AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sigorta şirketini silmek istediğinize emin misiniz? Bağlı avukatlar listeden kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) {
                  await deleteSirketi.mutateAsync({ id: deleteTarget.id })
                  setDeleteTarget(null)
                }
              }}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avukat Delete AlertDialog */}
      <AlertDialog
        open={avukatDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setAvukatDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avukatı Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              {avukatDeleteTarget?.avukatAd} adlı avukatı bu şirketten kaldırmak istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (avukatDeleteTarget) {
                  await removeAvukat.mutateAsync({
                    avukat_id: avukatDeleteTarget.avukatId,
                    sigorta_sirketi_id: avukatDeleteTarget.sirketiId,
                  })
                  setAvukatDeleteTarget(null)
                }
              }}
            >
              Evet, Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avukat Form Dialog */}
      {avukatDialogContext && (
        <AvukatFormDialog
          open={avukatDialogOpen}
          onOpenChange={setAvukatDialogOpen}
          mode={avukatDialogContext.mode}
          sigortaSirketiId={avukatDialogContext.sirketiId}
          defaultValues={
            avukatDialogContext.avukat
              ? {
                  id: avukatDialogContext.avukat.id,
                  ad: avukatDialogContext.avukat.ad,
                  tbb_sicil_no: avukatDialogContext.avukat.tbb_sicil_no,
                  iban: avukatDialogContext.avukat.iban,
                  eposta: avukatDialogContext.avukat.eposta,
                  telefon: avukatDialogContext.avukat.telefon,
                }
              : undefined
          }
          onSuccess={invalidate}
        />
      )}
    </>
  )
}
