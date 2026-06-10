'use client'

import { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { type LucideIcon } from 'lucide-react'

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: ReactNode
  sub?: string
  color: string
  Icon?: LucideIcon
  trend?: number
  trendLabel?: string
}

export function KPICard({ label, value, sub, color, Icon, trend, trendLabel }: KPICardProps) {
  const up = (trend ?? 0) > 0
  return (
    <div
      className="rounded-r-xl bg-card border border-l-[3px] px-[18px] py-4 flex flex-col gap-1.5"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5" style={{ color }} />}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        {trend != null && (
          <span
            className="flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
            style={{ color: up ? '#22c55e' : '#ef4444' }}
          >
            {up ? '▲' : '▼'} {up ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-[26px] font-bold tracking-tight leading-none tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-[11.5px] text-muted-foreground">{sub}</p>}
      {trendLabel && (
        <p className="text-[11px] text-muted-foreground border-t pt-1.5 mt-0.5">{trendLabel}</p>
      )}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  pct: number
  color: string
  h?: number
}

export function ProgressBar({ pct, color, h = 5 }: ProgressBarProps) {
  return (
    <div className="w-full rounded-full bg-muted overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  )
}

// ── Pill badge ────────────────────────────────────────────────────────────────

interface PillProps {
  label: string
  color?: string
  bg?: string
}

export function Pill({ label, color, bg }: PillProps) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg ?? `${color ?? '#999'}22`, color: color ?? 'var(--foreground)' }}
    >
      {label}
    </span>
  )
}

// ── Card head ─────────────────────────────────────────────────────────────────

interface CardHeadProps {
  title: string
  sub?: string
  right?: ReactNode
  badge?: string
}

export function CardHead({ title, sub, right, badge }: CardHeadProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-[18px] pt-3.5 pb-3 border-b">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-semibold">{title}</p>
          {badge && (
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

// ── Loading shell ─────────────────────────────────────────────────────────────

export function ReportLoading() {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
      <Skeleton className="h-[240px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function ReportEmpty({ message = 'Bu rapor için henüz veri bulunmuyor.' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed bg-card/40 px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
