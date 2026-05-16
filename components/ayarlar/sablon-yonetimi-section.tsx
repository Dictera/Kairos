'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { Plus, Upload, Trash2, X } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VariableCatalogModal } from './variable-catalog-modal'
import { Badge } from '@/components/ui/badge'
// WARN-3 fix: canonical kategori tuple from Drizzle schema (single source of truth);
// do NOT redeclare locally. Plan 01 exports this as `as const`.
import { SABLON_KATEGORILER, BELGE_KATEGORILER } from '@/lib/schema'

const sablonFormSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  kategori: z.enum(SABLON_KATEGORILER),
  belge_turu: z.enum(BELGE_KATEGORILER).optional(),
})
type SablonFormValues = z.infer<typeof sablonFormSchema>

export default function SablonYonetimiSection() {
  const trpc = useTRPC()
  const qc = useQueryClient()

  const listOpts = trpc.sablon.list.queryOptions()
  const { data: templates = [], isLoading } = useQuery(listOpts)
  const invalidate = () => qc.invalidateQueries({ queryKey: listOpts.queryKey })

  const [filterKategori, setFilterKategori] = useState<string>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [overwriteTarget, setOverwriteTarget] = useState<(typeof templates)[number] | null>(null)
  const [overwriteBelgeTuru, setOverwriteBelgeTuru] = useState<(typeof BELGE_KATEGORILER)[number] | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<(typeof templates)[number] | null>(null)
  const [catalogTarget, setCatalogTarget] = useState<(typeof templates)[number] | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<SablonFormValues>({
    resolver: zodResolver(sablonFormSchema),
    defaultValues: { ad: '', kategori: 'STK', belge_turu: undefined },
  })

  const createSablon = useMutation(
    trpc.sablon.create.mutationOptions({
      onSuccess: () => {
        invalidate()
        toast.success('Şablon yüklendi.')
        resetUpload()
      },
      onError: (e) => toast.error(e.message ?? 'Yükleme başarısız. Lütfen tekrar deneyin.'),
    })
  )

  const updateSablon = useMutation(
    trpc.sablon.update.mutationOptions({
      onSuccess: () => {
        invalidate()
        toast.success('Şablon güncellendi.')
        setOverwriteTarget(null)
        setFile(null)
      },
      onError: (e) => toast.error(e.message ?? 'Yükleme başarısız. Lütfen tekrar deneyin.'),
    })
  )

  const deleteSablon = useMutation(
    trpc.sablon.delete.mutationOptions({
      onSuccess: () => {
        invalidate()
        toast.success('Şablon silindi.')
        setDeleteTarget(null)
      },
      onError: () => toast.error('Silme başarısız. Lütfen tekrar deneyin.'),
    })
  )

  function resetUpload() {
    setUploadOpen(false)
    setFile(null)
    form.reset({ ad: '', kategori: 'STK', belge_turu: undefined })
  }

  async function uploadFileAndGetPath(f: File): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/templates/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Yükleme başarısız. Lütfen tekrar deneyin.')
    }
    return res.json()
  }

  async function onCreateSubmit(values: SablonFormValues) {
    if (!file) return
    setUploading(true)
    try {
      const { filePath, fileName, fileSize } = await uploadFileAndGetPath(file)
      await createSablon.mutateAsync({ ad: values.ad, kategori: values.kategori, belge_turu: values.belge_turu, filePath, fileName, fileSize })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Yükleme başarısız. Lütfen tekrar deneyin.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  async function onOverwriteSubmit() {
    if (!overwriteTarget || !file) return
    setUploading(true)
    try {
      const { filePath, fileName } = await uploadFileAndGetPath(file)
      await updateSablon.mutateAsync({ id: overwriteTarget.id, belge_turu: overwriteBelgeTuru, filePath, fileName })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Yükleme başarısız. Lütfen tekrar deneyin.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(f: File | null) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.docx')) {
      toast.error('Sadece .docx dosyaları kabul edilir.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10 MB'ı aşamaz.")
      return
    }
    setFile(f)
  }

  const filtered = templates.filter(
    (t) => filterKategori === 'all' || t.kategori === filterKategori
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Şablon Yönetimi</CardTitle>
          <CardAction>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Şablon Yükle
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category filter */}
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tüm Kategoriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {SABLON_KATEGORILER.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && templates.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Henüz şablon eklenmedi.
            </p>
          )}

          {/* Table */}
          {!isLoading && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Değişkenler</TableHead>
                  <TableHead>Yüklenme Tarihi</TableHead>
                  <TableHead className="w-24 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setCatalogTarget(t)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCatalogTarget(t) } }}
                  >
                    <TableCell>{t.ad}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.kategori}</Badge>
                      {t.belge_turu && (
                        <Badge variant="secondary" className="ml-1">{t.belge_turu}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{t.degiskenler.length}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9"
                          aria-label="Şablonu değiştir"
                          onClick={() => { setOverwriteTarget(t); setOverwriteBelgeTuru(t.belge_turu as (typeof BELGE_KATEGORILER)[number] | undefined ?? undefined) }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          aria-label="Şablonu sil"
                          onClick={() => setDeleteTarget(t)}
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
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) resetUpload() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablon Yükle</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateSubmit)}
              className="space-y-4 py-2 min-w-0"
            >
              <FormField
                control={form.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Şablon Adı <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Şablon adı..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kategori"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kategori <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SABLON_KATEGORILER.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
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
                name="belge_turu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Belge Türü</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Belge türü seçin (isteğe bağlı)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BELGE_KATEGORILER.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Belge türü seçilirse üretilen PDF bu türle adlandırılır (örn. İhtarname.pdf). Seçilmezse şablon adı kullanılır.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Drop zone */}
              <div className="space-y-2">
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors relative">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">.docx dosyasını sürükle &amp; bırak veya tıkla</p>
                  <p className="text-xs text-muted-foreground mt-1">Maks. 10 MB</p>
                  <input
                    type="file"
                    accept=".docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </div>
                {file && (
                  <div className="flex items-center justify-between rounded border px-3 py-2 text-sm min-w-0">
                    <span className="truncate text-muted-foreground flex-1 min-w-0">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="ml-2 h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setFile(null)}
                      aria-label="Dosya seçimini kaldır"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={!file || uploading}
                >
                  {uploading ? 'Yükleniyor...' : 'Şablon Yükle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Overwrite Dialog */}
      <Dialog
        open={overwriteTarget !== null}
        onOpenChange={(open) => { if (!open) { setOverwriteTarget(null); setFile(null); setOverwriteBelgeTuru(undefined) } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu Değiştir</DialogTitle>
          </DialogHeader>
          {overwriteTarget && (
            <div className="space-y-4 py-2 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                <strong>{overwriteTarget.ad}</strong> — {overwriteTarget.kategori}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Belge Türü</label>
                <Select
                  value={overwriteBelgeTuru}
                  onValueChange={(v) => setOverwriteBelgeTuru(v as (typeof BELGE_KATEGORILER)[number] | undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Belge türü seçin (isteğe bağlı)" />
                  </SelectTrigger>
                  <SelectContent>
                    {BELGE_KATEGORILER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors relative">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">.docx dosyasını sürükle &amp; bırak veya tıkla</p>
                  <p className="text-xs text-muted-foreground mt-1">Maks. 10 MB</p>
                  <input
                    type="file"
                    accept=".docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </div>
              {file && (
                <div className="flex items-center justify-between rounded border px-3 py-2 text-sm min-w-0">
                  <span className="truncate text-muted-foreground flex-1 min-w-0">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="ml-2 h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setFile(null)}
                    aria-label="Dosya seçimini kaldır"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => { setOverwriteTarget(null); setFile(null) }}
                  disabled={uploading}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  disabled={!file || uploading}
                  onClick={onOverwriteSubmit}
                >
                  {uploading ? 'Yükleniyor...' : 'Şablonu Değiştir'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şablonu silmek istediğinize emin misiniz? Bu şablondan üretilmiş belgeler silinmeyecek, ancak şablon referansı kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await deleteSablon.mutateAsync({ id: deleteTarget.id })
                }
              }}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VariableCatalogModal
        sablon={catalogTarget}
        onOpenChange={(open) => { if (!open) setCatalogTarget(null) }}
      />
    </>
  )
}