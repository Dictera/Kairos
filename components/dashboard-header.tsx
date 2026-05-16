'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Bell, FolderOpen, Users, FileText, X, Calendar, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTRPC } from '@/lib/trpc/context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function highlight(text: string | null, query: string) {
  if (!text || !query) return text ?? ''
  const idx = text.toLocaleLowerCase('tr').indexOf(query.toLocaleLowerCase('tr'))
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/20 px-0.5 font-semibold text-primary">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function NotificationDropdown() {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const unreadQuery = useQuery({
    ...trpc.bildirim.unreadCount.queryOptions(),
    refetchInterval: open ? false : 30000,
  })

  const listQuery = useQuery({
    ...trpc.bildirim.list.queryOptions(),
    enabled: open,
  })

  const syncMutation = useMutation({
    ...trpc.bildirim.sync.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.list.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.unreadCount.queryKey() })
    },
  })

  const markAsRead = useMutation({
    ...trpc.bildirim.markAsRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.list.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.unreadCount.queryKey() })
    },
  })

  const markAllAsRead = useMutation({
    ...trpc.bildirim.markAllAsRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.list.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.bildirim.unreadCount.queryKey() })
    },
  })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      syncMutation.mutate()
    }
  }

  const notifications = listQuery.data ?? []
  const unreadCount = unreadQuery.data ?? 0

  const handleNotificationClick = (dosyaId: number | null) => {
    if (dosyaId) {
      setOpen(false)
      router.push(`/dosyalar/${dosyaId}`)
    }
  }

  const handleDismiss = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    markAsRead.mutate({ id })
  }

  const handleDismissAll = () => {
    markAllAsRead.mutate()
  }

  const today = new Date().toISOString().slice(0, 10)

  const getIcon = (tip: string) => {
    if (tip === 'durusma') return <Calendar className="size-4 text-primary shrink-0" />
    return <Clock className="size-4 text-orange-500 shrink-0" />
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-10 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Bildirimler"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Bildirimler</span>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Check className="size-3" />
              Tümünü okundu işaretle
            </button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {listQuery.isLoading && syncMutation.isPending && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">Yükleniyor...</div>
          )}
          {notifications.length === 0 && !listQuery.isLoading && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Bildirim yok
            </div>
          )}
          <div className="flex flex-col">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.dosya_id)}
                className="group relative flex cursor-pointer items-start gap-3 border-b border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/50 last:border-b-0"
              >
                <div className="mt-0.5">{getIcon(n.tip)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{n.baslik}</div>
                  <div className="text-xs text-muted-foreground">{n.mesaj}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {n.tarih === today ? 'Bugün' : n.tarih}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, n.id)}
                  className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Bildirimi kaldır"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export function DashboardHeader() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 200)

  const trpc = useTRPC()
  const searchQuery = useQuery({
    ...trpc.search.global.queryOptions({ query: debouncedQuery, limit: 5 }),
    enabled: debouncedQuery.length >= 1,
  })

  // Keyboard shortcut: Ctrl+K / Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelectDosya = (id: number) => {
    setOpen(false)
    router.push(`/dosyalar/${id}`)
  }

  const handleSelectMuvekkil = (id: number) => {
    setOpen(false)
    router.push(`/muvekkiller/${id}`)
  }

  const dosyalar = searchQuery.data?.dosyalar ?? []
  const muvekkiller = searchQuery.data?.muvekkiller ?? []
  const hasResults = dosyalar.length > 0 || muvekkiller.length > 0

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        {/* Search trigger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-10 w-full max-w-[320px] items-center gap-2 rounded-xl border border-transparent bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
        >
          <Search className="size-4 shrink-0 opacity-60" />
          <span className="truncate">Dosya, müvekkil ara...</span>
          <kbd className="pointer-events-none ml-auto hidden rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            Ctrl K
          </kbd>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => router.push('/dosyalar/yeni')}
            className="h-10 gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Yeni Dosya</span>
          </Button>

          <NotificationDropdown />

          <Avatar size="sm" className="size-10 border border-border/60">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              S
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Command Palette Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen} title="Ara" description="Dosya veya müvekkil ara">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Dosya no, müvekkil adı, plaka, TC/Vergi no..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aramaya başlamak için yazmaya başlayın
              </div>
            )}

            {query.length > 0 && !searchQuery.isLoading && !hasResults && (
              <CommandEmpty>Sonuç bulunamadı</CommandEmpty>
            )}

            {query.length > 0 && searchQuery.isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">Aranıyor...</div>
            )}

            {dosyalar.length > 0 && (
              <CommandGroup heading="Dosyalar">
                {dosyalar.map((d) => (
                  <CommandItem
                    key={`dosya-${d.id}`}
                    onSelect={() => handleSelectDosya(d.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {highlight(d.dosya_no, query)} — {highlight(d.muvekkil_ad, query)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-sm bg-muted px-1 py-0.5 font-medium">{d.tur}</span>
                          {d.sigorta_turu_ad && <span>{d.sigorta_turu_ad}</span>}
                          {d.hasar_dosya_no && (
                            <span className="truncate">{highlight(d.hasar_dosya_no, query)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {dosyalar.length > 0 && muvekkiller.length > 0 && <CommandSeparator />}

            {muvekkiller.length > 0 && (
              <CommandGroup heading="Müvekkiller">
                {muvekkiller.map((m) => (
                  <CommandItem
                    key={`muvekkil-${m.id}`}
                    onSelect={() => handleSelectMuvekkil(m.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                        <Users className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {highlight(`${m.ad} ${m.soyad}`, query)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {m.tc_vergi_no && (
                            <span>{highlight(m.tc_vergi_no, query)}</span>
                          )}
                          {m.telefon && (
                            <span>{highlight(m.telefon, query)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.length >= 1 && hasResults && (
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push(`/dosyalar?search=${encodeURIComponent(query)}`)
                }}
                className="cursor-pointer"
              >
                <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="size-4" />
                    Tüm sonuçlar için dosyalara git
                  </span>
                  <span className="text-xs">Enter</span>
                </div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
