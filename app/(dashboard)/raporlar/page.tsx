'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import {
  ChevronLeft, ArrowRight,
  Star, BarChart2, Funnel, Trophy, Handshake,
  AlertTriangle, FolderOpen, Users, Scale, Shield,
} from 'lucide-react'
import { YonetimOzeti  } from '@/components/raporlar/yonetim-ozeti'
import { GenelBakis    } from '@/components/raporlar/genel-bakis'
import { TahsilatRaporu} from '@/components/raporlar/tahsilat-raporu'
import { SonucBasari   } from '@/components/raporlar/sonuc-basari'
import { Arabuluculuk  } from '@/components/raporlar/arabuluculuk'
import { ZamanasimRiski} from '@/components/raporlar/zamanasimi-riski'
import { DosyaRaporu   } from '@/components/raporlar/dosya-raporu'
import { MuvekkilRaporu} from '@/components/raporlar/muvekkil-raporu'
import { DavaSureci    } from '@/components/raporlar/dava-sureci'
import { SirketAnalizi } from '@/components/raporlar/sirket-analizi'

// ── Proje renk paleti (finans-data.ts ile uyumlu) ────────────────────────────
const C = {
  gelen:  '#1fa570',
  giden:  '#c94141',
  masraf: '#ca8a04',
  net:    '#1c768f',
  purple: '#746cac',
  orange: '#e07b39',
} as const

// ── Rapor kataloğu ────────────────────────────────────────────────────────────
const RAPORLAR = [
  {
    id: 'ozet',
    label: 'Yönetim Özeti',
    tag: 'Özet',
    tagColor: C.masraf,
    Icon: Star,
    desc: 'Tüm sistemin tek sayfalık özeti — KPI\'lar, uyarılar, tahsilat hunisi',
  },
  {
    id: 'genel',
    label: 'Genel Bakış',
    tag: 'Finansal',
    tagColor: C.net,
    Icon: BarChart2,
    desc: 'Aylık gelir/gider/net trendi ve kümülatif kasa bakiyesi',
  },
  {
    id: 'tahsilat',
    label: 'Tahsilat Raporu',
    tag: 'Finansal',
    tagColor: C.net,
    Icon: Funnel,
    desc: '3 kademe: talep → karar → tahsilat; şirket karşılaştırması',
  },
  {
    id: 'sonuc',
    label: 'Sonuç & Başarı',
    tag: 'Analiz',
    tagColor: C.gelen,
    Icon: Trophy,
    desc: 'Kazanma/kaybetme oranları, dava türü ve şirket bazlı başarı analizi',
  },
  {
    id: 'arabuluculuk',
    label: 'Arabuluculuk',
    tag: 'Süreç',
    tagColor: C.purple,
    Icon: Handshake,
    desc: 'Arabuluculuk vs dava oranı, süre karşılaştırması, başarı oranları',
  },
  {
    id: 'zamanasimi',
    label: 'Zamanaşımı Riski',
    tag: 'Risk',
    tagColor: C.giden,
    Icon: AlertTriangle,
    desc: 'Yaklaşan hak düşüm süreleri — kritik, uyarı ve normal dosyalar',
  },
  {
    id: 'dosya',
    label: 'Dosya Raporu',
    tag: 'Operasyonel',
    tagColor: C.orange,
    Icon: FolderOpen,
    desc: 'Dosya durumu, tür analizi, kâr marjı ve sonuç dağılımı',
  },
  {
    id: 'muvekkil',
    label: 'Müvekkil Raporu',
    tag: 'CRM',
    tagColor: C.purple,
    Icon: Users,
    desc: 'Müvekkil bazında tahsilat, dosya sayısı ve net bakiye',
  },
  {
    id: 'dava',
    label: 'Dava Süreci & Süre',
    tag: 'Süreç',
    tagColor: C.purple,
    Icon: Scale,
    desc: 'Aşama bazlı süre analizi, şirket çözüm süreleri, uzun dosyalar',
  },
  {
    id: 'sirket',
    label: 'Şirket Analizi',
    tag: 'Analiz',
    tagColor: C.gelen,
    Icon: Shield,
    desc: '3 kademeli şirket sıralaması — talep, karar, tahsilat karşılaştırması',
  },
] as const

type RaporId = typeof RAPORLAR[number]['id']

// ── Rapor kartı ────────────────────────────────────────────────────────────────
function RaporKarti({
  rapor,
  onClick,
}: {
  rapor: typeof RAPORLAR[number]
  onClick: () => void
}) {
  const { label, tag, tagColor, Icon, desc } = rapor
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card border border-border rounded-xl p-5
                 flex flex-col gap-3 cursor-pointer
                 transition-all duration-150
                 hover:border-[var(--accent)] hover:shadow-md hover:-translate-y-0.5
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Üst satır: ikon + etiket */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${tagColor}1a` }}
        >
          <Icon size={18} style={{ color: tagColor }} />
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${tagColor}18`, color: tagColor }}
        >
          {tag}
        </span>
      </div>

      {/* Başlık */}
      <p className="text-sm font-bold tracking-tight leading-tight">{label}</p>

      {/* Açıklama */}
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>

      {/* Alt link */}
      <div
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground
                   group-hover:text-accent-foreground transition-colors pt-1 border-t border-border"
      >
        Raporu Görüntüle
        <ArrowRight size={11} />
      </div>
    </button>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────
export default function RaporlarPage() {
  const trpc = useTRPC()
  const [aktif, setAktif] = useState<RaporId | null>(null)

  const aktifRapor = RAPORLAR.find(r => r.id === aktif) ?? null

  // ── Sorgular (sadece ilgili sekme açıkken etkin) ──────────────────────────
  const { data: yonetimData, isLoading: yonetimLoading } = useQuery({
    ...trpc.rapor.yonetimOzeti.queryOptions(), enabled: aktif === 'ozet',
  })
  const { data: genelData, isLoading: genelLoading } = useQuery({
    ...trpc.rapor.genelBakis.queryOptions(), enabled: aktif === 'genel',
  })
  const { data: tahsilatData, isLoading: tahsilatLoading } = useQuery({
    ...trpc.rapor.tahsilat.queryOptions(), enabled: aktif === 'tahsilat',
  })
  const { data: sonucData, isLoading: sonucLoading } = useQuery({
    ...trpc.rapor.sonucBasari.queryOptions(), enabled: aktif === 'sonuc',
  })
  const { data: arabuluculukData, isLoading: arabuluculukLoading } = useQuery({
    ...trpc.rapor.arabuluculuk.queryOptions(), enabled: aktif === 'arabuluculuk',
  })
  const { data: zamanasimData, isLoading: zamanasimLoading } = useQuery({
    ...trpc.rapor.zamanasimi.queryOptions(), enabled: aktif === 'zamanasimi',
  })
  const { data: dosyaData, isLoading: dosyaLoading } = useQuery({
    ...trpc.rapor.dosyaRaporu.queryOptions(), enabled: aktif === 'dosya',
  })
  const { data: muvekkilData, isLoading: muvekkilLoading } = useQuery({
    ...trpc.rapor.muvekkilRaporu.queryOptions(), enabled: aktif === 'muvekkil',
  })
  const { data: davaData, isLoading: davaLoading } = useQuery({
    ...trpc.rapor.davaSureci.queryOptions(), enabled: aktif === 'dava',
  })
  const { data: sirketData, isLoading: sirketLoading } = useQuery({
    ...trpc.rapor.sirketAnalizi.queryOptions(), enabled: aktif === 'sirket',
  })

  const yukleniyor = (
    <div className="py-16 text-center text-sm text-muted-foreground">Yükleniyor…</div>
  )

  // ── Rapor içeriği ──────────────────────────────────────────────────────────
  function RaporIcerigi() {
    switch (aktif) {
      case 'ozet':
        return yonetimLoading ? yukleniyor : yonetimData ? <YonetimOzeti data={yonetimData} /> : yukleniyor
      case 'genel':
        return genelLoading ? yukleniyor : genelData ? <GenelBakis data={genelData} /> : yukleniyor
      case 'tahsilat':
        return tahsilatLoading ? yukleniyor : tahsilatData ? <TahsilatRaporu data={tahsilatData} /> : yukleniyor
      case 'sonuc':
        return sonucLoading ? yukleniyor : sonucData ? <SonucBasari data={sonucData} /> : yukleniyor
      case 'arabuluculuk':
        return arabuluculukLoading ? yukleniyor : arabuluculukData ? <Arabuluculuk data={arabuluculukData} /> : yukleniyor
      case 'zamanasimi':
        return zamanasimLoading ? yukleniyor : zamanasimData ? <ZamanasimRiski data={zamanasimData} /> : yukleniyor
      case 'dosya':
        return dosyaLoading ? yukleniyor : dosyaData ? <DosyaRaporu data={dosyaData} /> : yukleniyor
      case 'muvekkil':
        return muvekkilLoading ? yukleniyor : muvekkilData ? <MuvekkilRaporu data={muvekkilData} /> : yukleniyor
      case 'dava':
        return davaLoading ? yukleniyor : davaData ? <DavaSureci data={davaData} /> : yukleniyor
      case 'sirket':
        return sirketLoading ? yukleniyor : sirketData ? <SirketAnalizi data={sirketData} /> : yukleniyor
      default:
        return null
    }
  }

  // ── HUB görünümü ──────────────────────────────────────────────────────────
  if (!aktif) {
    return (
      <div className="p-6 space-y-6">
        {/* Başlık */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Raporlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aşağıdaki raporlardan birini seçin. Tazminat raporları{' '}
            <strong>talep → karar → tahsilat</strong> olmak üzere üç kademeli yapıda hazırlanmaktadır.
          </p>
        </div>

        {/* 3 sütunlu kart grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RAPORLAR.map(rapor => (
            <RaporKarti
              key={rapor.id}
              rapor={rapor}
              onClick={() => setAktif(rapor.id)}
            />
          ))}
        </div>

        {/* Alt bilgi çubuğu */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl text-xs text-muted-foreground">
          <span>
            Son güncelleme:{' '}
            <strong className="text-foreground">{new Date().toLocaleDateString('tr-TR')}</strong>
          </span>
          <span className="w-px h-4 bg-border" />
          <span>{RAPORLAR.length} rapor mevcut</span>
          <span className="w-px h-4 bg-border" />
          <span
            className="font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${C.giden}18`, color: C.giden }}
          >
            Zamanaşımı riski var mı? → Zamanaşımı Raporu&apos;nu kontrol edin
          </span>
        </div>
      </div>
    )
  }

  // ── RAPOR görünümü ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      {/* Yapışık başlık */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAktif(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
            Raporlar
          </button>
          <span className="text-border">›</span>
          <div className="flex items-center gap-2">
            {aktifRapor && (
              <aktifRapor.Icon size={14} style={{ color: aktifRapor.tagColor }} />
            )}
            <h1 className="text-sm font-semibold">{aktifRapor?.label}</h1>
            {aktifRapor && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${aktifRapor.tagColor}18`,
                  color: aktifRapor.tagColor,
                }}
              >
                {aktifRapor.tag}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rapor içeriği */}
      <div className="p-6 flex-1">
        <RaporIcerigi />
      </div>
    </div>
  )
}
