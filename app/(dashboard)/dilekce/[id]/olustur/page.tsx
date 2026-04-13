'use client'

import { use } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Eye } from 'lucide-react'
import { PdfOnizleme, usePdfPreview } from '@/components/dilekce/pdf-onizleme'
import { toast } from 'sonner'

type Props = {
  params: Promise<{ id: string }>
}

const KATEGORI_LABELS: Record<string, string> = {
  'STK': 'STK',
  'Mahkeme': 'Mahkeme',
  'Genel': 'Genel',
}

export default function OlusturDilekcePage({ params }: Props) {
  const resolvedParams = use(params)
  const trpc = useTRPC()
  const dosyaId = parseInt(resolvedParams.id, 10)
  
  const [selectedSablonId, setSelectedSablonId] = useState<number | null>(null)
  const [selectedKategori, setSelectedKategori] = useState<string>('STK')
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  
  const { pdfUrl, isGenerating, generatePreview, downloadPdf, cleanup } = usePdfPreview()
  
  // Fetch case data
  const { data: dosya } = useQuery(trpc.dosya.getById.queryOptions({ id: dosyaId }))
  const { data: muvekkil } = useQuery(trpc.muvekkil.getById.queryOptions({ id: dosya?.muvekkil_id || 0 }))
  
  // Fetch all templates
  const { data: sablonlar } = useQuery(trpc.dilekce.list.queryOptions())
  
  // Filter templates by category
  const filteredSablonlar = sablonlar?.filter(s => s.kategori === selectedKategori) || []
  
  // Set default selected template
  const selectedSablon = sablonlar?.find(s => s.id === selectedSablonId)
  
  const handleSablonSelect = (sablonId: number) => {
    setSelectedSablonId(sablonId)
    setCustomVariables({})
  }
  
  const handlePreview = async () => {
    if (!selectedSablonId) {
      toast.error('Lütfen bir şablon seçin')
      return
    }
    
    await generatePreview(selectedSablonId, dosyaId, customVariables)
    setPreviewOpen(true)
  }
  
  const handleSave = () => {
    // For now, just download the PDF
    // TODO: Save to belge table
    toast.success('PDF kaydedildi (geliştirme aşamasında)')
    downloadPdf()
  }
  
  const handleVariableChange = (key: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [key]: value }))
  }
  
  if (!dosya || !muvekkil) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dilekçe Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dosya: {dosya.dosya_no} - {muvekkil.ad} {muvekkil.soyad}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Şablon Seçimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedKategori} onValueChange={setSelectedKategori}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="STK">STK</TabsTrigger>
                <TabsTrigger value="Mahkeme">Mahkeme</TabsTrigger>
                <TabsTrigger value="Genel">Genel</TabsTrigger>
              </TabsList>
              
              {['STK', 'Mahkeme', 'Genel'].map((kat) => (
                <TabsContent key={kat} value={kat} className="mt-4">
                  <div className="space-y-2">
                    {filteredSablonlar.filter(s => s.kategori === kat).length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center">
                        Bu kategoride şablon yok
                      </p>
                    ) : (
                      filteredSablonlar.filter(s => s.kategori === kat).map((sablon) => (
                        <div
                          key={sablon.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:border-orange-300 transition-colors ${
                            selectedSablonId === sablon.id ? 'border-orange-500 bg-orange-50' : ''
                          }`}
                          onClick={() => handleSablonSelect(sablon.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{sablon.baslik}</span>
                            <Badge variant="outline">{KATEGORI_LABELS[kat]}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Güncellenme: {new Date(sablon.updated_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Variable Editing */}
        <Card>
          <CardHeader>
            <CardTitle>Değişkenler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSablon ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Şablon: <strong>{selectedSablon.baslik}</strong>
                </p>
                
                {/* Auto-filled variables */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Otomatik Doldurulan (Değiştirilebilir)</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="musteri_ad" className="text-xs">Müvekkil Adı</Label>
                    <Input
                      id="musteri_ad"
                      value={customVariables['müvekkil_adı'] || muvekkil.ad?.split(' ')[0] || ''}
                      onChange={(e) => handleVariableChange('müvekkil_adı', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="musteri_soyad" className="text-xs">Müvekkil Soyadı</Label>
                    <Input
                      id="musteri_soyad"
                      value={customVariables['müvekkil_soyadı'] || muvekkil.ad?.split(' ').slice(1).join(' ') || ''}
                      onChange={(e) => handleVariableChange('müvekkil_soyadı', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dosya_no" className="text-xs">Dosya No</Label>
                    <Input
                      id="dosya_no"
                      value={customVariables['dosya_no'] || dosya.dosya_no || ''}
                      onChange={(e) => handleVariableChange('dosya_no', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="talep_tutari" className="text-xs">Talep Tutarı</Label>
                    <Input
                      id="talep_tutari"
                      value={customVariables['talep_tutari'] || dosya.talep_tutari?.toString() || ''}
                      onChange={(e) => handleVariableChange('talep_tutari', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Custom variables from template */}
                {(function() {
                  try {
                    const templateVars = JSON.parse(selectedSablon.degiskenler || '[]') as string[]
                    if (templateVars.length === 0) return null
                    
                    return (
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="text-muted-foreground">Özel Değişkenler</Label>
                        {templateVars.map(function(varName) {
                          return (
                            <div key={varName} className="space-y-2">
                              <Label htmlFor={varName} className="text-xs">{varName}</Label>
                              <Input
                                id={varName}
                                value={customVariables[varName] || ''}
                                onChange={(e) => handleVariableChange(varName, e.target.value)}
                                placeholder={'{{' + varName + '}}'}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )
                  } catch (e) {
                    return null
                  }
                })()}
                
                <div className="pt-4 flex gap-2">
                  <Button 
                    onClick={handlePreview} 
                    disabled={isGenerating || !selectedSablonId}
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
                        Önizle
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Şablon seçin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* PDF Preview Modal */}
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