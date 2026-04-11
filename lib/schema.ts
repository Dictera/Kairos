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

// ── Relations ────────────────────────────────────────────────────────────────

export const muvekkilRelations = relations(muvekkil, ({ many }) => ({
  dosyalar: many(dosya),
}))

export const dosyaRelations = relations(dosya, ({ one, many }) => ({
  muvekkil: one(muvekkil, { fields: [dosya.muvekkil_id], references: [muvekkil.id] }),
  sigortaTuru: one(sigortaTuru, { fields: [dosya.sigorta_turu_id], references: [sigortaTuru.id] }),
  karsitarafSigorta: one(sigortaSirketi, { fields: [dosya.karsitaraf_sigorta_id], references: [sigortaSirketi.id] }),
  taraflar: many(taraf),
}))

export const tarafRelations = relations(taraf, ({ one }) => ({
  dosya: one(dosya, { fields: [taraf.dosya_id], references: [dosya.id] }),
  sigortaSirketi: one(sigortaSirketi, { fields: [taraf.sigorta_sirketi_id], references: [sigortaSirketi.id] }),
}))

export const sigortaSirketiRelations = relations(sigortaSirketi, ({ many }) => ({
  dosyalar: many(dosya),
  taraflar: many(taraf),
}))

export const sigortaTuruRelations = relations(sigortaTuru, ({ many }) => ({
  dosyalar: many(dosya),
}))
