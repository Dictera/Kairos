import {
  Star, BarChart3, Filter, Trophy, Handshake, AlertTriangle,
  Folder, Users, Scale, Shield,
} from 'lucide-react'

// ── Icon registry ─────────────────────────────────────────────────────────────

export const REPORT_ICONS = {
  star:       Star,
  chart:      BarChart3,
  funnel:     Filter,
  trophy:     Trophy,
  handshake:  Handshake,
  alert:      AlertTriangle,
  folder:     Folder,
  users:      Users,
  scale:      Scale,
  shield:     Shield,
} as const

export type ReportIconKey = keyof typeof REPORT_ICONS

// ── Report definitions ────────────────────────────────────────────────────────

export interface ReportDef {
  id:           string
  label:        string
  iconKey:      ReportIconKey
  tag:          string
  tagColor:     string
  hasYilFilter?: boolean
}

export const REPORTS: ReportDef[] = [
  { id: 'yonetim-ozeti',  label: 'Yönetim Özeti',     iconKey: 'star',      tag: 'Özet',        tagColor: '#FA991C' },
  { id: 'genel-bakis',    label: 'Genel Bakış',        iconKey: 'chart',     tag: 'Finansal',    tagColor: '#1c768f', hasYilFilter: true },
  { id: 'tahsilat',       label: 'Tahsilat Raporu',    iconKey: 'funnel',    tag: 'Finansal',    tagColor: '#1c768f' },
  { id: 'sonuc-basari',   label: 'Sonuç & Başarı',     iconKey: 'trophy',    tag: 'Analiz',      tagColor: '#22c55e' },
  { id: 'arabuluculuk',   label: 'Arabuluculuk',       iconKey: 'handshake', tag: 'Süreç',       tagColor: '#746cac' },
  { id: 'zamanasimi',     label: 'Zamanaşımı Riski',   iconKey: 'alert',     tag: 'Risk',        tagColor: '#ef4444' },
  { id: 'dosya-raporu',   label: 'Dosya Raporu',       iconKey: 'folder',    tag: 'Operasyonel', tagColor: '#f97316' },
  { id: 'muvekkil-raporu',label: 'Müvekkil Raporu',    iconKey: 'users',     tag: 'CRM',         tagColor: '#746cac' },
  { id: 'dava-sureci',    label: 'Dava Süreci & Süre', iconKey: 'scale',     tag: 'Süreç',       tagColor: '#746cac' },
  { id: 'sirket-analizi', label: 'Şirket Analizi',     iconKey: 'shield',    tag: 'Analiz',      tagColor: '#f97316' },
]
