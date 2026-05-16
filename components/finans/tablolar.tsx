'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EnrichedRow, C, fmt } from './finans-data'

interface TablolarProps { data: EnrichedRow[] }

export function Tablolar({ data }: TablolarProps) {
  const trpc = useTRPC()

  const { data: dashData, isLoading: dashLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({})
  )
  const { data: sirketData, isLoading: sirketLoading } = useQuery(
    trpc.finans.sirket.queryOptions()
  )

  const isLoading = dashLoading || sirketLoading

  // Monthly: reversed (newest first), includes cumulative kasa from prop
  const monthlyRows = useMemo(() => [...data].reverse(), [data])

  // Yearly: from internal all-time query
  const yearlyRows = useMemo(() =>
    (dashData?.yearly ?? []).map(y => ({
      yil:    y.yil,
      gelen:  y.gelen,
      giden:  y.giden,
      masraf: y.masraf,
      net:    y.gelen - y.giden - y.masraf,
      marj:   y.gelen > 0 ? ((y.gelen - y.giden - y.masraf) / y.gelen * 100) : 0,
    })),
  [dashData?.yearly])

  const sirket = sirketData ?? []

  const mTot = useMemo(() => monthlyRows.reduce(
    (a, r) => ({ gelen: a.gelen + r.gelen, giden: a.giden + r.giden, masraf: a.masraf + r.masraf, net: a.net + r.net }),
    { gelen: 0, giden: 0, masraf: 0, net: 0 },
  ), [monthlyRows])

  const yTot = useMemo(() => yearlyRows.reduce(
    (a, r) => ({ gelen: a.gelen + r.gelen, giden: a.giden + r.giden, masraf: a.masraf + r.masraf, net: a.net + r.net }),
    { gelen: 0, giden: 0, masraf: 0, net: 0 },
  ), [yearlyRows])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Aylık Detay */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Detay</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {['Ay', 'Gelen', 'Giden', 'Masraf', 'Net', 'Kümülatif Kasa'].map(h => (
                  <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Ay' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-2.5 font-medium">{r.labelFull}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.gelen  }}>{fmt(r.gelen)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.giden  }}>{fmt(r.giden)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.masraf }}>{fmt(r.masraf)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-semibold" style={{ color: r.net >= 0 ? C.net : C.giden }}>{fmt(r.net)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-semibold" style={{ color: r.kasa >= 0 ? C.kasa : C.giden }}>{fmt(r.kasa)}</td>
                </tr>
              ))}
            </tbody>
            {monthlyRows.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 border-t-2">
                  <td className="px-5 py-2.5 font-bold">Toplam</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.gelen  }}>{fmt(mTot.gelen)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.giden  }}>{fmt(mTot.giden)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.masraf }}>{fmt(mTot.masraf)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: mTot.net >= 0 ? C.net : C.giden }}>{fmt(mTot.net)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {/* Yıllık Özet */}
      {yearlyRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yıllık Özet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {['Yıl', 'Gelen', 'Giden', 'Masraf', 'Net', 'Net Marj'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Yıl' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearlyRows.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-2.5 font-semibold">{r.yil}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.gelen  }}>{fmt(r.gelen)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.giden  }}>{fmt(r.giden)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: C.masraf }}>{fmt(r.masraf)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-semibold" style={{ color: r.net >= 0 ? C.net : C.giden }}>{fmt(r.net)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      <span className="font-semibold" style={{ color: r.marj >= 40 ? '#22c55e' : r.marj >= 20 ? '#f97316' : '#ef4444' }}>
                        %{r.marj.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 border-t-2">
                  <td className="px-5 py-2.5 font-bold">Toplam</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.gelen  }}>{fmt(yTot.gelen)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.giden  }}>{fmt(yTot.giden)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: C.masraf }}>{fmt(yTot.masraf)}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: yTot.net >= 0 ? C.net : C.giden }}>{fmt(yTot.net)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    <span className="font-bold" style={{ color: yTot.gelen > 0 && (yTot.net / yTot.gelen * 100) >= 40 ? '#22c55e' : '#f97316' }}>
                      {yTot.gelen > 0 ? `%${(yTot.net / yTot.gelen * 100).toFixed(1)}` : '—'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Şirket Bazlı */}
      {sirket.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Şirket Bazlı Tahsilat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {['Şirket', 'Talep', 'Tahsilat', 'Dosya', 'Tahsilat Oranı'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${h === 'Şirket' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sirket.map((s, i) => {
                  const pct = s.talep > 0 ? (s.tahsilat / s.talep * 100) : 0
                  return (
                    <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-2.5 font-medium">{s.ad}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{fmt(s.talep)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-medium" style={{ color: C.gelen }}>{fmt(s.tahsilat)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{s.dosya}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        <span className="font-semibold" style={{ color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f97316' : '#ef4444' }}>
                          %{pct.toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
