---
status: partial
phase: 18-arsiv-ve-belge-entegrasyonu
source: 18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md
started: 2026-04-21T23:00:00.000Z
updated: 2026-04-21T23:05:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. belge_turu Dropdown in Template Upload
expected: |
  When uploading a new DOCX template via the Şablon Yönetimi page, a "Belge Türü" dropdown appears
  with options: Dilekçe, Delil, Rapor, Sözleşme, Tebligat, Muhbir, Diğer, İcra.
  Selecting one and submitting creates the template with that belge_turu stored in the database.
result: pass

### 2. belge_turu Dropdown in Template Overwrite
expected: |
  When overwriting an existing template (clicking the değiştir button), the overwrite dialog shows
  a "Belge Türü" dropdown pre-populated with the template's current belge_turu (if set).
  Changing it and confirming updates the template's belge_turu in the database.
result: pass

### 3. PDF Generation Archives to Correct Path
expected: |
  Using "Şablondan Üret" on a file, after successful PDF generation:
  - The PDF exists at ./uploads/sablon-pdf/YYYY/MM/{kategori-slug}/{müvekkil-slug}-{plaka-slug}-{uuid}.pdf
  - A belge record exists in the database with matching dosya_yolu
  - An olay_gunlugu entry with olay_turu='belge' is created
result: blocked
blocked_by: prior-phase
reason: "UI button (Şablondan Üret) not built yet — Phase 19 feature"

### 4. Concurrent PDF Generation Creates Unique Files
expected: |
  Generating two PDFs for the same case+template rapidly (or same dosya_id + sablon_id)
  results in two distinct PDF files with different UUID suffixes — no file overwriting occurs.
result: blocked
blocked_by: prior-phase
reason: "UI button (Şablondan Üret) not built yet — Phase 19 feature"

### 5. DB Failure Deletes Temp PDF
expected: |
  If the belge record insertion fails (e.g., DB constraint violation), any temp PDF that was
  moved to the archive directory is deleted (rollback), preventing orphaned PDFs on disk.
result: blocked
blocked_by: prior-phase
reason: "UI button (Şablondan Üret) not built yet — Phase 19 feature"

## Summary

total: 5
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 3

## Gaps

[none — migration was the only gap, now fixed]