'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SurecStepperProps<T extends string> = {
  stages: readonly T[]
  labels: Record<T, string>
  current: T | null
  onAdvance?: () => void
  onBack?: () => void
  isPending?: boolean
}

export function SurecStepper<T extends string>({
  stages,
  labels,
  current,
  onAdvance,
  onBack,
  isPending = false,
}: SurecStepperProps<T>) {
  const currentIdx = current ? stages.indexOf(current) : -1
  const isCompleted = currentIdx === stages.length - 1

  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => {
        const isPast = currentIdx > idx
        const isCurrent = currentIdx === idx
        const isFuture = currentIdx < idx

        const showButton = isCurrent && !isCompleted

        return (
          <div key={stage} className="flex items-center gap-3">
            {/* Stage dot */}
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                isPast && 'bg-accent text-accent-foreground',
                isCurrent && 'border-2 border-accent bg-background text-accent',
                isFuture && 'border border-border bg-background text-muted-foreground'
              )}
            >
              {isPast ? <Check size={12} /> : idx + 1}
            </div>

            {/* Stage label */}
            <span
              className={cn(
                'text-sm flex-1',
                isPast && 'text-foreground',
                isCurrent && 'font-semibold text-foreground',
                isFuture && 'text-muted-foreground'
              )}
            >
              {labels[stage]}
            </span>

            {/* İleri Al / Geri Al buttons - shown only for current non-final stage */}
            {showButton && (
              <div className="flex gap-2">
                {onBack && currentIdx > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBack}
                    disabled={isPending}
                  >
                    ← Geri Al
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={onAdvance}
                  disabled={isPending}
                >
                  {isPending ? 'İlerletiliyor...' : 'İleri Al →'}
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Süreç Tamamlandı label - shown when at final stage */}
      {isCompleted && currentIdx === stages.length - 1 && (
        <p className="text-sm text-muted-foreground mt-2">Süreç Tamamlandı</p>
      )}

      {/* İleri Al on first stage when no stage started */}
      {current === null && stages.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border border-border bg-background text-muted-foreground flex items-center justify-center text-xs">
            1
          </div>
          <span className="text-sm text-muted-foreground flex-1">{labels[stages[0]]}</span>
          <div className="flex gap-2">
            {onBack && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBack}
                disabled={isPending}
              >
                ← Geri Al
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              onClick={onAdvance}
              disabled={isPending}
            >
              {isPending ? 'İlerletiliyor...' : 'İleri Al →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
