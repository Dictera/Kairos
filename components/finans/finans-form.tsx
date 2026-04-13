'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface FinansFormProps {
  dosyaId: number
  onSuccess?: () => void
  editId?: number
  initialData?: {
    tur: 'Gelen' | 'Giden' | 'Masraf'
    tutar: number
    tarih: string
    aciklama?: string
  }
  onCancel?: () => void
}

export function FinansForm({ dosyaId, onSuccess, editId, initialData, onCancel }: FinansFormProps) {
  const [tur, setTur] = useState<'Gelen' | 'Giden' | 'Masraf' | ''>(initialData?.tur ?? '')
  const [tutar, setTutar] = useState(initialData?.tutar?.toString() ?? '')
  const [tarih, setTarih] = useState(initialData?.tarih ?? format(new Date(), 'yyyy-MM-dd'))
  const [aciklama, setAciklama] = useState(initialData?.aciklama ?? '')
  
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const createMutation = useMutation(
    trpc.finans.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.finans.list.queryKey({ dosya_id: dosyaId }) })
        queryClient.invalidateQueries({ queryKey: trpc.finans.getSummary.queryKey({ dosya_id: dosyaId }) })
        toast.success('Finans kaydı eklendi')
        resetForm()
        onSuccess?.()
      },
      onError: (err) => toast.error('Kayıt başarısız: ' + (err.message || 'Bilinmeyen hata'))
    })
  )
  
  const updateMutation = useMutation(
    trpc.finans.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.finans.list.queryKey({ dosya_id: dosyaId }) })
        queryClient.invalidateQueries({ queryKey: trpc.finans.getSummary.queryKey({ dosya_id: dosyaId }) })
        toast.success('Finans kaydı güncellendi')
        onCancel?.()
      },
      onError: (err) => toast.error('Güncelleme başarısız: ' + (err.message || 'Bilinmeyen hata'))
    })
  )
  
  const resetForm = () => {
    setTur('')
    setTutar('')
    setTarih(format(new Date(), 'yyyy-MM-dd'))
    setAciklama('')
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tur || !tutar || !tarih) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      return
    }
    
    const data = {
      dosya_id: dosyaId,
      tur: tur as 'Gelen' | 'Giden' | 'Masraf',
      tutar: parseFloat(tutar),
      tarih,
      aciklama: aciklama || '',
    }
    
    if (editId) {
      updateMutation.mutate({ id: editId, ...data })
    } else {
      createMutation.mutate(data)
    }
  }
  
  const isPending = createMutation.isPending || updateMutation.isPending
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div className="space-y-2">
        <Label htmlFor="tur">Tür *</Label>
        <Select value={tur} onValueChange={(v) => setTur(v as typeof tur)}>
          <SelectTrigger id="tur" className="w-[200px]">
            <SelectValue placeholder="Seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Gelen">Gelen (Giriş)</SelectItem>
            <SelectItem value="Giden">Giden (Çıkış)</SelectItem>
            <SelectItem value="Masraf">Masraf</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="tutar">Tutar (TL) *</Label>
        <Input
          id="tutar"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          className="w-[200px]"
        />
      </div>
      
      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="tarih">Tarih *</Label>
        <DatePickerField
          value={tarih}
          onChange={(value) => setTarih(value ?? format(new Date(), 'yyyy-MM-dd'))}
          placeholder="Tarih seçin"
        />
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          id="aciklama"
          placeholder="Açıklama girin (opsiyonel)"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          rows={2}
          className="max-w-[400px]"
        />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        {editId && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        )}
      </div>
    </form>
  )
}
