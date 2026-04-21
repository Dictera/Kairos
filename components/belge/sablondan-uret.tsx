'use client'

import { useState, useRef, useEffect } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SablondanUretProps {
  dosyaId: number
}

export function SablondanUret({ dosyaId }: SablondanUretProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<'all' | 'STK' | 'Mahkeme' | 'Genel'>('all')
  const [selected, setSelected] = useState<(Awaited<ReturnType<typeof trpc.sablon.list.queryOptions>>[number]) | null>(null)
  const [progressOpen, setProgressOpen] = useState(false)
  const [step, setStep] = useState<'idle' | 'render' | 'convert' | 'archive'>('idle')

  const tick1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tick2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: templates = [], isLoading } = useQuery(trpc.sablon.list.queryOptions())

  const generateMutation = useMutation(
    trpc.pdf.generate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('PDF üretildi.')
        resetProgress()
      },
      onError: (err) => {
        toast.error(err.message)
        resetProgress()
      },
    })
  )

  function startGeneration() {
    if (!selected) return
    setProgressOpen(true)
    setStep('render')
    tick1Ref.current = setTimeout(() => setStep('convert'), 1200)
    tick2Ref.current = setTimeout(() => setStep('archive'), 2400)
    generateMutation.mutate({ dosyaId, sablonId: selected.id })
  }

  function resetProgress() {
    setProgressOpen(false)
    setStep('idle')
    setSelected(null)
    if (tick1Ref.current) clearTimeout(tick1Ref.current)
    if (tick2Ref.current) clearTimeout(tick2Ref.current)
  }

  useEffect(() => () => {
    if (tick1Ref.current) clearTimeout(tick1Ref.current)
    if (tick2Ref.current) clearTimeout(tick2Ref.current)
  }, [])

  const filtered = templates.filter(t => filter === 'all' || t.kategori === filter)

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Şablondan Belge Üret</h3>
      </div>

      {/* Category filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="STK">STK</TabsTrigger>
          <TabsTrigger value="Mahkeme">Mahkeme</TabsTrigger>
          <TabsTrigger value="Genel">Genel</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Searchable template selector */}
      <Command className="border rounded-md">
        <CommandInput placeholder="Şablon ara…" />
        <CommandList>
          <CommandEmpty>Şablon bulunamadı.</CommandEmpty>
          {isLoading ? (
            <>
              <div className="p-2">
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="p-2">
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="p-2">
                <Skeleton className="h-8 w-full" />
              </div>
            </>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Henüz şablon eklenmedi.
            </div>
          ) : (
            filtered.map(t => (
              <CommandItem key={t.id} onSelect={() => setSelected(t)}>
                {t.ad}
              </CommandItem>
            ))
          )}
        </CommandList>
      </Command>

      {/* Selected template indicator */}
      {selected && (
        <p className="text-sm text-muted-foreground">
          Şablon seçin: <span className="font-medium text-foreground">{selected.ad}</span>
        </p>
      )}

      {/* Generate button — primary (orange) CTA */}
      <Button
        className="bg-primary hover:bg-primary/90"
        disabled={!selected || generateMutation.isPending}
        onClick={startGeneration}
      >
        {generateMutation.isPending ? 'Üretiliyor…' : 'Şablondan Üret'}
      </Button>

      {/* Progress modal */}
      <Dialog open={progressOpen}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>PDF Üretiliyor</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-2 text-center">
              <p className={cn('text-sm', step === 'render' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                1. Şablon dolduruluyor…
              </p>
              <p className={cn('text-sm', step === 'convert' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                2. PDF oluşturuluyor…
              </p>
              <p className={cn('text-sm', step === 'archive' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                3. Arşivleniyor…
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}