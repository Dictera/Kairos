import { integer, text, real, sqliteTable, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

// ── Lookup tables ────────────────────────────────────────────────────────────

export const sigortaSirketi = sqliteTable('sigorta_sirketi', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  mersis_no: text('mersis_no'),
  vergi_no: text('vergi_no').notNull().default(''),
  bagli_oldugu_vergi_dairesi: text('bagli_oldugu_vergi_dairesi'),
  ihtar_mail: text('ihtar_mail'),
  kep_mail: text('kep_mail'),
})

export const avukat = sqliteTable('avukat', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  tbb_sicil_no: text('tbb_sicil_no').notNull(),
  iban: text('iban'),
  eposta: text('eposta'),
  telefon: text('telefon'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const avukatSigortaSirketi = sqliteTable('avukat_sigorta_sirketi', {
  avukat_id: integer('avukat_id').notNull().references(() => avukat.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').notNull().references(() => sigortaSirketi.id, { onDelete: 'cascade' }),
}, (t) => [
  index('idx_avukat_sirketi_avukat').on(t.avukat_id),
  index('idx_avukat_sirketi_sirketi').on(t.sigorta_sirketi_id),
  uniqueIndex('uniq_avukat_sirketi').on(t.avukat_id, t.sigorta_sirketi_id),
])

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
  'İHTAR', 'ARABULUCULUK', 'BAŞVURU', 'ÖN_İNCELEME',
  'BİLİRKİŞİ', 'ISLAH', 'KARAR', 'İTİRAZ', 'KESİNLEŞME',
] as const
export type StkAsama = typeof STK_ASAMALAR[number]

export const MAHKEME_ASAMALAR = [
  'DAVA_DİLEKÇESİ_TEBLİĞ', 'CEVAP_DİLEKÇESİ_TEBLİĞ',
  'REPLİK_DİLEKÇESİ_TEBLİĞ', 'DUPLİK_DİLEKÇESİ_TEBLİĞ',
  'ÖN_İNCELEME', 'BİLİRKİŞİ', 'DURUŞMALAR',
  'KARAR', 'KARAR_TEBLİĞ', 'İSTİNAF', 'TEMYİZ', 'KESİNLEŞME',
] as const
export type MahkemeAsama = typeof MAHKEME_ASAMALAR[number]

export type StkSurecData = {
  asama: StkAsama | null
  ihtar_tarihi: string | null
  arabuluculuk_son_tutanak_tarihi: string | null
  basvuru_tarihi: string | null
  stk_esas_no: string | null
  stk_karar_no: string | null
  stk_itiraz_esas_no: string | null
  stk_itiraz_karar_no: string | null
  bilirkisi_ucret_talep_tarihi: string | null
  bilirkisi_raporu_tebliğ_tarihi: string | null
  islah_tarihi: string | null
  karar_tarihi: string | null
  kesinlesme_tarihi: string | null
}

export type MahkemeSurecData = {
  asama: MahkemeAsama | null
  ilk_derece_esas_no: string | null
  ilk_derece_karar_no: string | null
  ilk_derece_mahkeme_adi: string | null
  istinaf_esas_no: string | null
  istinaf_karar_no: string | null
  istinaf_mahkeme_adi: string | null
  temyiz_esas_no: string | null
  temyiz_karar_no: string | null
  temyiz_mahkeme_adi: string | null
  dava_dilekcesi_tebliğ_tarihi: string | null
  cevap_dilekcesi_tebliğ_tarihi: string | null
  replik_dilekcesi_tebliğ_tarihi: string | null
  duplik_dilekcesi_tebliğ_tarihi: string | null
  bilirkisi_ucret_talep_tarihi: string | null
  bilirkisi_raporu_tebliğ_tarihi: string | null
  karar_tebliğ_tarihi: string | null
  istinaf_dilekcesi_tebliğ_tarihi: string | null
  istinaf_karar_tebliğ_tarihi: string | null
  temyiz_dilekcesi_tebliğ_tarihi: string | null
  temyiz_karar_tebliğ_tarihi: string | null
  kesinlesme_tarihi: string | null
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

// ── Sure (Deadline) types ──────────────────────────────────────────────────────

export const SURE_TUR = ['stk_itiraz', 'istinaf', 'cevap_dilekce', 'manuel'] as const
export type SureTur = typeof SURE_TUR[number]

// ── Sure (Deadline) table ─────────────────────────────────────────────────────

export const sure = sqliteTable('sure', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  ad: text('ad').notNull(),
  son_tarih: text('son_tarih').notNull(),  // YYYY-MM-DD
  tur: text('tur').notNull(),              // SureTur
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_sure_dosya').on(t.dosya_id),
  index('idx_sure_son_tarih').on(t.son_tarih),
])

export const sureRelations = relations(sure, ({ one }) => ({
  dosya: one(dosya, { fields: [sure.dosya_id], references: [dosya.id] }),
}))

// ── Stage Labels ─────────────────────────────────────────────────────────────

export const STK_ASAMA_LABELS: Record<StkAsama, string> = {
  'İHTAR': 'İhtar',
  'ARABULUCULUK': 'Arabuluculuk',
  'BAŞVURU': 'Başvuru',
  'ÖN_İNCELEME': 'Ön İnceleme',
  'BİLİRKİŞİ': 'Bilirkişi',
  'ISLAH': 'Islah',
  'KARAR': 'Karar',
  'İTİRAZ': 'İtiraz',
  'KESİNLEŞME': 'Kesinleşme',
}

export const MAHKEME_ASAMA_LABELS: Record<MahkemeAsama, string> = {
  'DAVA_DİLEKÇESİ_TEBLİĞ': 'Dava Dilekçesi Tebliğ',
  'CEVAP_DİLEKÇESİ_TEBLİĞ': 'Cevap Dilekçesi Tebliğ',
  'REPLİK_DİLEKÇESİ_TEBLİĞ': 'Replik Dilekçesi Tebliğ',
  'DUPLİK_DİLEKÇESİ_TEBLİĞ': 'Duplik Dilekçesi Tebliğ',
  'ÖN_İNCELEME': 'Ön İnceleme',
  'BİLİRKİŞİ': 'Bilirkişi',
  'DURUŞMALAR': 'Duruşmalar',
  'KARAR': 'Karar',
  'KARAR_TEBLİĞ': 'Karar Tebliğ',
  'İSTİNAF': 'İstinaf',
  'TEMYİZ': 'Temyiz',
  'KESİNLEŞME': 'Kesinleşme',
}

// ── Core entities ────────────────────────────────────────────────────────────

export const muvekkil = sqliteTable('muvekkil', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  soyad: text('soyad').notNull(),
  telefon: text('telefon'),
  tc_vergi_no: text('tc_vergi_no'),
  adres: text('adres'),
  notlar: text('notlar'),
  iban: text('iban'),
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
  hasar_dosya_no: text('hasar_dosya_no'),
  kaza_tarihi: text('kaza_tarihi'),
  muvekkil_sigorta_id: integer('muvekkil_sigorta_id').references(() => sigortaSirketi.id),
  kusur_orani_karsi: integer('kusur_orani_karsi'),
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
  dosya_id: integer('dosya_id').notNull().unique().references(() => dosya.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').references(() => sigortaSirketi.id),
  avukat_id: integer('avukat_id').references(() => avukat.id, { onDelete: 'set null' }),
  karsitaraf_ad: text('karsitaraf_ad'),
  police_no: text('police_no'),
  karsitaraf_plaka: text('karsitaraf_plaka'),     // nullable — D-12
  surucu_ad: text('surucu_ad'),                    // nullable — surucu (driver) info
  surucu_soyad: text('surucu_soyad'),              // nullable
  surucu_plaka: text('surucu_plaka'),              // nullable
  surucu_telefon: text('surucu_telefon'),          // nullable
  surucu_police_no: text('surucu_police_no'),       // nullable
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
  muvekkilSigorta: one(sigortaSirketi, { fields: [dosya.muvekkil_sigorta_id], references: [sigortaSirketi.id], relationName: 'muvekkilSigorta' }),
  taraflar: many(taraf),
  durusmalar: many(durusma),
  sureler: many(sure),
  belgeler: many(belge),
  finans_kalemleri: many(finans_kalemi),
  notlar: many(dosyaNot),
  olaylar: many(olayGunlugu),
}))

export const tarafRelations = relations(taraf, ({ one }) => ({
  dosya: one(dosya, { fields: [taraf.dosya_id], references: [dosya.id] }),
  sigortaSirketi: one(sigortaSirketi, { fields: [taraf.sigorta_sirketi_id], references: [sigortaSirketi.id] }),
  avukat: one(avukat, { fields: [taraf.avukat_id], references: [avukat.id] }),
}))

export const durusmaRelations = relations(durusma, ({ one }) => ({
  dosya: one(dosya, { fields: [durusma.dosya_id], references: [dosya.id] }),
}))

export const sigortaSirketiRelations = relations(sigortaSirketi, ({ many }) => ({
  dosyalar: many(dosya),
  taraflar: many(taraf),
  muvekkilSigortaDosyalar: many(dosya, { relationName: 'muvekkilSigorta' }),
  avukatlar: many(avukatSigortaSirketi),
}))

export const avukatRelations = relations(avukat, ({ many }) => ({
  sigortaSirketleri: many(avukatSigortaSirketi),
  taraflar: many(taraf),
}))

export const avukatSigortaSirketiRelations = relations(avukatSigortaSirketi, ({ one }) => ({
  avukat: one(avukat, { fields: [avukatSigortaSirketi.avukat_id], references: [avukat.id] }),
  sigortaSirketi: one(sigortaSirketi, { fields: [avukatSigortaSirketi.sigorta_sirketi_id], references: [sigortaSirketi.id] }),
}))

export const sigortaTuruRelations = relations(sigortaTuru, ({ many }) => ({
  dosyalar: many(dosya),
}))

// ── BELGE (Document) types ────────────────────────────────────────────────────

export const BELGE_KATEGORILER = ['Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer'] as const
export type BelgeKategori = typeof BELGE_KATEGORILER[number]

export const belge = sqliteTable('belge', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  dosya_no: text('dosya_no').notNull(),
  kategori: text('kategori').notNull(), // BELGE_KATEGORILER enum stored as text
  dosya_adi: text('dosya_adi').notNull(), // original filename
  dosya_yolu: text('dosya_yolu').notNull(), // /api/files/{dosyaId}/{filename}
  dosya_boyutu: integer('dosya_boyutu').notNull(), // bytes
  mime_tur: text('mime_tur').notNull(),
  sablon_id: integer('sablon_id').references(() => docxSablon.id, { onDelete: 'set null' }),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_belge_dosya').on(t.dosya_id),
  index('idx_belge_tarih').on(t.created_at),
  index('idx_belge_sablon').on(t.sablon_id),
  check('belge_kategori_check', sql`${t.kategori} IN ('Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer')`),
])

export const belgeRelations = relations(belge, ({ one }) => ({
  dosya: one(dosya, { fields: [belge.dosya_id], references: [dosya.id] }),
}))

// ── dosyaNot (Note) table ────────────────────────────────────────────────────

export const dosyaNot = sqliteTable('dosya_not', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  icerik: text('icerik').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_dosya_not_dosya').on(t.dosya_id),
])

export const dosyaNotRelations = relations(dosyaNot, ({ one }) => ({
  dosya: one(dosya, { fields: [dosyaNot.dosya_id], references: [dosya.id] }),
}))

// ── olayGunlugu (Activity Log) table ────────────────────────────────────────

export const OLAY_TURLERI = [
  'olusturma', 'durum_degisikligi', 'surec_asama', 'finans', 'belge', 'not', 'durusma', 'sure', 'guncelleme',
] as const
export type OlayTur = typeof OLAY_TURLERI[number]

export const olayGunlugu = sqliteTable('olay_gunlugu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  olay_turu: text('olay_turu').notNull(),
  aciklama: text('aciklama').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_olay_dosya').on(t.dosya_id),
  index('idx_olay_tarih').on(t.created_at),
])

export const olayGunluguRelations = relations(olayGunlugu, ({ one }) => ({
  dosya: one(dosya, { fields: [olayGunlugu.dosya_id], references: [dosya.id] }),
}))

// ── DOCX Şablon (docx_sablon) ──────────────────────────────────────────────

export const SABLON_KATEGORILER = ['STK', 'Mahkeme', 'Genel'] as const
export type SablonKategori = typeof SABLON_KATEGORILER[number]

export const docxSablon = sqliteTable('docx_sablon', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  kategori: text('kategori').notNull(),
  dosya_yolu: text('dosya_yolu').notNull(),
  degiskenler: text('degiskenler', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`(json_array())`),
  default_aksiyon: text('default_aksiyon'),
  belge_turu: text('belge_turu').$type<BelgeKategori | null>(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  check('kategori_check', sql`${t.kategori} IN ('STK', 'Mahkeme', 'Genel')`),
  check('belge_turu_check', sql`${t.belge_turu} IS NULL OR ${t.belge_turu} IN ('Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer')`),
  index('idx_sablon_kategori').on(t.kategori),
])

// ── dilekceSablonu ─────────────────────────────────────────────────────────

export const dilekceSablonu = sqliteTable('dilekce_sablonu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  baslik: text('baslik').notNull(),
  icerik: text('icerik').notNull(), // HTML from Tiptap editor
  kategori: text('kategori').notNull(), // 'İtiraz Dilekçesi' | 'Cevap Dilekçesi' | 'Genel'
  degiskenler: text('degiskenler').notNull().default('[]'), // JSON array of custom variable names
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_sablon_kategori').on(t.kategori),
])

export const dilekceSablonuRelations = relations(dilekceSablonu, ({ one }) => ({
  // No relations needed for this phase
}))

export const dilekceOdtSablonu = sqliteTable('dilekce_odt_sablonu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  baslik: text('baslik').notNull(),
  kategori: text('kategori').notNull(), // 'STK' | 'Mahkeme' | 'Genel'
  dosya_adi: text('dosya_adi').notNull(), // original filename.odt
  dosya_yolu: text('dosya_yolu').notNull(), // path to stored .odt file
  degiskenler: text('degiskenler').notNull().default('[]'), // JSON array of variable names found in template
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_odt_sablon_kategori').on(t.kategori),
])

// ── FINANS (Finance) types ───────────────────────────────────────────────────

export const FINANS_TUR = ['Gelen', 'Giden', 'Masraf'] as const
export type FinansTur = typeof FINANS_TUR[number]

export const finans_kalemi = sqliteTable('finans_kalemi', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  tur: text('tur').notNull(), // FINANS_TUR enum stored as text
  tutar: real('tutar').notNull(), // TL amount
  tarih: text('tarih').notNull(), // YYYY-MM-DD
  aciklama: text('aciklama'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_finans_dosya').on(t.dosya_id),
  index('idx_finans_tarih').on(t.tarih), // For dashboard aggregation
])

export const finans_kalemiRelations = relations(finans_kalemi, ({ one }) => ({
  dosya: one(dosya, { fields: [finans_kalemi.dosya_id], references: [dosya.id] }),
}))
