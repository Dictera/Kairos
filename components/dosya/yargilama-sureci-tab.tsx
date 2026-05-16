'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import {
  parseSurecDetay, STK_ASAMALAR, STK_ASAMA_LABELS,
  MAHKEME_ASAMALAR, MAHKEME_ASAMA_LABELS,
} from '@/lib/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SurecStepper } from './surec-stepper'
import { StkDataForm } from './stk-data-form'
import { MahkemeDataForm } from './mahkeme-data-form'
import { DurusmaList } from './durusma-list'
import { SureList } from './sure-list'

type YargilamaSureciTabProps = {
  dosyaId: number
  dosyaTur: string  // 'STK' | 'AT' | 'AH'
  surecDetayRaw: string | null
}

export function YargilamaSureciTab({
  dosyaId,
  dosyaTur,
  surecDetayRaw,
}: YargilamaSureciTabProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const surecDetay = parseSurecDetay(surecDetayRaw)
  const stk = surecDetay.stk
  const mahkeme = surecDetay.mahkeme

  const stkIleriAlMutation = useMutation(
    trpc.surec.stkIleriAl.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        const label = STK_ASAMA_LABELS[data.asama as keyof typeof STK_ASAMA_LABELS] ?? data.asama
        toast.success(`Aşama güncellendi: ${label}`)
      },
      onError: () => toast.error('Aşama güncellenirken hata oluştu. Sayfayı yenileyip tekrar deneyin.'),
    })
  )

  const stkGeriAlMutation = useMutation(
    trpc.surec.stkGeriAl.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        const label = STK_ASAMA_LABELS[data.asama as keyof typeof STK_ASAMA_LABELS] ?? data.asama
        toast.success(`Aşama güncellendi: ${label}`)
      },
      onError: (err) => toast.error(err.message ?? 'Geri alınırken hata oluştu.'),
    })
  )

  const initMahkemeMutation = useMutation(
    trpc.surec.initMahkemeSurec.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Mahkeme süreci başlatıldı.')
      },
      onError: (err) => toast.error(err.message ?? 'İşlem sırasında hata oluştu.'),
    })
  )

  const mahkemeIleriAlMutation = useMutation(
    trpc.surec.mahkemeIleriAl.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        const label = MAHKEME_ASAMA_LABELS[data.asama as keyof typeof MAHKEME_ASAMA_LABELS] ?? data.asama
        toast.success(`Aşama güncellendi: ${label}`)
      },
      onError: () => toast.error('Aşama güncellenirken hata oluştu. Sayfayı yenileyip tekrar deneyin.'),
    })
  )

  const mahkemeGeriAlMutation = useMutation(
    trpc.surec.mahkemeGeriAl.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        const label = MAHKEME_ASAMA_LABELS[data.asama as keyof typeof MAHKEME_ASAMA_LABELS] ?? data.asama
        toast.success(`Aşama güncellendi: ${label}`)
      },
      onError: (err) => toast.error(err.message ?? 'Geri alınırken hata oluştu.'),
    })
  )

  const showStk = dosyaTur === 'STK'
  const showMahkemeSection = dosyaTur === 'AT' || dosyaTur === 'AH' || (dosyaTur === 'STK' && mahkeme)

  const handleMahkemeIleriAl = () => {
    mahkemeIleriAlMutation.mutate({ dosya_id: dosyaId })
  }

  const handleMahkemeGeriAl = () => {
    mahkemeGeriAlMutation.mutate({ dosya_id: dosyaId })
  }

  const handleStkIleriAl = () => {
    stkIleriAlMutation.mutate({ dosya_id: dosyaId })
  }

  const handleStkGeriAl = () => {
    stkGeriAlMutation.mutate({ dosya_id: dosyaId })
  }

  return (
    <div className="space-y-8">
      {/* STK Section - only for STK tur */}
      {showStk && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">STK Tahkim Süreci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SurecStepper
              stages={STK_ASAMALAR}
              labels={STK_ASAMA_LABELS}
              current={stk?.asama ?? null}
              onAdvance={handleStkIleriAl}
              onBack={handleStkGeriAl}
              isPending={stkIleriAlMutation.isPending || stkGeriAlMutation.isPending}
            />
            <StkDataForm dosyaId={dosyaId} initialData={stk} />
          </CardContent>
        </Card>
      )}

      {/* Separator between STK and Mahkeme */}
      {showStk && showMahkemeSection && <Separator className="my-6" />}

      {/* Mahkeme Section */}
      {showMahkemeSection ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mahkeme Süreci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SurecStepper
              stages={MAHKEME_ASAMALAR}
              labels={MAHKEME_ASAMA_LABELS}
              current={mahkeme?.asama ?? null}
              onAdvance={handleMahkemeIleriAl}
              onBack={handleMahkemeGeriAl}
              isPending={mahkemeIleriAlMutation.isPending || mahkemeGeriAlMutation.isPending}
            />
            <MahkemeDataForm dosyaId={dosyaId} initialData={mahkeme} />
          </CardContent>
        </Card>
      ) : showStk && !mahkeme ? (
        /* Mahkeme activation button for STK files without mahkeme */
        <Button
          variant="outline"
          onClick={() => initMahkemeMutation.mutate({ dosya_id: dosyaId })}
          disabled={initMahkemeMutation.isPending}
        >
          {initMahkemeMutation.isPending ? 'Başlatılıyor...' : 'Mahkeme Sürecini Başlat'}
        </Button>
      ) : null}

      {/* Durusma Section - always shown for all file types */}
      <DurusmaList dosyaId={dosyaId} />

      {/* Süreler Section */}
      <Separator className="my-6" />
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Süreler</h3>
        <SureList dosyaId={dosyaId} />
      </div>
    </div>
  )
}
