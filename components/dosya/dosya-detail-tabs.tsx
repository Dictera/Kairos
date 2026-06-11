'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FolderOpen } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import Link from 'next/link'
import { GenelBilgilerTab } from './genel-bilgiler-tab'
import { KarsitaraflarTab } from './karsitaraflar-tab'
import { YargilamaSureciTab } from './yargilama-sureci-tab'
import { BelgeUpload } from '@/components/belge/belge-upload'
import { BelgeList } from '@/components/belge/belge-list'
import { SablondanUret } from '@/components/belge/sablondan-uret'
import { FinansForm } from '@/components/finans/finans-form'
import { FinansSummary } from '@/components/finans/finans-summary'
import { FinansEntryList } from '@/components/finans/finans-entry-list'
import { NotList } from './not-list'
import { Timeline } from './timeline'

interface DosyaDetailTabsProps {
  dosyaId: number
}

export function DosyaDetailTabs({ dosyaId }: DosyaDetailTabsProps) {
  // Read the URL hash once at mount via lazy init (no extra render).
  // Guarded for SSR — the loading skeleton renders first, so there is no
  // hydration mismatch by the time the tabs appear.
  const [activeTab, setActiveTab] = useState(() =>
    typeof window === 'undefined'
      ? 'genel-bilgiler'
      : window.location.hash.slice(1) || 'genel-bilgiler'
  )
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(trpc.dosya.getById.queryOptions({ id: dosyaId }))

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    window.history.replaceState(null, '', '#' + value)
  }

  const archiveMutation = useMutation(
    trpc.dosya.archive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success('Dosya arşivlendi.')
        router.push('/dosyalar')
      },
      onError: () => toast.error('Arşivlenemedi. Lütfen tekrar deneyin.'),
    })
  )

  const deleteMutation = useMutation(
    trpc.dosya.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya']] })
        toast.success('Silindi.')
        router.push('/dosyalar')
      },
      onError: () => toast.error('Silinemedi. Lütfen tekrar deneyin.'),
    })
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Dosya bulunamadı.</p>
  }

  const primaryTaraf = data.taraflar?.[0] ?? null

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold flex-1">{data.dosya_no}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetch(`/api/open-folder?dosyaId=${dosyaId}`)}
          title="Klasörde göster"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/dosyalar/${dosyaId}/duzenle`}>Düzenle</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              İşlemler
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              Arşivle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Archive confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dosyayı arşivle</AlertDialogTitle>
            <AlertDialogDescription>
              Bu dosya arşivlenecek. Arşivlenen dosyalar listede &quot;Arşivlenmiş&quot; olarak
              görünür ve tekrar aktif hale getirilebilir.
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

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dosyayı sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Dosya ve ilişkili tüm kayıtlar kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: dosyaId })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs (D-14 order) */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="genel-bilgiler">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="yargilama-sureci">Yargılama Süreci</TabsTrigger>
          <TabsTrigger value="belgeler">Belgeler</TabsTrigger>
          <TabsTrigger value="notlar">Notlar / Zaman Çizelgesi</TabsTrigger>
          <TabsTrigger value="karsitaraflar">Karşı Taraflar</TabsTrigger>
          <TabsTrigger value="dosya-finansi">Dosya Finansı</TabsTrigger>
        </TabsList>

        <TabsContent value="genel-bilgiler" className="mt-4">
          <GenelBilgilerTab dosya={data as Parameters<typeof GenelBilgilerTab>[0]['dosya']} />
        </TabsContent>

        <TabsContent value="yargilama-sureci" className="mt-4">
          <YargilamaSureciTab
            dosyaId={dosyaId}
            dosyaTur={data.tur}
            surecDetayRaw={data.surec_detay ?? null}
          />
        </TabsContent>

        <TabsContent value="belgeler" className="mt-4 space-y-4">
          <SablondanUret dosyaId={dosyaId} />
          <Separator />
          <BelgeUpload dosyaId={dosyaId} dosyaNo={data.dosya_no} />
          <Separator />
          <BelgeList dosyaId={dosyaId} />
        </TabsContent>

        <TabsContent value="notlar" className="mt-4 space-y-6">
          <NotList dosyaId={dosyaId} />
          <Separator />
          <Timeline dosyaId={dosyaId} />
        </TabsContent>

        <TabsContent value="karsitaraflar" className="mt-4">
          <KarsitaraflarTab
            dosyaId={dosyaId}
            taraf={primaryTaraf}
            karsitarafSirketAd={data.karsitarafSigorta?.ad}
          />
        </TabsContent>

        <TabsContent value="dosya-finansi" className="mt-4 space-y-6">
          <FinansSummary dosyaId={dosyaId} />
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Yeni Finans Kaydı</h3>
            <FinansForm dosyaId={dosyaId} />
          </div>
          <FinansEntryList dosyaId={dosyaId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
