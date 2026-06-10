'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
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

const RETIREMENT_FLAG_KEY = 'retirement_v1_2_done'

export function RetirementModal() {
  const [showModal, setShowModal] = useState(false)
  const [checked, setChecked] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(RETIREMENT_FLAG_KEY) === '1'
  )
  const trpc = useTRPC()

  const { data: checkLegacy } = useQuery(
    trpc.retirement.checkLegacyTables.queryOptions(undefined, {
      enabled: !checked && typeof window !== 'undefined',
    })
  )

  const executeRetirement = useMutation(
    trpc.retirement.executeRetirement.mutationOptions({
      onSuccess: () => {
        localStorage.setItem(RETIREMENT_FLAG_KEY, '1')
        toast.success('Eski sistemler temizlendi. Sayfa yenileniyor…')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      },
      onError: (error) => {
        toast.error('Temizlik işlemi başarısız oldu: ' + error.message)
      },
    })
  )

  useEffect(() => {
    if (checkLegacy && !checked) {
      setChecked(true)
      if (checkLegacy.hasLegacyTables) {
        setShowModal(true)
      } else {
        localStorage.setItem(RETIREMENT_FLAG_KEY, '1')
      }
    }
  }, [checkLegacy, checked])

  const handleRetire = () => {
    executeRetirement.mutate()
  }

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eski Sistemleri Temizle</AlertDialogTitle>
          <AlertDialogDescription>
            Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowModal(false)}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRetire}
            disabled={executeRetirement.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {executeRetirement.isPending ? 'Temizleniyor…' : 'Onayla'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}