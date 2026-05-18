'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Send } from 'lucide-react'
import { toast } from 'sonner'

// HH:MM validation regex — mirrors Zod schema on server (D-03 security)
const TIME_REGEX = /^\d{2}:\d{2}$/

export function TelegramBildirimSection() {
  const trpc = useTRPC()
  const qc = useQueryClient()

  const [newTime, setNewTime] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  // ── Load configured cron times ─────────────────────────────────────────
  const scheduleOpts = trpc.telegram.getSchedule.queryOptions()
  const { data: scheduleData, isLoading } = useQuery(scheduleOpts)
  const times: string[] = scheduleData?.times ?? []

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

  // ── Add time handler ───────────────────────────────────────────────────
  function handleAdd() {
    setInputError(null)

    if (!TIME_REGEX.test(newTime)) {
      setInputError('SS:DD formatında girin (örn. 09:00)')
      return
    }

    if (times.includes(newTime)) {
      toast.error('Bu saat zaten ekli.')
      return
    }

    const newTimes = [...times, newTime].sort()
    updateSchedule.mutate({ times: newTimes })
    setNewTime('')
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

        {/* Cron times label + chip list */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Bildirim Saatleri</p>
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

        {/* Add time input + Saat Ekle button */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              value={newTime}
              onChange={(e) => {
                setNewTime(e.target.value)
                setInputError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') {
                  setNewTime('')
                  setInputError(null)
                }
              }}
              placeholder="09:00"
              className="w-24 font-mono text-sm tabular-nums"
              maxLength={5}
              aria-label="Yeni bildirim saati (SS:DD)"
              aria-invalid={inputError !== null ? 'true' : 'false'}
              aria-describedby={inputError ? 'time-input-error' : undefined}
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleAdd}
              disabled={updateSchedule.isPending}
            >
              {updateSchedule.isPending ? 'Saat ekleniyor…' : 'Saat Ekle'}
            </Button>
          </div>
          {inputError && (
            <p id="time-input-error" className="text-xs text-destructive">
              {inputError}
            </p>
          )}
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
