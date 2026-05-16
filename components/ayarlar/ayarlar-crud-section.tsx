'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AyarlarItem {
  id: number
  ad: string
  sehir?: string | null
}

interface AyarlarCrudSectionProps {
  title: string
  description?: string
  items: AyarlarItem[] | undefined
  isLoading: boolean
  onAdd: (values: { ad: string; sehir?: string }) => Promise<void>
  onEdit: (id: number, values: { ad: string; sehir?: string }) => Promise<void>
  onDelete: (id: number) => Promise<void>
  showSehir?: boolean
}

export function AyarlarCrudSection({
  title,
  description,
  items,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  showSehir = false,
}: AyarlarCrudSectionProps) {
  const [open, setOpen] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AyarlarItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AyarlarItem | null>(null)
  const [formAd, setFormAd] = useState('')
  const [formSehir, setFormSehir] = useState('')
  const [adError, setAdError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function openAdd() {
    setEditingItem(null)
    setFormAd('')
    setFormSehir('')
    setAdError(false)
    setDialogOpen(true)
  }

  function openEdit(item: AyarlarItem) {
    setEditingItem(item)
    setFormAd(item.ad)
    setFormSehir(item.sehir ?? '')
    setAdError(false)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingItem(null)
    setFormAd('')
    setFormSehir('')
    setAdError(false)
  }

  async function handleSubmit() {
    if (formAd.trim().length === 0) {
      setAdError(true)
      return
    }
    setAdError(false)
    setSubmitting(true)
    try {
      const values = {
        ad: formAd.trim(),
        ...(showSehir ? { sehir: formSehir.trim() || undefined } : {}),
      }
      if (editingItem) {
        await onEdit(editingItem.id, values)
      } else {
        await onAdd(values)
      }
      toast.success('Kaydedildi.')
      closeDialog()
    } catch {
      toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await onDelete(deleteTarget.id)
      toast.success('Silindi.')
    } catch {
      toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          <CardAction>
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Ekle
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="h-8 w-8" aria-label="Aç/kapat">
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>
        <CollapsibleContent>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : !items || items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Henüz kayıt eklenmedi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  {showSehir && <TableHead>Şehir</TableHead>}
                  <TableHead className="w-24 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ad}</TableCell>
                    {showSehir && (
                      <TableCell className="text-muted-foreground">
                        {item.sehir ?? '—'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9"
                          onClick={() => openEdit(item)}
                          aria-label={`${item.ad} düzenle`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`${item.ad} sil`}
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
        </CollapsibleContent>
      </Card>
      </Collapsible>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Kaydı Düzenle' : `${title} Ekle`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-ad">Ad</Label>
              <Input
                id="form-ad"
                value={formAd}
                onChange={(e) => {
                  setFormAd(e.target.value)
                  if (e.target.value.trim().length > 0) setAdError(false)
                }}
                placeholder="Ad giriniz..."
              />
              {adError && (
                <p className="text-sm text-destructive">Ad zorunludur.</p>
              )}
            </div>
            {showSehir && (
              <div className="space-y-1.5">
                <Label htmlFor="form-sehir">Şehir</Label>
                <Input
                  id="form-sehir"
                  value={formSehir}
                  onChange={(e) => setFormSehir(e.target.value)}
                  placeholder="Şehir (opsiyonel)"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kaydı silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
