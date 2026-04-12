import { integer, text, real, sqliteTable, index } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

// ── Lookup tables ────────────────────────────────────────────────────────────

export const sigortaSirketi = sqliteTable('sigorta_sirketi', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
})

export const sigortaTuru = sqliteTable('sigorta_turu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
})

export const mahkeme = sqliteTable('mahkeme', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  sehir: text('sehir'),
})

// ── STK & Mahkeme Stage Enums ─────────────────────────────────────────────

export const STK_ASAMALAR = [
  'BAŞVURU', 'KABUL', 'RAPORTÖR_ATANDI', 'RAPORTÖR_İNCELEME',
  'HAKEM_KURULU', 'HAKEM_KARARI', 'İTİRAZ_SÜRESİ', 'İTİRAZ_DAVASI', 'KARAR_KESİNLEŞTİ',
] as const
export type StkAsama = typeof STK_ASAMALAR[number]

export const MAHKEME_ASAMALAR = [
  'DAVA_AÇILDI', 'TEBLİGAT', 'CEVAP_DİLEKÇESİ', 'TAHKİKAT',
  'BİLİRKİŞİ', 'KARAR', 'İSTİNAF', 'KESİNLEŞTİ',
] as const
export type MahkemeAsama = typeof MAHKEME_ASAMALAR[number]

export type StkSurecData = {
  asama: StkAsama | null
  basvuru_no: string | null
  basvuru_tarihi: string | null
  kabul_tarihi: string | null
  raportor_adi: string | null
  bilirkisi: string | null
  hakem_karar_tarihi: string | null
  tebligat_tarihi: string | null
  itiraz_tarihi: string | null
}

export type MahkemeSurecData = {
  asama: MahkemeAsama | null
  esas_no: string | null
  karar_no: string | null
  mahkeme_adi: string | null
  dava_tarihi: string | null
  tebligat_tarihi: string | null
  karar_tarihi: string | null
}

export type SurecDetay = {
  stk?: StkSurecData
  mahkeme?: MahkemeSurecData
}

export function parseSurecDetay(raw: string | null): SurecDetay {
  if (!raw) return {}
  try { return JSON.parse(raw) as SurecDetay } catch { return {} }
}

export function serializeSurecDetay(data: SurecDetay): string {
  return JSON.stringify(data)
}

export const STK_ASAMA_LABELS: Record<StkAsama, string> = {
  'BAŞVURU': 'Başvuru',
  'KABUL': 'Kabul',
  'RAPORTÖR_ATANDI': 'Raportör Atandı',
  'RAPORTÖR_İNCELEME': 'Raportör İnceleme',
  'HAKEM_KURULU': 'Hakem Kurulu',
  'HAKEM_KARARI': 'Hakem Kararı',
  'İTİRAZ_SÜRESİ': 'İtiraz Süresi',
  'İTİRAZ_DAVASI': 'İtiraz Davası',
  'KARAR_KESİNLEŞTİ': 'Karar Kesinleşti',
}

export const MAHKEME_ASAMA_LABELS: Record<MahkemeAsama, string> = {
  'DAVA_AÇILDI': 'Dava Açıldı',
  'TEBLİGAT': 'Tebligat',
  'CEVAP_DİLEKÇESİ': 'Cevap Dilekçesi',
  'TAHKİKAT': 'Tahkikat',
  'BİLİRKİŞİ': 'Bilirkişi',
  'KARAR': 'Karar',
  'İSTİNAF': 'İstinaf',
  'KESİNLEŞTİ': 'Kesinleşti',
}

// ── Core entities ────────────────────────────────────────────────────────────

export const muvekkil = sqliteTable('muvekkil', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  soyad: text('soyad').notNull(),
  telefon: text('telefon'),
  email: text('email'),
  tc_vergi_no: text('tc_vergi_no'),
  adres: text('adres'),
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const dosya = sqliteTable('dosya', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  muvekkil_id: integer('muvekkil_id').notNull().references(() => muvekkil.id),
  dosya_no: text('dosya_no').notNull(),          // avukat dosya no — user-entered
  tur: text('tur').notNull(),                     // 'STK' | 'AT' | 'AH'
  sigorta_turu_id: integer('sigorta_turu_id').references(() => sigortaTuru.id),
  karsitaraf_sigorta_id: integer('karsitaraf_sigorta_id').references(() => sigortaSirketi.id),
  talep_tutari: real('talep_tutari'),
  muvekkil_plaka: text('muvekkil_plaka'),         // nullable — D-12
  durum: text('durum').notNull().default('aktif'), // 'aktif' | 'arsiv'
  aciklama: text('aciklama'),
  surec_detay: text('surec_detay'),  // JSON-encoded SurecDetay
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_dosya_muvekkil').on(t.muvekkil_id),
  index('idx_dosya_durum').on(t.durum),
  index('idx_dosya_tur').on(t.tur),
])

export const taraf = sqliteTable('taraf', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').references(() => sigortaSirketi.id),
  karsitaraf_ad: text('karsitaraf_ad'),
  karsitaraf_vekil: text('karsitaraf_vekil'),
  police_no: text('police_no'),
  karsitaraf_plaka: text('karsitaraf_plaka'),     // nullable — D-12
})

export const durusma = sqliteTable('durusma', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  tarih: text('tarih').notNull(),
  saat: text('saat'),
  mahkeme_kurum: text('mahkeme_kurum'),
  tur: text('tur'),
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_durusma_dosya').on(t.dosya_id),
  index('idx_durusma_tarih').on(t.tarih),
])

// ── Relations ────────────────────────────────────────────────────────────────

export const muvekkilRelations = relations(muvekkil, ({ many }) => ({
  dosyalar: many(dosya),
}))

export const dosyaRelations = relations(dosya, ({ one, many }) => ({
  muvekkil: one(muvekkil, { fields: [dosya.muvekkil_id], references: [muvekkil.id] }),
  sigortaTuru: one(sigortaTuru, { fields: [dosya.sigorta_turu_id], references: [sigortaTuru.id] }),
  karsitarafSigorta: one(sigortaSirketi, { fields: [dosya.karsitaraf_sigorta_id], references: [sigortaSirketi.id] }),
  taraflar: many(taraf),
  durusmalar: many(durusma),
}))

export const tarafRelations = relations(taraf, ({ one }) => ({
  dosya: one(dosya, { fields: [taraf.dosya_id], references: [dosya.id] }),
  sigortaSirketi: one(sigortaSirketi, { fields: [taraf.sigorta_sirketi_id], references: [sigortaSirketi.id] }),
}))

export const durusmaRelations = relations(durusma, ({ one }) => ({
  dosya: one(dosya, { fields: [durusma.dosya_id], references: [dosya.id] }),
}))

export const sigortaSirketiRelations = relations(sigortaSirketi, ({ many }) => ({
  dosyalar: many(dosya),
  taraflar: many(taraf),
}))

export const sigortaTuruRelations = relations(sigortaTuru, ({ many }) => ({
  dosyalar: many(dosya),
}))
