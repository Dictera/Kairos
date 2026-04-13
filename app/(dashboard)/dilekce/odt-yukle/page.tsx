'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, FileText } from 'lucide-react'
import { varSyntax } from '@/lib/utils'

const KATEGORILER = ['STK', 'Mahkeme', 'Genel'] as const

const DEGISKENLER = [
  { name: 'müvekkil_adı', desc: 'Müvekkil\'in adı' },
  { name: 'müvekkil_soyadı', desc: 'Müvekkil\'in soyadı' },
  { name: 'dosya_no', desc: 'Dosya numarası' },
  { name: 'dava_no', desc: 'Dava numarası (mahkeme)' },
  { name: 'stk_no', desc: 'STK başvuru numarası' },
  { name: 'mahkeme', desc: 'Mahkeme adı' },
  { name: 'durusma_tarihi', desc: 'Duruşma tarihi' },
  { name: 'talep_tutari', desc: 'Talep edilen tutar' },
  { name: 'sigorta_şirketi', desc: 'Sigorta şirketi adı' },
  { name: 'karsitaraf', desc: 'Karşı tarafın adı' },
  { name: 'karsitaraf_vekil', desc: 'Karşı taraf vekili' },
  { name: 'police_no', desc: 'Poliçe numarası' },
  { name: 'basvuru_tarihi', desc: 'Başvuru tarihi' },
  { name: 'karar_tarihi', desc: 'Karar tarihi' },
  { name: 'tebligat_tarihi', desc: 'Tebligat tarihi' },
]

export default function YeniOdtSablonPage() {
  const router = useRouter()
  const trpc = useTRPC()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [baslik, setBaslik] = useState('')
  const [kategori, setKategori] = useState<string>('')
  const [dosyaAdi, setDosyaAdi] = useState('')
  const [dosyaData, setDosyaData] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [customVarsText, setCustomVarsText] = useState('')

  const uploadMutation = useMutation(trpc.dilekceOdt.upload.mutationOptions({
    onSuccess: () => {
      toast.success('ODT şablon yüklendi')
      router.push('/dilekce')
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message)
    },
  }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.odt')) {
      toast.error('Lütfen .odt uzantılı dosya seçin')
      return
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    setDosyaData(base64)
    setDosyaAdi(file.name)
    setFileName(file.name.replace('.odt', ''))

    if (!baslik) {
      setBaslik(file.name.replace('.odt', ''))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!baslik || !kategori || !dosyaData) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    const customVars = customVarsText
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)

    uploadMutation.mutate({
      baslik,
      kategori: kategori as 'STK' | 'Mahkeme' | 'Genel',
      dosyaAdi,
      dosyaData,
      customVariables: customVars,
    })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">ODT Şablon Yükle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          LibreOffice Writer ile hazırlanmış .odt şablon dosyası yükleyin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Şablon Bilgileri</CardTitle>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ODT Dosya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".odt"
                className="hidden"
                onChange={handleFileChange}
              />

              {dosyaData ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">.odt dosya seçili</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    .odt dosyası yüklemek için tıklayın
                  </p>
                  <p className="text-xs text-muted-foreground">
                    LibreOffice Writer ile hazırlanmış şablon
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customVars">Özel Değişkenler (opsiyonel)</Label>
              <Input
                id="customVars"
                value={customVarsText}
                onChange={(e) => setCustomVarsText(e.target.value)}
                placeholder="örn: vekil_ad, mahkeme_ad (virgülle ayırın)"
              />
              <p className="text-xs text-muted-foreground">
                ODT dosyasında otomatik bulunamayan değişkenler varsa ekleyin
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanılabilir Değişkenler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ODT dosyasında <code className="bg-muted px-1 py-0.5 rounded text-xs">{varSyntax('degisken_adı')}</code> formatında değişkenler kullanın.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DEGISKENLER.map((v) => (
                <div key={v.name} className="flex items-start gap-2 text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary shrink-0">
                    {varSyntax(v.name)}
                  </code>
                  <span className="text-muted-foreground text-xs">{v.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              Ayrıca LibreOffice Writer&#39;da Ekle &rarr; Alan &rarr; Değişkenler ekleyerek de değişken oluşturabilirsiniz.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={uploadMutation.isPending || !dosyaData}>
            {uploadMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
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
