'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'

const olayColorMap: Record<string, string> = {
  olusturma: 'bg-primary',
  durum_degisikligi: 'bg-muted-foreground',
  surec_asama: 'bg-accent',
  finans: 'bg-green-600',
  belge: 'bg-muted-foreground',
  not: 'bg-primary/70',
  durusma: 'bg-blue-600',
  sure: 'bg-amber-600',
  guncelleme: 'bg-muted-foreground',
}

interface TimelineProps {
  dosyaId: number
}

export function Timeline({ dosyaId }: TimelineProps) {
  const trpc = useTRPC()

  const { data: events, isLoading } = useQuery(
    trpc.olay.list.queryOptions({ dosya_id: dosyaId })
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-muted animate-pulse mt-1.5" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold">Zaman Çizelgesi</h3>

      {/* Empty state */}
      {(!events || events.length === 0) && (
        <div className="text-center py-8 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Henüz etkinlik kaydı yok</p>
          <p className="text-xs text-muted-foreground">
            Dosya oluşturulduğunda zaman çizelgesi otomatik olarak güncellenecektir.
          </p>
        </div>
      )}

      {/* Timeline — max 50 events */}
      {events && events.length > 0 && (
        <div className="space-y-4 pl-2 border-l-2 border-border">
          {events.slice(0, 50).map((event) => (
            <div key={event.id} className="flex gap-3 items-start relative">
              {/* Dot */}
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${olayColorMap[event.olay_turu] ?? 'bg-muted-foreground'}`}
              />
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm">{event.aciklama}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(event.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more link placeholder if > 50 events */}
      {events && events.length > 50 && (
        <p className="text-xs text-muted-foreground text-center">Tümünü Gör</p>
      )}
    </div>
  )
}
