'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'

export function HealthBanner() {
  const trpc = useTRPC()
  const [dismissed, setDismissed] = useState(false)

  const { data, isLoading } = useQuery({
    ...trpc.pipeline.healthCheck.queryOptions(),
    refetchInterval: 2 * 60 * 60 * 1000,
  })

  if (dismissed || isLoading || !data) return null

  const missingPython = !data.python.accessible
  const missingLibre = !data.libreoffice.accessible

  if (!missingPython && !missingLibre) return null

  const messages: string[] = []
  if (missingPython && missingLibre) {
    messages.push('⚠ Python ve LibreOffice bulunamadı. Şablon ve PDF özellikleri kullanılamaz.')
  } else if (missingPython) {
    messages.push('⚠ Python bulunamadı. Şablon ve PDF özellikleri çalışmayabilir.')
  } else if (missingLibre) {
    messages.push('⚠ LibreOffice bulunamadı. PDF dönüştürme çalışmayabilir.')
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {messages.map((msg) => (
              <p key={msg} className="text-sm font-medium">{msg}</p>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
          aria-label="Uyarıyı kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}