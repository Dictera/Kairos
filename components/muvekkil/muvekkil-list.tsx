'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, UserPlus } from 'lucide-react'

interface PendingDelete {
  id: number
  ad: string
  soyad: string
}

export function MuvekkilList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const currentPage = Number(searchParams.get('sayfa') ?? '1')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    trpc.muvekkil.list.queryOptions({ page: currentPage, pageSize: 25, search: search || undefined })
  )

  const deleteMutation = useMutation(
    trpc.muvekkil.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Silindi.')
        setPendingDelete(null)
        queryClient.invalidateQueries({ queryKey: ['muvekkil'] })
      },
      onError: (err) => {
        setPendingDelete(null)
        if (err.data?.code === 'PRECONDITION_FAILED') {
          toast.error(err.message)
        } else {
          toast.error('Silinemedi. Lütfen tekrar deneyin.')
        }
      },
    })
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setSearch(value)
      // Reset to page 1 on new search
      const params = new URLSearchParams(searchParams.toString())
      params.delete('sayfa')
      router.replace(`/muvekkiller?${params.toString()}`)
    }, 300)
  }, [searchParams, router])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('sayfa')
    } else {
      params.set('sayfa', String(page))
    }
    router.push(`/muvekkiller?${params.toString()}`)
  }

  const handleRowClick = (id: number) => {
    router.push(`/muvekkiller/${id}`)
  }

  const handleDeleteClick = (row: PendingDelete) => {
    setDeleteError(null)
    setPendingDelete(row)
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    deleteMutation.mutate({ id: pendingDelete.id })
  }

  const totalPages = data?.totalPages ?? 1

  const renderPaginationItems = () => {
    const pages: number[] = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="İsim veya TC/Vergi No ile ara..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Button asChild className="bg-primary text-primary-foreground">
          <Link href="/muvekkiller/yeni">
            <UserPlus className="mr-2 h-4 w-4" />
            Yeni Müvekkil Ekle
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Ad Soyad</TableHead>
              <TableHead className="font-semibold">Telefon</TableHead>
              <TableHead className="font-semibold">IBAN</TableHead>
              <TableHead className="font-semibold">TC / Vergi No</TableHead>
              <TableHead className="font-semibold">Bağlı Dosya Sayısı</TableHead>
              <TableHead className="font-semibold w-12">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  {search ? (
                    <p className="text-sm text-muted-foreground">Arama kriterlerine uyan müvekkil bulunamadı.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Henüz müvekkil eklenmedi</p>
                      <p className="text-sm text-muted-foreground">
                        Yeni bir müvekkil kaydı oluşturmak için &quot;Yeni Müvekkil Ekle&quot; düğmesine tıklayın.
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data?.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.id)}
                >
                  <TableCell className="font-medium">
                    {row.ad} {row.soyad}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.telefon ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.iban ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.tc_vergi_no ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.dosya_count > 0 ? row.dosya_count : '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">İşlemler</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/muvekkiller/${row.id}/duzenle`)}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick({ id: row.id, ad: row.ad, soyad: row.soyad })}
                        >
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Önceki"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {renderPaginationItems().map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="Sonraki"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) handlePageChange(currentPage + 1)
                }}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müvekkili Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müvekkili silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
