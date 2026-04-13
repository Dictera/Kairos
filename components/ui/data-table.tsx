'use client'

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Column meta type — extend via TS module augmentation in consumer if needed
export type ColumnMeta = {
  align?: 'left' | 'right'
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Optional footer rows rendered inside <tfoot> */
  footerRows?: React.ReactNode
  emptyText?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  footerRows,
  emptyText = 'Veri yok',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as ColumnMeta | undefined
              const align = meta?.align ?? 'left'
              const canSort = header.column.getCanSort()
              const sorted = header.column.getIsSorted()

              const SortIcon = sorted === 'asc'
                ? <ArrowUp className="h-3 w-3 shrink-0" />
                : sorted === 'desc'
                  ? <ArrowDown className="h-3 w-3 shrink-0" />
                  : <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" />

              return (
                <TableHead
                  key={header.id}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  style={canSort ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                >
                  {/* w-full flex so the header text aligns exactly with cell data */}
                  <div className={`flex w-full items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {/* Right-aligned: icon LEFT of text so text edge matches data edge */}
                    {canSort && align === 'right' && SortIcon}
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {/* Left-aligned: icon RIGHT of text */}
                    {canSort && align !== 'right' && SortIcon}
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as ColumnMeta | undefined
                return (
                  <TableCell
                    key={cell.id}
                    className={meta?.align === 'right' ? 'text-right' : 'text-left'}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground h-16">
              {emptyText}
            </TableCell>
          </TableRow>
        )}
      </TableBody>

      {footerRows && (
        <TableFooter>
          {footerRows}
        </TableFooter>
      )}
    </Table>
  )
}
