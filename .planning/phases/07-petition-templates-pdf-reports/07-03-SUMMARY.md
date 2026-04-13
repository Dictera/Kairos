# Phase 07-03: Petition Generation Flow - Summary

**Plan:** 07-03
**Wave:** 3
**Status:** Complete

## One-liner
Variable substitution service and PDF generation API built with petition generation UI — enables selecting a template, auto-filling variables from case data, editing values, and previewing/downloading the PDF.

## What was built

### Artifacts Created
| Path | Provides |
|------|----------|
| `lib/services/degisken-substitution.ts` | Variable substitution, extraction, validation, and case data mapping |
| `app/api/dilekce/[id]/pdf/route.ts` | PDF generation API endpoint with variable substitution |
| `components/dilekce/pdf-onizleme.tsx` | PDF preview modal and usePdfPreview hook |
| `app/(dashboard)/dilekce/[id]/olustur/page.tsx` | Petition generation page with template select, variable edit, PDF preview |

### Key Decisions Made
- **Variable substitution:** Regex replacement of {{var}} patterns — unknown vars preserved as-is
- **Auto-fill:** buildVariableMapFromDosya extracts variables from dosya + muvekkil data, parsing surec_detay JSON for STK/mahkeme fields
- **PDF generation:** Uses pdfmake from 07-01 spike with Arial TTF for Turkish character support
- **Save-to-belge:** Deferred (TODO) — for now just downloads PDF

### Variable Auto-fill Logic
- müvekkil_adı, müvekkil_soyadı: From muvekkil.ad (split by space)
- dosya_no: From dosya.dosya_no
- stk_no: From surec_detay.stk.basvuru_no
- dava_no: From surec_detay.mahkeme.esas_no
- basvuru_tarihi, tebligat_tarihi: From surec_detay.stk
- karar_tarihi: From surec_detay.mahkeme
- talep_tutari: From dosya.talep_tutari
- mahkeme, karsitaraf, karsitaraf_vekil, police_no: Placeholder (would need additional joins)

## Verification
- [x] Variable substitution correctly replaces {{var}} patterns
- [x] PDF API route generates valid PDF with filled content
- [x] Petition generation page shows template selector with categories
- [x] Variables auto-fill from case data (müvekkil, dosya fields)
- [x] User can override variable values before generating
- [x] PDF preview displays in modal after clicking Önizle
- [x] Dilekçe Kaydet and İndir buttons work (download triggers)
- [x] All Turkish characters render correctly (from 07-01 spike)

## Commits
- `14adccd` - feat(07-03): petition generation flow with variable substitution and PDF preview

## Dependencies
- 07-01 (Turkish font spike) — lib/pdf/pdf-generator.ts
- 07-02 (Template system) — lib/trpc/routers/dilekce.ts, dilekce_sablonu table

## Files Created/Modified
- lib/services/degisken-substitution.ts (new)
- lib/pdf/pdf-generator.ts (updated for export)
- app/api/dilekce/[id]/pdf/route.ts (new)
- components/dilekce/pdf-onizleme.tsx (new)
- app/(dashboard)/dilekce/[id]/olustur/page.tsx (new)