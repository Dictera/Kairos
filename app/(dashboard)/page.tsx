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

export default function DashboardPage() {
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
