'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Eye, FileText } from 'lucide-react'
import { PdfOnizleme, usePdfPreview } from '@/components/dilekce/pdf-onizleme'
import { toast } from 'sonner'

type Props = {
  params: Promise<{ id: string }>
}

export default function OlusturOdtDilekcePage({ params }: Props) {
  const resolvedParams = use(params)
  const trpc = useTRPC()
  const sablonId = parseInt(resolvedParams.id, 10)
  
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [templateVariables, setTemplateVariables] = useState<string[]>([])
  
  const { pdfUrl, isGenerating, generatePreview, downloadPdf, cleanup } = usePdfPreview()
  
  const { data: sablon } = useQuery(trpc.dilekceOdt.byId.queryOptions({ id: sablonId }))
  const { data: dosya } = useQuery(trpc.dosya.getById.queryOptions({ id: sablonId }))
  const { data: muvekkil } = useQuery(trpc.muvekkil.getById.queryOptions({ id: dosya?.muvekkil_id || 0 }))
  
  useEffect(() => {
    if (sablon) {
      try {
        const vars = JSON.parse(sablon.degiskenler || '[]')
        setTemplateVariables(vars)
      } catch {
        setTemplateVariables([])
      }
    }
  }, [sablon])
  
  useEffect(() => {
    if (dosya && muvekkil) {
      const autoFilled: Record<string, string> = {
        musteri_adi: muvekkil.ad?.split(' ')[0] || '',
        musteri_soyadi: muvekkil.ad?.split(' ').slice(1).join(' ') || '',
        dosya_no: dosya.dosya_no || '',
        talep_tutari: dosya.talep_tutari?.toString() || '',
      }
      setCustomVariables(prev => ({ ...autoFilled, ...prev }))
    }
  }, [dosya, muvekkil])
  
  const handlePreview = async () => {
    try {
      await generatePreview(sablonId, parseInt(resolvedParams.id, 10), customVariables, 'odt')
      setPreviewOpen(true)
    } catch (error: any) {
      toast.error(error.message || 'PDF oluşturulamadı')
    }
  }
  
  const handleSave = () => {
    toast.success('PDF kaydedildi (geliştirme aşamasında)')
    downloadPdf()
  }
  
  const handleVariableChange = (key: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [key]: value }))
  }
  
  if (!sablon || !dosya || !muvekkil) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">ODT Şablon ile Dilekçe Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dosya: {dosya.dosya_no} - {muvekkil.ad} {muvekkil.soyad}
        </p>
        <p className="text-sm text-muted-foreground">
          Şablon: {sablon.baslik}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Değişkenler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ODT şablonundaki {'{{'}değişken_adı{'}}'} formatındaki alanları doldurun.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="musteri_adi">Müvekkil Adı</Label>
              <Input
                id="musteri_adi"
                value={customVariables['musteri_adi'] || ''}
                onChange={(e) => handleVariableChange('musteri_adi', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="musteri_soyadi">Müvekkil Soyadı</Label>
              <Input
                id="musteri_soyadi"
                value={customVariables['musteri_soyadi'] || ''}
                onChange={(e) => handleVariableChange('musteri_soyadi', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dosya_no">Dosya No</Label>
              <Input
                id="dosya_no"
                value={customVariables['dosya_no'] || ''}
                onChange={(e) => handleVariableChange('dosya_no', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="talep_tutari">Talep Tutarı</Label>
              <Input
                id="talep_tutari"
                value={customVariables['talep_tutari'] || ''}
                onChange={(e) => handleVariableChange('talep_tutari', e.target.value)}
              />
            </div>
          </div>
          
          {templateVariables.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Şablondaki Özel Değişkenler:</p>
              <div className="grid grid-cols-2 gap-4">
                {templateVariables.map((varName) => (
                  <div key={varName} className="space-y-2">
                    <Label htmlFor={varName}>{varName}</Label>
                    <Input
                      id={varName}
                      value={customVariables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      placeholder={`{{${varName}}}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePreview} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  PDF Önizle
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <PdfOnizleme
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={pdfUrl}
        onSave={handleSave}
        onDownload={downloadPdf}
      />
    </div>
  )
}
