'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableCell, TableRow } from '@/components/ui/table'
import { DataTable, ColumnMeta } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { C, fmt } from './finans-data'

const MONTHS_TR_FULL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

type MonthlyRow = { ay: string; gelen: number; giden: number; masraf: number; net: number }
type YearlyRow  = { yil: string; gelen: number; giden: number; masraf: number; net: number }

const rightMeta: ColumnMeta = { align: 'right' }

const monthlyColumns: ColumnDef<MonthlyRow>[] = [
  { accessorKey: 'ay',     header: 'Ay',     meta: { align: 'left' } satisfies ColumnMeta },
  { accessorKey: 'gelen',  header: 'Gelen',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.gelen  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'giden',  header: 'Giden',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.giden  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'masraf', header: 'Masraf', meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.masraf }}>{fmt(getValue() as number)}</span> },
  {
    accessorKey: 'net', header: 'Net', meta: rightMeta,
    cell: ({ getValue }) => {
      const v = getValue() as number
      return <span className="font-semibold" style={{ color: v >= 0 ? C.net : C.giden }}>{fmt(v)}</span>
    },
  },
]

const yearlyColumns: ColumnDef<YearlyRow>[] = [
  { accessorKey: 'yil',    header: 'Yıl',    meta: { align: 'left' } satisfies ColumnMeta },
  { accessorKey: 'gelen',  header: 'Gelen',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.gelen  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'giden',  header: 'Giden',  meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.giden  }}>{fmt(getValue() as number)}</span> },
  { accessorKey: 'masraf', header: 'Masraf', meta: rightMeta, cell: ({ getValue }) => <span style={{ color: C.masraf }}>{fmt(getValue() as number)}</span> },
  {
    accessorKey: 'net', header: 'Net', meta: rightMeta,
    cell: ({ getValue }) => {
      const v = getValue() as number
      return <span className="font-semibold" style={{ color: v >= 0 ? C.net : C.giden }}>{fmt(v)}</span>
    },
  },
]

export function FinansTablolar() {
  const trpc = useTRPC()
  const [selectedYear, setSelectedYear] = useState<number | undefined>()

  const { data, isLoading } = useQuery(
    trpc.finans.dashboard.queryOptions({ yil: selectedYear })
  )

  const availableYears = data?.yearly?.map(y => parseInt(y.yil)) ?? []

  const monthlyRows = useMemo<MonthlyRow[]>(() =>
    data?.monthly?.map(m => {
      const [year, month] = m.ay.split('-')
      return {
        ay: `${MONTHS_TR_FULL[parseInt(month) - 1]} – ${year}`,
        gelen: m.gelen, giden: m.giden, masraf: m.masraf,
        net: m.gelen - m.giden - m.masraf,
      }
    }) ?? [],
  [data?.monthly])

  const yearlyRows = useMemo<YearlyRow[]>(() =>
    data?.yearly?.map(y => ({
      yil: y.yil, gelen: y.gelen, giden: y.giden, masraf: y.masraf,
      net: y.gelen - y.giden - y.masraf,
    })) ?? [],
  [data?.yearly])

  const mTot = monthlyRows.reduce((a, r) => ({ gelen: a.gelen+r.gelen, giden: a.giden+r.giden, masraf: a.masraf+r.masraf, net: a.net+r.net }), { gelen:0, giden:0, masraf:0, net:0 })
  const yTot = yearlyRows .reduce((a, r) => ({ gelen: a.gelen+r.gelen, giden: a.giden+r.giden, masraf: a.masraf+r.masraf, net: a.net+r.net }), { gelen:0, giden:0, masraf:0, net:0 })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Year filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Yıl:</span>
        <Tabs
          value={selectedYear?.toString() ?? 'all'}
          onValueChange={v => setSelectedYear(v === 'all' ? undefined : parseInt(v))}
        >
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            {availableYears.map(y => (
              <TabsTrigger key={y} value={y.toString()}>{y}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Aylık Detay */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Detay {selectedYear ? `(${selectedYear})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={monthlyColumns}
            data={monthlyRows}
            footerRows={
              monthlyRows.length > 0 ? (
                <TableRow className="bg-muted/40">
                  <TableCell className="text-left font-bold">Toplam</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.gelen  }}>{fmt(mTot.gelen)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.giden  }}>{fmt(mTot.giden)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.masraf }}>{fmt(mTot.masraf)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: mTot.net >= 0 ? C.net : C.giden }}>{fmt(mTot.net)}</TableCell>
                </TableRow>
              ) : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Yıllık Özet */}
      {yearlyRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yıllık Özet</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={yearlyColumns}
              data={yearlyRows}
              footerRows={
                <TableRow className="bg-muted/40">
                  <TableCell className="text-left font-bold">Toplam</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.gelen  }}>{fmt(yTot.gelen)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.giden  }}>{fmt(yTot.giden)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: C.masraf }}>{fmt(yTot.masraf)}</TableCell>
                  <TableCell className="text-right font-bold" style={{ color: yTot.net >= 0 ? C.net : C.giden }}>{fmt(yTot.net)}</TableCell>
                </TableRow>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
