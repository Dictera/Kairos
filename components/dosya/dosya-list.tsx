'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import Link from 'next/link'

export function DosyaList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialPage = parseInt(searchParams.get('sayfa') ?? '1', 10)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tur, setTur] = useState<'STK' | 'AT' | 'AH' | ''>('')
  const [durum, setDurum] = useState<'aktif' | 'arsiv' | ''>('')
  const [tarihBaslangic, setTarihBaslangic] = useState('')
  const [tarihBitis, setTarihBitis] = useState('')
  const [page, setPage] = useState(isNaN(initialPage) ? 1 : initialPage)

  const trpc = useTRPC()

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Persist page in URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('sayfa')
    } else {
      params.set('sayfa', String(page))
    }
    router.replace('?' + params.toString(), { scroll: false })
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery(
    trpc.dosya.list.queryOptions({
      search: debouncedSearch || undefined,
      tur: (tur as 'STK' | 'AT' | 'AH') || undefined,
      durum: (durum as 'aktif' | 'arsiv') || undefined,
      tarih_baslangic: tarihBaslangic || undefined,
      tarih_bitis: tarihBitis || undefined,
      page,
      pageSize: 25,
    })
  )

  const hasFilters = debouncedSearch || tur || durum || tarihBaslangic || tarihBitis

  function handleTurChange(val: string) {
    setTur(val as 'STK' | 'AT' | 'AH' | '')
    setPage(1)
  }

  function handleDurumChange(val: string) {
    setDurum(val as 'aktif' | 'arsiv' | '')
    setPage(1)
  }

  function getTurLabel(t: string) {
    if (t === 'STK') return 'STK'
    if (t === 'AT') return 'Asliye Ticaret'
    if (t === 'AH') return 'Asliye Hukuk'
    return t
  }

  function getTurBadge(t: string) {
    if (t === 'STK') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          {getTurLabel(t)}
        </Badge>
      )
    }
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
        {getTurLabel(t)}
      </Badge>
    )
  }

  function getDurumBadge(d: string) {
    if (d === 'aktif') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Aktif
        </Badge>
      )
    }
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
        Arşivlenmiş
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar Row 1: Search + New button */}
      <div className="flex items-center gap-3">
        <Input
          className="flex-1"
          placeholder="Dosya no veya müvekkil adı ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button asChild>
          <Link href="/dosyalar/yeni">Yeni Dosya Oluştur</Link>
        </Button>
      </div>

      {/* Toolbar Row 2: Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-muted-foreground">Tür</label>
          <Select value={tur} onValueChange={handleTurChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tümü</SelectItem>
              <SelectItem value="STK">STK</SelectItem>
              <SelectItem value="AT">Asliye Ticaret</SelectItem>
              <SelectItem value="AH">Asliye Hukuk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-muted-foreground">Durum</label>
          <Select value={durum} onValueChange={handleDurumChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tümü</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="arsiv">Arşivlenmiş</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-muted-foreground">Başlangıç</label>
          <Input
            type="date"
            className="w-[160px]"
            value={tarihBaslangic}
            onChange={(e) => { setTarihBaslangic(e.target.value); setPage(1) }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-muted-foreground">Bitiş</label>
          <Input
            type="date"
            className="w-[160px]"
            value={tarihBitis}
            onChange={(e) => { setTarihBitis(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dosya No</TableHead>
              <TableHead>Müvekkil Adı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Sigorta Türü</TableHead>
              <TableHead>Karşı Sigorta Şirketi</TableHead>
              <TableHead>Poliçe No</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.rows.length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  {hasFilters ? (
                    <p className="text-sm text-muted-foreground">
                      Arama veya filtre kriterlerine uyan dosya bulunamadı.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Henüz dosya oluşturulmadı</p>
                      <p className="text-sm text-muted-foreground">
                        İlk dosyanızı oluşturmak için &quot;Yeni Dosya Oluştur&quot; düğmesine tıklayın.
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push('/dosyalar/' + row.id)}
                >
                  <TableCell className="font-medium">{row.dosya_no}</TableCell>
                  <TableCell>{row.muvekkil_ad ?? '—'}</TableCell>
                  <TableCell>{getTurBadge(row.tur)}</TableCell>
                  <TableCell>{row.sigorta_turu_ad ?? '—'}</TableCell>
                  <TableCell>{row.karsitaraf_sigorta_ad ?? '—'}</TableCell>
                  <TableCell>{row.police_no ?? '—'}</TableCell>
                  <TableCell>{getDurumBadge(row.durum)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) setPage(page - 1)
                }}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault()
                      setPage(p)
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page < data.totalPages) setPage(page + 1)
                }}
                aria-disabled={page >= data.totalPages}
                className={page >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
