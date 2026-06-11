// Turkish-aware text folding — the SINGLE source of truth for search normalization.
// Used in three places, all of which MUST agree byte-for-byte:
//   1. lib/db.ts registers it as the `lower_tr()` SQLite function (LIKE fallback path)
//   2. FTS5 trigram content is stored already-folded (write path)
//   3. FTS5 MATCH queries are folded before binding (read path)
// Folds ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i, İ→i (both cases) then lowercases.
export function foldTr(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    // JS lowercases 'İ' to 'i' + U+0307 (combining dot above); strip it so
    // uppercase-İ queries fold to clean ASCII and match stored text.
    .replace(/̇/g, '')
}

// Folded searchable blob for a dosya row (own fields + linked müvekkil name).
export function dosyaFtsText(d: {
  dosya_no?: string | null
  hasar_dosya_no?: string | null
  muvekkil_plaka?: string | null
  ad?: string | null
  soyad?: string | null
}): string {
  return foldTr([d.dosya_no, d.hasar_dosya_no, d.muvekkil_plaka, d.ad, d.soyad]
    .filter(Boolean).join(' '))
}

// Folded searchable blob for a müvekkil row.
export function muvekkilFtsText(m: {
  ad?: string | null
  soyad?: string | null
  tc_vergi_no?: string | null
  telefon?: string | null
}): string {
  return foldTr([m.ad, m.soyad, m.tc_vergi_no, m.telefon].filter(Boolean).join(' '))
}

// Minimum query length for the trigram index to engage. Shorter queries can't be
// indexed by the trigram tokenizer and must fall back to a LIKE scan.
export const FTS_MIN_LEN = 3

// Build a trigram MATCH argument: fold, then wrap as a quoted string literal so
// FTS5 treats it as a substring to find (not as FTS query syntax). Doubles any
// embedded double-quote. Returns null when too short to use the index.
export function ftsMatchQuery(query: string): string | null {
  const folded = foldTr(query).trim()
  if (folded.length < FTS_MIN_LEN) return null
  return '"' + folded.replace(/"/g, '""') + '"'
}
