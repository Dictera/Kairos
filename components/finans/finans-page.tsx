'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowDownCircle, ArrowUpCircle, Receipt, MinusCircle } from 'lucide-react'
import { fmt } from './finans-data'
import { SirketTur }       from './sirket-tur'
import { Karlilik }        from './karlilik'
import { Pipeline }        from './pipeline'
import { FinansDashboard } from './finans-dashboard'
import { FinansTablolar }  from './finans-tablolar'

type YilFilter = 'all' | string

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ yil }: { yil: YilFilter }) {
  const trpc         = useTRPC()
  const selectedYear = yil === 'all' ? undefined : parseInt(yil)

  const { data } = useQuery(
    trpc.finans.dashboard.queryOptions({ yil: selectedYear })
  )

  const totals = (data?.monthly ?? []).reduce(
    (a, m) => ({
      gelen:  a.gelen  + m.gelen,
      giden:  a.giden  + m.giden,
      masraf: a.masraf + m.masraf,
      net:    a.net    + (m.gelen - m.giden - m.masraf),
    }),
    { gelen: 0, giden: 0, masraf: 0, net: 0 },
  )

  const items = [
    { label: 'Gelen',      value: totals.gelen,  color: '#22c55e', Icon: ArrowDownCircle },
    { label: 'Giden',      value: totals.giden,  color: '#ef4444', Icon: ArrowUpCircle   },
    { label: 'Masraf',     value: totals.masraf, color: '#f97316', Icon: Receipt         },
    { label: 'Net Bakiye', value: totals.net,    color: totals.net >= 0 ? '#1c768f' : '#ef4444', Icon: MinusCircle },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ label, value, color, Icon }) => (
        <div
          key={label}
          className="rounded-r-xl bg-card border border-l-[4px] px-5 py-4"
          style={{ borderLeftColor: color }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="h-3.5 w-3.5" style={{ color }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums" style={{ color }}>
            {fmt(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Year filter ───────────────────────────────────────────────────────────────

function YilChips({ value, onChange, years }: { value: YilFilter; onChange: (v: YilFilter) => void; years: number[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={[
          'rounded-md border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
          value === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-foreground hover:bg-muted',
        ].join(' ')}
      >
        Tümü
      </button>
      {years.map(y => (
        <button
          key={y}
          onClick={() => onChange(String(y))}
          className={[
            'rounded-md border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
            value === String(y)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground hover:bg-muted',
          ].join(' ')}
        >
          {y}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FinansPage() {
  const [yil, setYil] = useState<YilFilter>('all')
  const trpc = useTRPC()

  const { data: dashData } = useQuery(
    trpc.finans.dashboard.queryOptions({})
  )
  const availableYears = (dashData?.yearly ?? []).map(y => parseInt(y.yil))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Finans Analizi</p>
          <h1 className="text-2xl font-semibold tracking-tight">Finans</h1>
        </div>
        <YilChips value={yil} onChange={setYil} years={availableYears} />
      </div>

      <SummaryStrip yil={yil} />

      <Tabs defaultValue="sirket" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="sirket">Şirket & Tür</TabsTrigger>
          <TabsTrigger value="karlilik">Kârlılık & Verimlilik</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline & Tahmin</TabsTrigger>
          <TabsTrigger value="aylik">Aylık Özet</TabsTrigger>
          <TabsTrigger value="tablolar">Tablolar</TabsTrigger>
        </TabsList>

        <TabsContent value="sirket"   className="mt-4"><SirketTur /></TabsContent>
        <TabsContent value="karlilik" className="mt-4"><Karlilik /></TabsContent>
        <TabsContent value="pipeline" className="mt-4"><Pipeline /></TabsContent>
        <TabsContent value="aylik"    className="mt-4"><FinansDashboard /></TabsContent>
        <TabsContent value="tablolar" className="mt-4"><FinansTablolar /></TabsContent>
      </Tabs>
    </div>
  )
}
