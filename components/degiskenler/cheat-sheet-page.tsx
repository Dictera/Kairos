import { VARIABLE_REGISTRY, type VariableInfo } from '@/lib/docx/variable-registry'
import { CopyButton, CopyExampleButton } from './copy-button'

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
              {vars.map((v) => (
                <div
                  key={v.path}
                  className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50 rounded transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CopyButton text={v.path} />
                    <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded truncate">
                      {'{{ '}{v.path}{' }}'}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground text-right flex-shrink-0 max-w-[50%]">
                    {v.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Jinja2 Filtreler</h2>
        <div className="border rounded-lg divide-y">
          {JINJA2_EXAMPLES.map((ex) => {
            const example = 'example' in ex ? (ex.example ?? '') : `{{ muvekkil.ad | ${ex.name ?? ''} }}`
            const desc = 'desc' in ex ? ex.desc : ex.description
            return (
              <div
                key={ex.name ?? ex.filter}
                className="flex items-start justify-between gap-4 p-3 hover:bg-muted/50 rounded transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded block truncate">
                    {example}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
                <CopyExampleButton example={example} />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
