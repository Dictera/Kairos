'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowUpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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

export function UpdateBanner() {
  const trpc = useTRPC()
  const [restarting, setRestarting] = useState(false)

  const { data } = useQuery({
    ...trpc.update.getStatus.queryOptions(),
    // Açılışta + saatte bir kontrol
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const apply = useMutation(
    trpc.update.run.mutationOptions({
      onSuccess: (res) => {
        if (res.restarting) {
          setRestarting(true)
          pollUntilBack()
        } else if (res.ok) {
          toast.success(res.message)
        } else {
          toast.error(res.message)
        }
      },
      onError: () => toast.error('Güncelleme başlatılamadı.'),
    }),
  )

  // Sunucu yeniden başlayınca (HTTP 200) sayfayı yenile
  function pollUntilBack() {
    const tick = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        if (r.ok) {
          window.location.reload()
          return
        }
      } catch {
        // sunucu henüz kapalı/yeniden başlıyor
      }
      setTimeout(tick, 2500)
    }
    setTimeout(tick, 4000)
  }

  if (restarting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Güncelleme uygulanıyor, sunucu yeniden başlatılıyor…</p>
        <p className="text-xs text-muted-foreground">Bu birkaç dakika sürebilir, sayfayı kapatmayın.</p>
      </div>
    )
  }

  if (!data || !data.supported || !data.updateAvailable) return null

  return (
    <div className="bg-accent/10 border border-accent/30 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <ArrowUpCircle className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm font-medium">
            Yeni sürüm mevcut ({data.behind} güncelleme geride){data.offline ? ' — çevrimdışı' : ''}.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="default" disabled={apply.isPending}>
              {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Güncelle'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Uygulamayı güncelle?</AlertDialogTitle>
              <AlertDialogDescription>
                {data.managed
                  ? 'Güncelleme indirilip kurulacak ve sunucu otomatik yeniden başlatılacaktır. Veritabanınız yedeklenir. İşlem birkaç dakika sürebilir.'
                  : 'Güncelleme planlanacak. Uygulamayı kapatıp start-kairos ile yeniden başlattığınızda uygulanacaktır.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={() => apply.mutate()}>Güncelle</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
