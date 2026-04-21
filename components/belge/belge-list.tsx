'use client'

import { useMemo, type ElementType } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FileIcon, Download, Trash2, FileText, Scale, Shield, Briefcase, Users, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Icon mapping for document categories
const kategoriIcons: Record<string, ElementType> = {
  'Dilekçe': FileText,
  'Karar': Scale,
  'Poliçe': Shield,
  'Sigorta poliçesi': Shield,
  'Hasar dosyası': Briefcase,
  'Vekaletname': Users,
  'Diğer': MoreHorizontal,
}

// Color mapping for badges (using muted style)
const kategoriColors: Record<string, string> = {
  'Dilekçe': 'bg-blue-100 text-blue-800',
  'Karar': 'bg-purple-100 text-purple-800',
  'Poliçe': 'bg-green-100 text-green-800',
  'Sigorta poliçesi': 'bg-green-100 text-green-800',
  'Hasar dosyası': 'bg-orange-100 text-orange-800',
  'Vekaletname': 'bg-pink-100 text-pink-800',
  'Diğer': 'bg-gray-100 text-gray-800',
}

interface BelgeListProps {
  dosyaId: number
}

export function BelgeList({ dosyaId }: BelgeListProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const { data: belgeler, isLoading } = useQuery(
    trpc.belge.list.queryOptions({ dosya_id: dosyaId })
  )

  const { data: templates = [] } = useQuery(trpc.sablon.list.queryOptions())
  const templateById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  )

  const deleteMutation = useMutation(
    trpc.belge.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('Belge silindi')
      },
      onError: (err) => {
        toast.error('Silme başarısız: ' + (err.message || 'Bilinmeyen hata'))
      }
    })
  )
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  
  if (!belgeler || belgeler.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium mb-2">Bu dosyaya henüz belge eklenmedi</p>
        <p className="text-sm">Dosya sekmesindeki yükleme alanını kullanın</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {belgeler.map((belge) => {
        const isGenerated = belge.sablon_id != null
        const sablonAdi = isGenerated && belge.sablon_id != null ? templateById.get(belge.sablon_id)?.ad : undefined
        const seqMatch = belge.dosya_adi.match(/-(\d+)\.pdf$/i)
        const seq = seqMatch?.[1]
        const Icon = isGenerated ? FileText : (kategoriIcons[belge.kategori] || FileIcon)
        const colorClass = kategoriColors[belge.kategori] || 'bg-gray-100 text-gray-800'
        const fileUrl = belge.dosya_yolu.startsWith('/') ? belge.dosya_yolu : `/${belge.dosya_yolu}`

        return (
          <div
            key={belge.id}
            className={cn(
              "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors",
              isGenerated && "border-l-4 border-l-[var(--accent)]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium truncate">{belge.dosya_adi}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={colorClass} variant="secondary">
                    {belge.kategori}
                  </Badge>
                  {isGenerated && (
                    <span className="text-[var(--accent)]">
                      Şablon: {sablonAdi ?? '—'}{seq ? ` • #${seq}` : ''}
                    </span>
                  )}
                  <span>{format(new Date(belge.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                  <span>{(belge.dosya_boyutu / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Belge Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu belgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: belge.id })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )
      })}
    </div>
  )
}
