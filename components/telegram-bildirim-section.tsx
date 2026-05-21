'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { X, Send, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { ClockPicker } from '@/components/clock-picker'

export function TelegramBildirimSection() {
  const trpc = useTRPC()
  const qc = useQueryClient()

  const [clockOpen, setClockOpen] = useState(false)

  // ── Load configured cron times ─────────────────────────────────────────
  const scheduleOpts = trpc.telegram.getSchedule.queryOptions()
  const { data: scheduleData, isLoading } = useQuery(scheduleOpts)
  const times: string[] = scheduleData?.times ?? []

  // ── Load notification category toggles ────────────────────────────────
  const togglesOpts = trpc.telegram.getToggles.queryOptions()
  const { data: toggles } = useQuery(togglesOpts)

  // ── Update schedule mutation ───────────────────────────────────────────
  const updateSchedule = useMutation(
    trpc.telegram.updateSchedule.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: scheduleOpts.queryKey })
        toast.success('Bildirim saatleri güncellendi.')
      },
      onError: () => toast.error('Güncelleme başarısız.'),
    })
  )

  // ── Update toggles mutation ────────────────────────────────────────────
  const updateToggles = useMutation(
    trpc.telegram.updateToggles.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: togglesOpts.queryKey })
        qc.invalidateQueries({ queryKey: scheduleOpts.queryKey })
        toast.success('Bildirim ayarları güncellendi.')
      },
      onError: () => toast.error('Güncelleme başarısız. Lütfen tekrar deneyin.'),
    })
  )

  // ── Test connection mutation ───────────────────────────────────────────
  const testConnection = useMutation(
    trpc.telegram.testConnection.mutationOptions({
      onSuccess: (data) => {
        if (data.ok) {
          toast.success('Test mesajı gönderildi.')
        } else {
          // Distinguish config errors from API errors per UI-SPEC
          if (data.error?.includes('BOT_TOKEN') || data.error?.includes('CHAT_ID')) {
            toast.error('BOT_TOKEN veya CHAT_ID yapılandırılmamış. .env.local dosyasını kontrol edin.')
          } else {
            toast.error("Telegram API'ye ulaşılamadı. Token ve Chat ID'yi kontrol edin.")
          }
        }
      },
      onError: () =>
        toast.error("Telegram API'ye ulaşılamadı. Token ve Chat ID'yi kontrol edin."),
    })
  )

  // ── Add time via clock picker ──────────────────────────────────────────
  function handleTimeConfirm(time: string) {
    if (times.includes(time)) {
      toast.error('Bu saat zaten ekli.')
      return
    }
    const newTimes = [...times, time].sort()
    updateSchedule.mutate({ times: newTimes })
  }

  // ── Remove time handler ────────────────────────────────────────────────
  function handleRemove(time: string) {
    const newTimes = times.filter((t) => t !== time)
    updateSchedule.mutate({ times: newTimes })
  }

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Telegram Bildirimleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Telegram Bildirimleri</CardTitle>
        <CardDescription>
          Yaklaşan duruşma ve süre bildirimleri Telegram&apos;a gönderilir. Bot yapılandırmak
          için{' '}
          <code className="rounded bg-muted px-1 text-xs">.env.local</code> dosyasına{' '}
          <code className="rounded bg-muted px-1 text-xs">TELEGRAM_BOT_TOKEN</code> ve{' '}
          <code className="rounded bg-muted px-1 text-xs">TELEGRAM_CHAT_ID</code> ekleyin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Env key instruction block */}
        <div className="rounded-md border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          Kurulum için{' '}
          <code className="rounded bg-muted px-1 text-xs">.env.example</code>{' '}
          dosyasındaki talimatları izleyin.
        </div>

        {/* Bildirim Kategorileri toggle group */}
        <div className="space-y-1">
          <p className="text-sm font-semibold">Bildirim Kategorileri</p>

          {/* Günlük Duruşmalar */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-normal">Günlük Duruşmalar</p>
              <p className="text-xs text-muted-foreground">Yaklaşan duruşmalar tek mesajda gönderilir.</p>
            </div>
            <Switch
              checked={(toggles?.telegram_gunluk_durusma_aktif) ?? true}
              onCheckedChange={(v) =>
                updateToggles.mutate({
                  telegram_gunluk_durusma_aktif: v,
                  telegram_gunluk_sure_aktif: toggles?.telegram_gunluk_sure_aktif ?? true,
                  telegram_haftalik_ozet_aktif: toggles?.telegram_haftalik_ozet_aktif ?? true,
                })
              }
              disabled={updateToggles.isPending}
              aria-label="Günlük Duruşmalar"
            />
          </div>

          {/* Günlük Süreler */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-normal">Günlük Süreler</p>
              <p className="text-xs text-muted-foreground">Yaklaşan hak düşürücü süreler tek mesajda gönderilir.</p>
            </div>
            <Switch
              checked={(toggles?.telegram_gunluk_sure_aktif) ?? true}
              onCheckedChange={(v) =>
                updateToggles.mutate({
                  telegram_gunluk_durusma_aktif: toggles?.telegram_gunluk_durusma_aktif ?? true,
                  telegram_gunluk_sure_aktif: v,
                  telegram_haftalik_ozet_aktif: toggles?.telegram_haftalik_ozet_aktif ?? true,
                })
              }
              disabled={updateToggles.isPending}
              aria-label="Günlük Süreler"
            />
          </div>

          {/* Haftalık Özet */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-normal">Haftalık Özet</p>
              <p className="text-xs text-muted-foreground">Her Pazartesi bu haftaki duruşma ve süreler özetlenir.</p>
            </div>
            <Switch
              checked={(toggles?.telegram_haftalik_ozet_aktif) ?? true}
              onCheckedChange={(v) =>
                updateToggles.mutate({
                  telegram_gunluk_durusma_aktif: toggles?.telegram_gunluk_durusma_aktif ?? true,
                  telegram_gunluk_sure_aktif: toggles?.telegram_gunluk_sure_aktif ?? true,
                  telegram_haftalik_ozet_aktif: v,
                })
              }
              disabled={updateToggles.isPending}
              aria-label="Haftalık Özet"
            />
          </div>
        </div>

        <Separator />

        {/* Cron times label + chip list */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Bildirim Saatleri</p>
          <div className="flex flex-wrap gap-2">
            {times.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz bildirim saati eklenmedi.</p>
            ) : (
              times.map((time) => (
                <Badge
                  key={time}
                  variant="secondary"
                  className="flex items-center gap-1 pl-2 pr-1 py-1"
                  style={
                    updateSchedule.isPending ? { opacity: 0.5, pointerEvents: 'none' } : {}
                  }
                >
                  <span className="text-sm tabular-nums">{time}</span>
                  <button
                    className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={`${time} saatini kaldır`}
                    onClick={() => handleRemove(time)}
                    disabled={updateSchedule.isPending}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Add time — clock picker trigger */}
        <div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setClockOpen(true)}
            disabled={updateSchedule.isPending}
            type="button"
          >
            <Clock className="h-3.5 w-3.5" />
            Saat Ekle
          </Button>
          <ClockPicker
            open={clockOpen}
            onOpenChange={setClockOpen}
            onConfirm={handleTimeConfirm}
          />
        </div>

        {/* Bağlantı Testi button — D-20 (Claude's discretion: include) */}
        <div className="pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => testConnection.mutate()}
            disabled={testConnection.isPending}
            aria-busy={testConnection.isPending ? 'true' : 'false'}
          >
            <Send className="h-3.5 w-3.5" />
            {testConnection.isPending ? 'Gönderiliyor…' : 'Bağlantı Testi'}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
