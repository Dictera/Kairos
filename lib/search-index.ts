// FTS5 trigram index maintenance. Kept in sync at the application layer (inside
// the same transactions as the entity writes) rather than via SQL triggers — so
// there is no dependency on the lower_tr() function existing in the drizzle-kit
// migration connection. The FTS tables themselves are created idempotently in
// lib/db.ts (CREATE VIRTUAL TABLE IF NOT EXISTS).
import { sql, eq } from 'drizzle-orm'
import { db, type Transaction } from './db'
import { dosya, muvekkil } from './schema'
import { dosyaFtsText, muvekkilFtsText } from './turkish'

// Accepts either the db singleton or a transaction client — both expose .run().
type Client = Transaction | typeof db

// FTS5 (regular, not contentless) supports DELETE by rowid, so upsert = delete + insert.
export function upsertDosyaFts(client: Client, id: number, parts: Parameters<typeof dosyaFtsText>[0]) {
  client.run(sql`DELETE FROM dosya_fts WHERE rowid = ${id}`)
  client.run(sql`INSERT INTO dosya_fts(rowid, txt) VALUES (${id}, ${dosyaFtsText(parts)})`)
}

export function deleteDosyaFts(client: Client, id: number) {
  client.run(sql`DELETE FROM dosya_fts WHERE rowid = ${id}`)
}

export function upsertMuvekkilFts(client: Client, id: number, parts: Parameters<typeof muvekkilFtsText>[0]) {
  client.run(sql`DELETE FROM muvekkil_fts WHERE rowid = ${id}`)
  client.run(sql`INSERT INTO muvekkil_fts(rowid, txt) VALUES (${id}, ${muvekkilFtsText(parts)})`)
}

export function deleteMuvekkilFts(client: Client, id: number) {
  client.run(sql`DELETE FROM muvekkil_fts WHERE rowid = ${id}`)
}

// A müvekkil's name is denormalized into every dosya_fts row of that müvekkil.
// Call after a müvekkil name change to refresh all dependent dosya rows.
export function rebuildMuvekkilDosyaFts(tx: Transaction, muvekkilId: number) {
  const rows = tx.select({
    id: dosya.id,
    dosya_no: dosya.dosya_no,
    hasar_dosya_no: dosya.hasar_dosya_no,
    muvekkil_plaka: dosya.muvekkil_plaka,
    ad: muvekkil.ad,
    soyad: muvekkil.soyad,
  })
    .from(dosya)
    .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
    .where(eq(dosya.muvekkil_id, muvekkilId))
    .all()
  for (const r of rows) upsertDosyaFts(tx, r.id, r)
}
