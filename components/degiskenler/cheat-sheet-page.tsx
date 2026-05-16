'use client'

import { VARIABLE_REGISTRY, type VariableInfo } from '@/lib/docx/variable-registry'
import { useState } from 'react'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const TAB_ORDER: Array<{ key: string; label: string }> = [
  { key: 'genel', label: 'Genel' },
  { key: 'taraflar', label: 'Taraflar' },
  { key: 'surec', label: 'Süreç' },
  { key: 'durusmalar', label: 'Duruşmalar' },
  { key: 'finans', label: 'Finans' },
  { key: 'notlar', label: 'Notlar' },
]

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
  { name: 'tr_currency', description: 'Türk Lirası formatında para birimi (örn. 150.000,00 TL)' },
  { name: 'tarih', description: 'Tarih formatı (örn. 14.02.2026)' },
  { name: 'upper_tr', description: 'Büyük harf (Türkçe karakter duyarlı: ı→I, İ→i)' },
  { name: 'lower_tr', description: 'Küçük harf (Türkçe karakter duyarlı)' },
]

function groupByTab(vars: VariableInfo[]): Record<string, VariableInfo[]> {
  return vars.reduce<Record<string, VariableInfo[]>>((acc, v) => {
    ;(acc[v.tab] ||= []).push(v)
    return acc
  }, {})
}

export function CheatSheetPage() {
  const grouped = groupByTab(VARIABLE_REGISTRY)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

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
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Değişken Listesi</h1>
        <p className="text-sm text-muted-foreground">
          Şablonlarda kullanılabilen tüm değişkenler ve açıklamaları. Değişkenlere tıklayarak kopyalayabilirsiniz.
        </p>
      </div>

      {TAB_ORDER.map(({ key, label }) => {
        const vars = grouped[key] ?? []
        if (vars.length === 0) return null
        return (
          <section key={key} className="space-y-3">
            <h2 className="text-base font-semibold">{label}</h2>
            <div className="border rounded-lg divide-y">
              {vars.map((v) => {
                const isCopied = copiedVar === v.path
                return (
                  <div
                    key={v.path}
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between gap-4 p-3 cursor-pointer hover:bg-muted/50 rounded transition-colors group"
                    onClick={() => handleCopy(v.path)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(v.path) } }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Copy className={`h-3.5 w-3.5 shrink-0 transition-colors ${isCopied ? 'text-green-600' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                      <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded truncate">
                        {'{{ '}{v.path}{' }}'}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground text-right flex-shrink-0 max-w-[50%]">
                      {v.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Jinja2 Filtreler</h2>
        <button
          type="button"
          className="flex w-full items-center justify-between py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowFilters((s) => !s)}
        >
          <span>Filtre Örnekleri</span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showFilters && (
          <div className="border rounded-lg divide-y">
            {JINJA2_EXAMPLES.map((ex) => {
              const example = 'example' in ex ? (ex.example ?? '') : `{{ muvekkil.ad | ${ex.name ?? ''} }}`
              const desc = 'desc' in ex ? ex.desc : ex.description
              return (
                <div
                  key={ex.name ?? ex.filter}
                  role="button"
                  tabIndex={0}
                  className="flex items-start justify-between gap-4 p-3 cursor-pointer hover:bg-muted/50 rounded transition-colors group"
                  onClick={() => handleCopyExample(example)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopyExample(example) } }}
                >
                  <div className="min-w-0 flex-1">
                    <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded block truncate">
                      {example}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </div>
                  <Copy className="h-3.5 w-3.5 shrink-0 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
