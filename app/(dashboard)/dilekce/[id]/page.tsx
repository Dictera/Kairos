'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SablonEditor } from '@/components/dilekce/sablon-editor'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const KATEGORILER = ['STK', 'Mahkeme', 'Genel'] as const

type Props = {
  params: Promise<{ id: string }>
}

export default function DuzenleSablonPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const trpc = useTRPC()
  const sablonId = parseInt(resolvedParams.id, 10)

  const [baslik, setBaslik] = useState('')
  const [kategori, setKategori] = useState<string>('')
  const [icerik, setIcerik] = useState('')
  const [customVarsText, setCustomVarsText] = useState('')
  const [initialized, setInitialized] = useState(false)

  const { data: sablon, isLoading } = useQuery(trpc.dilekce.byId.queryOptions({ id: sablonId }))

  useEffect(() => {
    if (sablon && !initialized) {
      setBaslik(sablon.baslik)
      setKategori(sablon.kategori)
      setIcerik(sablon.icerik)
      try {
        const parsedVars = JSON.parse(sablon.degiskenler || '[]')
        setCustomVarsText(parsedVars.join(', '))
      } catch {
        setCustomVarsText('')
      }
      setInitialized(true)
    }
  }, [sablon, initialized])

  const updateMutation = useMutation(trpc.dilekce.update.mutationOptions({
    onSuccess: () => {
      toast.success('Şablon güncellendi')
      router.push('/dilekce')
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message)
    },
  }))

  const deleteMutation = useMutation(trpc.dilekce.delete.mutationOptions({
    onSuccess: () => {
      toast.success('Şablon silindi')
      router.push('/dilekce')
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message)
    },
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!baslik || !kategori || !icerik) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }
    
    const customVars = customVarsText
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)
    
    updateMutation.mutate({
      id: sablonId,
      baslik,
      kategori: kategori as 'STK' | 'Mahkeme' | 'Genel',
      icerik,
      degiskenler: customVars,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!sablon) {
    return (
      <div className="p-8">
        <p className="text-destructive">Şablon bulunamadı.</p>
        <Button variant="link" onClick={() => router.push('/dilekce')}>
          Listeye dön
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Şablonu Düzenle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dilekçe şablonunu düzenlemek için formu kullanın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baslik">Başlık</Label>
              <Input
                id="baslik"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Örn: STK Başvuru Dilekçesi"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger id="kategori">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORILER.map((kat) => (
                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customVars">Özel Değişkenler (opsiyonel)</Label>
              <Input
                id="customVars"
                value={customVarsText}
                onChange={(e) => setCustomVarsText(e.target.value)}
                placeholder="örn: musteri_tc, vekil_ad (virgülle ayırın)"
              />
              <p className="text-xs text-muted-foreground">
                Özel değişkenler virgülle ayırarak ekleyin. &#123;&#123;değişken_adı&#125;&#125; formatında kullanılır.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İçerik</CardTitle>
          </CardHeader>
          <CardContent>
            <SablonEditor
              content={icerik}
              onChange={setIcerik}
              customVariables={customVarsText.split(',').map(v => v.trim()).filter(v => v)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
                deleteMutation.mutate({ id: sablonId })
              }
            }}
          >
            Sil
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dilekce')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  )
}