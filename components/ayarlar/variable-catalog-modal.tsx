'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { VARIABLE_REGISTRY } from '@/lib/docx/variable-registry'
import { toast } from 'sonner'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'

interface VariableCatalogModalProps {
  sablon: { id: number; ad: string; degiskenler: string[] } | null
  onOpenChange: (open: boolean) => void
}

const JINJA2_EXAMPLES = [
  { filter: 'upper', example: '{{ muvekkil.ad | upper }}', desc: 'Büyük harfe çevir' },
  { filter: 'lower', example: '{{ muvekkil.ad | lower }}', desc: 'Küçük harfe çevir' },
  { filter: 'title', example: '{{ muvekkil.ad_soyad | title }}', desc: 'Her kelimenin ilk harfi büyük' },
  { filter: 'capitalize', example: '{{ muvekkil.ad | capitalize }}', desc: 'İlk harf büyük, geri kalan küçük' },
  { filter: 'default', example: '{{ dosya.aciklama | default("—") }}', desc: 'Boşsa varsayılan değer' },
  { filter: 'default(true)', example: '{{ dosya.talep_tutari | default(0, true) }}', desc: 'None veya boşsa varsayılan' },
  { filter: 'round', example: '{{ dosya.talep_tutari | round(2) }}', desc: 'Ondalık basamağa yuvarla' },
  { filter: 'replace', example: '{{ muvekkil.telefon | replace(" ", "") }}', desc: 'Karakter değiştir' },
  { filter: 'truncate', example: '{{ dosya.aciklama | truncate(50) }}', desc: 'Belirli uzunlukta kes' },
  { filter: 'join', example: '{{ liste | join(", ") }}', desc: 'Listeyi birleştir' },
]

export function VariableCatalogModal({ sablon, onOpenChange }: VariableCatalogModalProps) {
  const variables = sablon?.degiskenler ?? []
  const sorted = [...variables].sort((a, b) => a.localeCompare(b, 'tr'))
  const [showFilters, setShowFilters] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  function handleCopy(v: string) {
    const text = `{{ ${v} }}`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVar(v)
      toast.success(`Kopyalandı: ${text}`)
      setTimeout(() => setCopiedVar(null), 1500)
    }).catch(() => toast.error('Kopyalanamadı.'))
  }

  function handleCopyExample(example: string) {
    navigator.clipboard.writeText(example).then(() => {
      toast.success(`Kopyalandı: ${example}`)
    }).catch(() => toast.error('Kopyalanamadı.'))
  }

  return (
    <Dialog open={sablon !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sablon?.ad ?? ''} — Değişkenler</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Bu şablonda değişken bulunmuyor.
            </p>
          )}
          {sorted.map((v) => {
            const basePath = v.includes('|') ? v.split('|')[0].trim() : v
            const known = VARIABLE_REGISTRY.find((r) => r.path === basePath)
            const isCopied = copiedVar === v
            return (
              <div
                key={v}
                role="button"
                tabIndex={0}
                aria-label={`${v} değişkenini kopyala`}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                onClick={() => handleCopy(v)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(v) } }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Copy className={`h-3.5 w-3.5 shrink-0 transition-colors ${isCopied ? 'text-green-600' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                  <code className="text-sm font-mono truncate">{'{{ '}{v}{' }}'}</code>
                </div>
                {known ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-300 shrink-0 ml-2"
                  >
                    ✓ Bilinen
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-600 shrink-0 ml-2">
                    ⚠ Bilinmeyen
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {/* Jinja2 filter examples */}
        <div className="border-t pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-between py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowFilters((s) => !s)}
          >
            <span>Jinja2 Filtre Örnekleri</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showFilters && (
            <div className="mt-1 space-y-1 max-h-52 overflow-y-auto">
              {JINJA2_EXAMPLES.map((ex) => (
                <div
                  key={ex.filter}
                  role="button"
                  tabIndex={0}
                  aria-label={`${ex.example} örneğini kopyala`}
                  className="flex items-start justify-between rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer group"
                  onClick={() => handleCopyExample(ex.example)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopyExample(ex.example) } }}
                >
                  <div className="min-w-0">
                    <code className="text-xs font-mono text-foreground">{ex.example}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{ex.desc}</p>
                  </div>
                  <Copy className="h-3.5 w-3.5 shrink-0 mt-0.5 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
