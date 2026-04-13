'use client'

import { useState, useCallback } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileIcon, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BELGE_KATEGORILER } from '@/lib/schema'
import { toast } from 'sonner'

interface BelgeUploadProps {
  dosyaId: number
  dosyaNo: string
  onUploadComplete?: () => void
}

export function BelgeUpload({ dosyaId, dosyaNo, onUploadComplete }: BelgeUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [kategori, setKategori] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const createMutation = useMutation(
    trpc.belge.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId }) })
        toast.success('Belge yüklendi')
        setFile(null)
        setKategori('')
        setError(null)
        onUploadComplete?.()
      },
      onError: (err) => {
        toast.error('Belge kaydedilemedi: ' + err.message)
      }
    })
  )
  
  const handleFile = useCallback((selectedFile: File) => {
    setError(null)
    
    // Validate type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ]
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('İzin verilmeyen dosya türü. Yalnızca PDF, DOC, DOCX, JPG, PNG kabul edilir.')
      return
    }
    
    // Validate size (20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Dosya boyutu 20 MB\'ı aşamaz.')
      return
    }
    
    setFile(selectedFile)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [handleFile])
  
  const handleUpload = async () => {
    if (!file || !kategori) {
      setError('Lütfen hem dosya seçin hem de kategori belirleyin.')
      return
    }
    
    // Upload to Route Handler
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dosyaId', dosyaId.toString())
    formData.append('dosyaNo', dosyaNo)
    
    let uploadResult
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Yükleme başarısız')
      }
      uploadResult = await res.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız. Lütfen tekrar deneyin.')
      return
    }
    
    // Call tRPC to save metadata
    createMutation.mutate({
      dosya_id: dosyaId,
      dosya_no: dosyaNo,
      kategori: kategori as typeof BELGE_KATEGORILER[number],
      dosya_adi: uploadResult.dosya_adi,
      dosya_yolu: uploadResult.dosya_yolu,
      dosya_boyutu: uploadResult.dosya_boyutu,
      mime_tur: uploadResult.mime_tur,
    })
  }
  
  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select value={kategori} onValueChange={setKategori}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            {BELGE_KATEGORILER.map((kat) => (
              <SelectItem key={kat} value={kat}>{kat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Drop zone - accent color per UI-SPEC */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-muted'}
          ${file ? 'border-[var(--accent)]' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon className="h-8 w-8 text-[var(--accent)]" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setFile(null); setError(null) }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              Dosyayı sürükle & bırak veya tıkla
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, JPG, PNG — maks. 20 MB
            </p>
          </>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      {/* Upload button - accent colored per UI-SPEC */}
      <Button
        onClick={handleUpload}
        disabled={!file || !kategori || createMutation.isPending}
        className="bg-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        {createMutation.isPending ? 'Yükleniyor...' : 'Belge Yükle'}
      </Button>
    </div>
  )
}
