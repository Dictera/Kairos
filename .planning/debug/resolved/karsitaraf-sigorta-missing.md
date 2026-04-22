---
status: resolving
trigger: "Karşı taraf sigorta şirketi seçili görünüyor ama şablondan üretince seçilmemiş hatası veriyor"
created: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Current Focus

hypothesis: pdfRouter.generate query does not include karsitarafSigorta and muvekkilSigorta relations in the with clause, so context-builder receives them as undefined, falling back to empty string, which getMissingVariables treats as missing.
test: Verify the with clause in pdf.ts line 49-56 does not include karsitarafSigorta or muvekkilSigorta
expecting: Confirm relations are missing from query
next_action: Confirm root cause and prepare fix

## Symptoms

expected: When generating document from template, the counterparty insurance company (karsitaraf_sigorta) value should be available in the Jinja2 context if it's set in the dosya record.
actual: Template generation throws error saying the variable is not selected/entered, telling user to fill it from the Genel tab.
errors: "{variable} henüz girilmemiş — Genel sekmesinden ekleyin."
reproduction: 1. Set karşı taraf sigorta şirketi in dosya settings. 2. Form shows it as selected. 3. Click "şablondan üret" with a template that uses {{dosya.karsitaraf_sigorta}}.
started: Always broken — the query never loads these relations.

## Eliminated

## Evidence

- timestamp: 2026-04-22T00:00:00Z
  checked: lib/trpc/routers/pdf.ts lines 47-57
  found: db.query.dosya.findFirst with clause includes: muvekkil, taraflar (with sigortaSirketi, avukat), durusmalar, sureler, finans_kalemleri, notlar. Does NOT include karsitarafSigorta or muvekkilSigorta.
  implication: These relations exist in schema (dosyaRelations lines 248-249) but are never fetched by the PDF generation query.

- timestamp: 2026-04-22T00:00:00Z
  checked: lib/docx/context-builder.ts lines 69-70
  found: karsitaraf_sigorta: dosya.karsitarafSigorta?.ad ?? '', muvekkil_sigorta: dosya.muvekkilSigorta?.ad ?? ''
  implication: Since relations not fetched, karsitarafSigorta is undefined, fallback to '' (empty string).

- timestamp: 2026-04-22T00:00:00Z
  checked: lib/docx/variable-registry.ts lines 148-157 (getMissingVariables)
  found: Checks if value === undefined || value === null || value === '' — empty string counts as missing.
  implication: Empty string from fallback triggers the "henüz girilmemiş" error.

## Resolution

root_cause: pdfRouter.generate (lib/trpc/routers/pdf.ts) query does not fetch karsitarafSigorta and muvekkilSigorta relations. context-builder.ts accesses them, gets undefined, falls back to '', and getMissingVariables treats '' as missing.
fix: Add karsitarafSigorta: true and muvekkilSigorta: true to the with clause in pdf.ts dosya query.
verification: 
files_changed: []
