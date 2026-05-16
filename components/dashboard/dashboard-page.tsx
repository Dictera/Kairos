'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter } from 'next/navigation'
import { StatCards } from '@/components/dashboard/stat-cards'
import { TodaysHearings } from '@/components/dashboard/todays-hearings'
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function CurrentDateBanner() {
  const now = new Date()
  const weekday = now.toLocaleDateString('tr-TR', { weekday: 'long' })
  const day = now.getDate()
  const month = now.toLocaleDateString('tr-TR', { month: 'long' })
  const year = now.getFullYear()

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <span className="text-lg font-bold leading-none text-primary">{day}</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
          {capitalizedWeekday}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {capitalizedMonth} {year}
        </span>
      </div>
      <div className="ml-auto h-6 w-px bg-border/60" />
      <span className="text-xs text-muted-foreground tabular-nums">
        {now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    </div>
  )
}

/**
 * Durum badge'leri — design system token'ları kullanır.
 * Aktif → primary/10 (orange), Arşivlenmiş → muted (nötr)
 */
function DurumBadge({ durum }: { durum: string }) {
  if (durum === 'aktif') {
    return (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
        Aktif
      </Badge>
    )
  }
  return (
    <Badge className="bg-muted text-muted-foreground hover:bg-muted border-0">
      Arşivlenmiş
    </Badge>
  )
}

function RecentFilesTable() {
  const trpc = useTRPC()
  const router = useRouter()
  const { data, isLoading } = useQuery(
    trpc.dosya.list.queryOptions({ page: 1, pageSize: 5 })
  )

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-sm font-semibold">Son Dosyalar</h2>
        <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent">
          <Link href="/dosyalar">Tümünü gör</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dosya No</TableHead>
            <TableHead>Taraf</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 4 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.rows.length ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                Henüz dosya oluşturulmadı.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dosyalar/${row.id}`)}
              >
                <TableCell className="font-medium">{row.dosya_no}</TableCell>
                <TableCell className="text-muted-foreground">{row.muvekkil_ad ?? '—'}</TableCell>
                <TableCell>{row.tur}</TableCell>
                <TableCell><DurumBadge durum={row.durum} /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function DashboardPage() {
  const trpc = useTRPC()

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.dashboard.stats.queryOptions()
  )
  const { data: hearings = [], isLoading: hearingsLoading } = useQuery(
    trpc.dashboard.todaysHearings.queryOptions()
  )
  const { data: deadlines = [], isLoading: deadlinesLoading } = useQuery(
    trpc.dashboard.upcomingDeadlines.queryOptions()
  )

  return (
    <div className="space-y-5">
      {/* Tarih Banner */}
      <CurrentDateBanner />

      {/* Stat Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <StatCards
          totalDosya={stats?.totalDosya ?? 0}
          aktivDosya={stats?.aktivDosya ?? 0}
          buAyAcilan={stats?.buAyAcilan ?? 0}
          totalDelta={stats?.totalDelta}
          aktivDelta={stats?.aktivDelta}
          buAyDelta={stats?.buAyDelta}
        />
      )}

      {/* Duruşmalar + Yaklaşan Süreler */}
      <div className="grid grid-cols-2 gap-4">
        {hearingsLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <TodaysHearings hearings={hearings} />
        )}

        {deadlinesLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <UpcomingDeadlines deadlines={deadlines} />
        )}
      </div>

      {/* Son Dosyalar */}
      <RecentFilesTable />
    </div>
  )
}
