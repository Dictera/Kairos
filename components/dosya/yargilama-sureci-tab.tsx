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

  const initMahkemeMutation = useMutation(
    trpc.surec.initMahkemeSurec.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
        toast.success('Mahkeme süreci başlatıldı.')
      },
      onError: (err) => toast.error(err.message ?? 'İşlem sırasında hata oluştu.'),
    })
  )

  const showStk = dosyaTur === 'STK'
  const showMahkemeSection = dosyaTur === 'AT' || dosyaTur === 'AH' || (dosyaTur === 'STK' && mahkeme)

  const handleStkIleriAl = () => {
    stkIleriAlMutation.mutate({ dosya_id: dosyaId })
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
              isPending={stkIleriAlMutation.isPending}
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
          <CardContent>
            <p className="text-sm text-muted-foreground py-8 text-center">
              Mahkeme süreci bileşeni Plan 03 ile eklenecek.
            </p>
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

      {/* Separator before Durusma section */}
      {showMahkemeSection && <Separator className="my-6" />}

      {/* Durusma Section stub */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duruşmalar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Duruşma listesi Plan 03 ile eklenecek.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
