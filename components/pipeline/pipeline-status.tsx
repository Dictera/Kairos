'use client'

import { useTRPC } from '@/lib/trpc/context'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 animate-pulse bg-muted rounded" />
      </div>
      <div className="h-4 w-32 animate-pulse bg-muted rounded" />
    </div>
  )
}

function StatusRow({
  label,
  path,
  version,
  accessible,
}: {
  label: string
  path: string | null
  version: string | null
  accessible: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        {accessible ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
        )}
        <span className="font-medium text-sm truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5 min-w-0">
          {path && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={path}>
              {path}
            </span>
          )}
          {version && (
            <span className="text-xs text-muted-foreground">v{version}</span>
          )}
        </div>
        <Badge variant={accessible ? 'default' : 'destructive'}>
          {accessible ? 'Erişilebilir' : 'Bulunamadı'}
        </Badge>
      </div>
    </div>
  )
}

export function PipelineStatus() {
  const trpc = useTRPC()

  const { data: health, isLoading: healthLoading } = useQuery(
    trpc.pipeline.healthCheck.queryOptions()
  )
  const { data: status, isLoading: statusLoading } = useQuery(
    trpc.pipeline.status.queryOptions()
  )
  const isLoading = healthLoading || statusLoading

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pipeline Durumu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SkeletonRow />
          <SkeletonRow />
        </CardContent>
      </Card>
    )
  }

  if (!health || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pipeline Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Pipeline yapılandırması yüklenemiyor.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Pipeline Durumu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusRow
          label="Python"
          path={status.python.path}
          version={health.python.version}
          accessible={health.python.accessible}
        />
        <StatusRow
          label="LibreOffice"
          path={status.libreoffice.path}
          version={health.libreoffice.version}
          accessible={health.libreoffice.accessible}
        />
      </CardContent>
    </Card>
  )
}