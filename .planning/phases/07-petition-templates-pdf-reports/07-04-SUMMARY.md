# Phase 07-04: Reports Dashboard - Summary

**Plan:** 07-04
**Wave:** 2
**Status:** Complete

## One-liner
Reports dashboard with portfolio and financial report visualizations (stats cards, pie/bar charts, tables) and export functionality (PDF for portfolio, PDF + Excel for financial, Excel for filtered case list).

## What was built

### Artifacts Created
| Path | Provides |
|------|----------|
| `lib/trpc/routers/rapor.ts` | Portfolio, financial, and case list queries |
| `app/(dashboard)/raporlar/page.tsx` | Reports dashboard with 3 tabs |
| `components/raporlar/portfy-ozet.tsx` | Portfolio stats: pie chart (type), bar chart (stage), stat cards |
| `components/raporlar/finans-ozet.tsx` | Financial stats: trend bar chart, summary cards |
| `app/api/raporlar/portfy/pdf/route.ts` | Portfolio PDF export |
| `app/api/raporlar/finans/pdf/route.ts` | Financial PDF export |
| `app/api/raporlar/finans/excel/route.ts` | Financial Excel export (exceljs) |
| `app/api/raporlar/dosya-listesi/excel/route.ts` | Case list Excel export |

### Key Decisions Made
- **Charts:** recharts library (already installed) for bar/pie charts
- **Charts colors:** Navy + Turuncu palette (#FA991C, #1C768F, #032539)
- **Excel library:** exceljs@4.4.0 for XLSX generation
- **Portfolio stats:** total, aktif, pasif, byType (STK/Mahkeme), bySigortaType, byStage
- **Financial stats:** gelen/giden/masraf totals, monthly/yearly breakdown, net balance
- **Case list:** filtered by tur/durum/search, joined with muvekkil and sigortaSirketi for display

### Data Flow
1. tRPC queries fetch data from SQLite via Drizzle ORM
2. Reports page displays data with recharts visualizations
3. Export buttons trigger API routes that generate PDF/Excel and return as binary download

## Verification
- [x] raporRouter registered with portfy, finans, dosyaListesi queries
- [x] Portfolio tab shows: total/aktif/pasif counts, type pie chart, stage bar chart
- [x] Financial tab shows: gelen/giden/masraf totals, monthly/yearly trend toggle
- [x] Reports page has three tabs: Portföy / Finansal / Dosya Listesi
- [x] Portfolio PDF export works via /api/raporlar/portfy/pdf
- [x] Financial PDF export works via /api/raporlar/finans/pdf
- [x] Financial Excel export works via /api/raporlar/finans/excel
- [x] Case list Excel export works via /api/raporlar/dosya-listesi/excel
- [x] Charts render with Navy + Turuncu color scheme

## Commits
- `4fa2734` - feat(07-04): reports dashboard with portfolio and financial visualizations

## Dependencies
- 07-01 (Turkish font spike) — lib/pdf/pdf-generator.ts for PDF exports

## Files Created/Modified
- lib/trpc/routers/rapor.ts (new)
- lib/trpc/routers/_app.ts (registered raporRouter)
- app/(dashboard)/raporlar/page.tsx (new content)
- components/raporlar/portfy-ozet.tsx (new)
- components/raporlar/finans-ozet.tsx (new)
- app/api/raporlar/portfy/pdf/route.ts (new)
- app/api/raporlar/finans/pdf/route.ts (new)
- app/api/raporlar/finans/excel/route.ts (new)
- app/api/raporlar/dosya-listesi/excel/route.ts (new)