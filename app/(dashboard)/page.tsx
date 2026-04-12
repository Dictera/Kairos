'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { StatCards } from '@/components/dashboard/stat-cards'
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines'
import { TodaysHearings } from '@/components/dashboard/todays-hearings'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function DashboardPage() {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.dashboardStats.queryOptions()
  )

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Veriler yüklenemedi. Sayfayı yenileyiniz.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <StatCards
        totalDosya={data.totalDosya}
        aktivDosya={data.aktivDosya}
        buAyAcilan={data.buAyAcilan}
      />
      <Separator />
      <UpcomingDeadlines deadlines={data.upcomingDeadlines} />
      <Separator />
      <TodaysHearings hearings={data.todaysHearings} />
    </div>
  )
}
