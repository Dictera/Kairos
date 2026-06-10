'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card } from '@/components/ui/card'
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2, type LucideIcon } from 'lucide-react'

import {
  C, riskColor, riskLabel,
  type ZamanasimıRow, type ZamanasimıRisk,
} from './raporlar-data'
import { CardHead, Pill, ReportLoading, ReportEmpty } from './raporlar-shared'

const riskIcon: Record<ZamanasimıRisk, LucideIcon> = {
  Acil:    AlertOctagon,
  Kritik:  AlertTriangle,
  Dikkat:  Clock,
  Güvenli: CheckCircle2,
}

const RISKS: ZamanasimıRisk[] = ['Acil', 'Kritik', 'Dikkat', 'Güvenli']

const ZAMANASIMI_INFO = [
  { tur: 'Ferdi Kaza / Konut / Sağlık / Hayat',    sure: '2 yıl',  kanun: 'TTK' },
  { tur: 'Trafik & İş Kazası — Yaralanma',         sure: '10 yıl', kanun: 'TK'  },
  { tur: 'Trafik & İş Kazası — Ölüm',              sure: '15 yıl', kanun: 'TK'  },
  { tur: 'Sigorta Tahkim Komisyonu Başvurusu',     sure: '2 yıl',  kanun: 'STK' },
]

export function Zamanasimi() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.raporlar.zamanasimi.queryOptions() as unknown as { queryKey: unknown[]; queryFn: () => Promise<{ dosyalar: ZamanasimıRow[] }> },
  )

  const dosyalar = useMemo(() => data?.dosyalar ?? [], [data])
  const grouped = useMemo(() => {
    const g: Record<ZamanasimıRisk, ZamanasimıRow[]> = { Acil: [], Kritik: [], Dikkat: [], Güvenli: [] }
    for (const d of dosyalar) g[d.risk]?.push(d)
    return g
  }, [dosyalar])
  const sorted = useMemo(() => dosyalar.toSorted((a, b) => a.kalanGun - b.kalanGun), [dosyalar])

  if (isLoading) return <ReportLoading />
  if (dosyalar.length === 0) return <ReportEmpty />

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {RISKS.map((r) => {
          const Icon = riskIcon[r]
          return (
            <div key={r} className="rounded-b-xl bg-card border px-4 py-3.5 text-center" style={{ borderTopWidth: 3, borderTopColor: riskColor[r] }}>
              <Icon className="h-5 w-5 mx-auto mb-1.5" style={{ color: riskColor[r] }} />
              <p className="text-[30px] font-extrabold tracking-tight tabular-nums" style={{ color: riskColor[r] }}>{grouped[r].length}</p>
              <p className="text-[13px] font-semibold mt-0.5">{r}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{riskLabel[r]}</p>
            </div>
          )
        })}
      </div>

      <Card className="overflow-hidden p-0">
        <CardHead title="Türk Hukukunda Sigorta Zamanaşımı Süreleri" sub="TTK & TK kapsamında sigorta davaları için yasal süreler" />
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {['Dava / Başvuru Türü', 'Süre', 'Dayanak'].map(h => (
                <th key={h} className="px-[18px] py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ZAMANASIMI_INFO.map((z) => (
              <tr key={z.tur} className="border-t">
                <td className="px-[18px] py-2.5 text-[13px] font-medium">{z.tur}</td>
                <td className="px-[18px] py-2.5"><Pill label={z.sure} color={z.sure === '2 yıl' ? C.warning : z.sure === '10 yıl' ? C.accent : C.success} /></td>
                <td className="px-[18px] py-2.5 text-muted-foreground text-[12px]">{z.kanun}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHead title="Zamanaşımı Yaklaşan Dosyalar" badge={`${dosyalar.length} takip`} sub="Kalan süreye göre sıralı — kırmızı olanlar acil işlem gerektirir" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {['Dosya No', 'Müvekkil', 'Şirket', 'Dava Türü', 'Açılış', 'ZA Süresi', 'Kalan', 'Risk'].map(h => (
                  <th key={h} className={`px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${h === 'Kalan' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const col = riskColor[d.risk]
                const bg = d.risk === 'Acil' ? 'bg-[#ef444408]' : d.risk === 'Kritik' ? 'bg-[#f9731608]' : ''
                return (
                  <tr key={d.no} className={`border-t ${bg}`}>
                    <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted-foreground">{d.no}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-[13px]">{d.muvekkil}</td>
                    <td className="px-3.5 py-2.5 text-[12.5px] text-muted-foreground">{d.sirket}</td>
                    <td className="px-3.5 py-2.5 text-[12.5px]">{d.tur}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-muted-foreground">{d.basTarih}</td>
                    <td className="px-3.5 py-2.5"><Pill label={`${d.zamanasimıYil} yıl`} color={C.purple} /></td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-[13px] tabular-nums" style={{ color: col }}>{d.kalanGun} gün</td>
                    <td className="px-3.5 py-2.5"><Pill label={d.risk} color={col} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
