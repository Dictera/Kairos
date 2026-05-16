'use client'

import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

import { Pill, REPORT_ICONS, type ReportIconKey } from './raporlar-shared'
import { REPORTS } from './rapor-detay'

// ── Report card ─────────────────────────────────────────────────────────────

function ReportCard({ id, label, iconKey, tag, tagColor, desc }: {
  id: string; label: string; iconKey: ReportIconKey
  tag: string; tagColor: string; desc: string
}) {
  const Icon: LucideIcon = REPORT_ICONS[iconKey]
  return (
    <Link href={`/raporlar/${id}`} className="group block">
      <div className="bg-card border rounded-xl p-5 h-full transition-all hover:-translate-y-px hover:border-[color:var(--accent)] hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-[38px] h-[38px] rounded-lg flex items-center justify-center"
            style={{ background: `${tagColor}18` }}
          >
            <Icon className="h-[18px] w-[18px]" style={{ color: tagColor }} />
          </div>
          <Pill label={tag} color={tagColor} />
        </div>
        <p className="text-[14px] font-bold mb-1.5 tracking-tight">{label}</p>
        <p className="text-[12.5px] text-muted-foreground leading-snug" style={{ textWrap: 'pretty' }}>
          {desc}
        </p>
        <div className="flex items-center gap-1 mt-3.5 text-muted-foreground group-hover:text-[color:var(--accent)] text-[12px] font-medium transition-colors">
          <span>Raporu Görüntüle</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  )
}

// ── Descriptions (not in shared REPORTS so hub stays separate) ───────────────

const DESC: Record<string, string> = {
  'yonetim-ozeti':   'Tüm sistemin tek sayfalık özeti, tazminat hunisi, uyarılar',
  'genel-bakis':     'Gelir/gider/net trendi, kasa, dönem bazlı aylık tablo',
  'tahsilat':        '3 kademeli analiz: talep → karar → tahsilat; şirket karşılaştırması',
  'sonuc-basari':    'Kazanma/kaybetme oranları, şirket & tür bazlı başarı analizi',
  'arabuluculuk':    'Arabuluculuk vs dava oranı, süre karşılaştırması, başarı oranları',
  'zamanasimi':      'Yaklaşan hak düşüm süreleri; acil, kritik ve dikkat gerektiren dosyalar',
  'dosya-raporu':    'Dosya durumu, tür analizi, yaş dağılımı, kâr marjı',
  'muvekkil-raporu': 'Müvekkil performansı, tahsilat oranları, aktivite',
  'dava-sureci':     'Aşama bazlı süre analizi, şirket çözüm süreleri, uzun dosyalar',
  'sirket-analizi':  '3 kademeli şirket sıralaması, tahsilat trendi',
}

// ── Hub page ─────────────────────────────────────────────────────────────────

export function RaporlarPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">Analiz ve Raporlama</p>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
      </div>

      <p className="text-[13px] text-muted-foreground max-w-xl leading-relaxed">
        Aşağıdaki raporlardan birini seçin. Tazminat raporları{' '}
        <strong className="text-foreground">talep → karar → tahsilat</strong>{' '}
        olmak üzere üç kademeli yapıda hazırlanmaktadır.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {REPORTS.map(r => (
          <ReportCard
            key={r.id}
            id={r.id}
            label={r.label}
            iconKey={r.iconKey}
            tag={r.tag}
            tagColor={r.tagColor}
            desc={DESC[r.id] ?? ''}
          />
        ))}
      </div>
    </div>
  )
}
