'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Props = {
  content: string
  onChange: (html: string) => void
  customVariables?: string[]
}

export function SablonEditor({ content, onChange, customVariables = [] }: Props) {
  return (
    <div className="space-y-2">
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">Kullanılabilir Değişkenler:</p>
        <p className="text-muted-foreground mb-1">&#123;&#123;müvekkil_adi&#125;&#125; - Müvekkil adı</p>
        <p className="text-muted-foreground mb-1">&#123;&#123;müvekkil_soyadi&#125;&#125; - Müvekkil soyadı</p>
        <p className="text-muted-foreground mb-1">&#123;&#123;dosya_no&#125;&#125; - Dosya numarası</p>
        <p className="text-muted-foreground mb-1">&#123;&#123;talep_tutari&#125;&#125; - Talep edilen tutar</p>
        {customVariables.length > 0 && customVariables.map((v) => (
          <p key={v} className="text-muted-foreground">&#123;&#123;{v}&#125;&#125; - Özel değişken</p>
        ))}
      </div>
      <Label htmlFor="icerik">İçerik</Label>
      <Textarea
        id="icerik"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Dilekçe içeriğini buraya yazın. Değişkenleri {{degisken_adı}} formatında kullanın."
        className="min-h-[400px] font-mono text-sm"
      />
    </div>
  )
}
