import { VARIABLE_REGISTRY, type VariableInfo } from '@/lib/docx/variable-registry'

const TAB_ORDER: Array<{ key: string; label: string }> = [
  { key: 'genel', label: 'Genel' },
  { key: 'taraflar', label: 'Taraflar' },
  { key: 'surec', label: 'Süreç' },
  { key: 'durusmalar', label: 'Duruşmalar' },
  { key: 'finans', label: 'Finans' },
  { key: 'notlar', label: 'Notlar' },
]

const JINJA_FILTERS: Array<{ name: string; description: string }> = [
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
          Şablonlarda kullanılabilen tüm değişkenler ve açıklamaları.
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
                <div key={v.path} className="flex items-start justify-between gap-4 p-3">
                  <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                    {'{{ '}{v.path}{' }}'}
                  </code>
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
          {JINJA_FILTERS.map((f) => (
            <div key={f.name} className="p-3">
              <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                {f.name}
              </code>
              <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
