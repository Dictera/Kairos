'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ArrowDownCircle, ArrowUpCircle, Receipt, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FinansForm } from './finans-form'
import { toast } from 'sonner'

// Icon per type
const typeIcons = {
  Gelen: ArrowDownCircle,
  Giden: ArrowUpCircle,
  Masraf: Receipt,
}

// Color per type
const typeColors = {
  Gelen: 'text-green-600',
  Giden: 'text-red-600',
  Masraf: 'text-orange-600',
}

interface FinansEntryListProps {
  dosyaId: number
}

export function FinansEntryList({ dosyaId }: FinansEntryListProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [editId, setEditId] = useState<number | null>(null)
  
  const { data: entries, isLoading } = useQuery(
    trpc.finans.list.queryOptions({ dosya_id: dosyaId })
  )
  
  const deleteMutation = useMutation(
    trpc.finans.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.finans.list.queryKey({ dosya_id: dosyaId }) })
        queryClient.invalidateQueries({ queryKey: trpc.finans.getSummary.queryKey({ dosya_id: dosyaId }) })
        toast.success('Finans kaydı silindi')
      },
      onError: (err) => toast.error('Silme başarısız: ' + (err.message || 'Bilinmeyen hata'))
    })
  )
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">Bu dosya için henüz finans kaydı yok</p>
      </div>
    )
  }
  
  const sortedEntries = entries.toSorted((a, b) => {
    return parseISO(b.tarih).getTime() - parseISO(a.tarih).getTime()
  })
  
  return (
    <div className="space-y-2">
      {sortedEntries.map((entry) => {
        const Icon = typeIcons[entry.tur as keyof typeof typeIcons] || Receipt
        const colorClass = typeColors[entry.tur as keyof typeof typeColors] || 'text-gray-600'
        const isEditing = editId === entry.id
        
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            {isEditing ? (
              <div className="flex-1">
                <FinansForm
                  dosyaId={dosyaId}
                  editId={entry.id}
                  initialData={{
                    tur: entry.tur as 'Gelen' | 'Giden' | 'Masraf',
                    tutar: entry.tutar,
                    tarih: entry.tarih,
                    aciklama: entry.aciklama ?? undefined,
                    odeme_asamasi: entry.odeme_asamasi as 'İhtar' | 'Arabulucu' | 'Bilirkişi' | 'İcra' | null,
                  }}
                  onCancel={() => setEditId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <div>
                    <p className="font-medium">
                      {entry.tur === 'Gelen' ? 'Gelen' : entry.tur === 'Giden' ? 'Giden' : 'Masraf'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                      {format(new Date(entry.tarih), 'dd MMM yyyy', { locale: tr })}
                      {entry.aciklama && ` • ${entry.aciklama}`}
                      {entry.odeme_asamasi && (
                        <Badge variant="outline" className="ml-1 text-xs">{entry.odeme_asamasi}</Badge>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${colorClass}`}>
                    {entry.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditId(entry.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Finans Kaydını Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu finans kaydını silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate({ id: entry.id })}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
