'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string | null // Object URL for preview
  onSave: () => void
  onDownload: () => void
}

export function PdfOnizleme({ open, onOpenChange, pdfUrl, onSave, onDownload }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Önizleme</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4">
          {/* PDF preview area */}
          <ScrollArea className="flex-1 border rounded-md bg-gray-50">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full min-h-[500px]"
                title="PDF Önizleme"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                PDF yükleniyor...
              </div>
            )}
          </ScrollArea>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onSave}>
              Dilekçe Kaydet
            </Button>
            <Button onClick={onDownload}>
              İndir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to manage PDF preview state and generation
 */
export function usePdfPreview() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const generatePreview = async (sablonId: number, dosyaId: number, customVariables: Record<string, string>) => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/dilekce/${sablonId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sablonId, dosyaId, customVariables }),
      })
      
      if (!response.ok) throw new Error('PDF generation failed')
      
      const blob = await response.blob()
      setPdfBlob(blob)
      setPdfUrl(URL.createObjectURL(blob))
    } finally {
      setIsGenerating(false)
    }
  }
  
  const downloadPdf = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dilekce.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const cleanup = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
  }
  
  return { pdfUrl, pdfBlob, isGenerating, generatePreview, downloadPdf, cleanup }
}