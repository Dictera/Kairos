'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SablonEditor } from '@/components/dilekce/sablon-editor'
import { toast } from 'sonner'

const KATEGORILER = ['İtiraz Dilekçesi', 'Cevap Dilekçesi', 'Genel'] as const

export default function YeniSablonPage() {
  const router = useRouter()
  const trpc = useTRPC()
  const [baslik, setBaslik] = useState('')
  const [kategori, setKategori] = useState<string>('')
  const [icerik, setIcerik] = useState('')
  const [customVarsText, setCustomVarsText] = useState('')

  const createMutation = useMutation(trpc.dilekce.create.mutationOptions({
    onSuccess: () => {
      toast.success('Şablon oluşturuldu')
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
    
    createMutation.mutate({
      baslik,
      kategori: kategori as 'İtiraz Dilekçesi' | 'Cevap Dilekçesi' | 'Genel',
      icerik,
      degiskenler: customVars,
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Yeni Şablon Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dilekçe şablonu oluşturmak için formu doldurun
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
                placeholder="Örn: İtiraz Dilekçesi - STK"
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
                Özel değişkenler virgülle ayırarak ekleyin. {{değişken_adı}} formatında kullanılır.
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
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
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