# Project Research Summary — v1.2 Şablon Belgeler

**Project:** Sigorta Uyuşmazlık Takip
**Milestone:** v1.2 — `.docx` şablon + Python sidecar + LibreOffice headless → PDF pipeline
**Synthesized:** 2026-04-20
**Confidence:** HIGH (4 research tracks: Stack, Features, Architecture, Pitfalls)

## Executive Summary

v1.2 ekler: Avukat `.docx` şablon yükler → Python sidecar (`pydantic + docxtpl + jinja2 + babel + slugify + structlog + tenacity`) şablonu dosya verisiyle doldurur → LibreOffice headless (`soffice --headless --convert-to pdf`) PDF üretir → otomatik `YYYY/AA/{kategori}/{müvekkil-slug}-{plaka-slug}-{seq}.pdf` arşivlenir + `belge` tablosuna kayıt. Eski `dilekce` (Tiptap) + `dilekce-odt` sistemleri veriyle birlikte silinir.

**Hard constraints (kilitli):**
- LibreOffice headless PDF adımı değiştirilemez (kullanıcı talebi)
- Python 3.10+ + LibreOffice 24.8 LTS kullanıcı makinesine kurulmalı
- Offline-first korunur; bulut / AI / e-imza kapsam dışı

## Stack additions

**Python 3.11–3.12 (python.org, MS Store DEĞİL):**

| Paket | Pin | Amaç |
|---|---|---|
| `docxtpl` | `>=0.19.1,<0.21.0` | Jinja2-in-Word templating |
| `python-docx` | `>=1.1.2,<2.0.0` | Transitive, direkt pin |
| `Jinja2` | `>=3.1.4,<4.0.0` | CVE-2024-56201 floor |
| `pydantic` | `>=2.9.0,<3.0.0` | IPC payload doğrulama (v2 zorunlu) |
| `Babel` | `>=2.16.0,<3.0.0` | `format_currency(_, 'TRY', locale='tr_TR')` |
| `python-slugify` | `>=8.0.4,<9.0.0` | TR-safe slugs (Unidecode BACKEND DEĞİL — GPL) |
| `structlog` | `>=24.4.0,<26.0.0` | stderr JSON logs |
| `tenacity` | `>=9.0.0,<10.0.0` | soffice retry |

**Node.js tarafı:** `execa@^9.5.0` (tek yeni npm dep) — hem Python sidecar hem soffice spawn için.

**LibreOffice path detection:** Candidate path array + `fs.access`. Registry wrapper paketleri YOK.

**NOT ekle:** `unoconv`, `docx2pdf`, `aspose-words`, `pywin32`+Word COM, `Unidecode`, `reportlab`/`fpdf2`/`weasyprint`/`jspdf`, `python-shell`, `click`/`typer` sidecar'da.

## Feature table stakes (v1.2 kapsamı)

1. `.docx` upload (ad + zorunlu kategori STK/Mahkeme/Genel)
2. Auto değişken çıkarımı (`docxtpl.get_undeclared_template_variables()`)
3. Değişken kataloğu view (bilinen vs bilinmeyen)
4. Belgeler sekmesinde tek tuş "Üret" butonu (dosya context)
5. Dosya adı: `{müvekkil-slug}-{plaka-slug}-{seq}.pdf`, seq per dosya
6. Arşiv: `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` **+ belge tablosu** (transactional)
7. Jinja2 koşullu + döngü (`{% if %}`, `{% for %}`, `{%p %}`, `{%tr %}`)
8. TR filtreler: `tr_currency`, `tarih`, `upper_tr`, `lower_tr`
9. TR hata mesajları + install banner (LibreOffice/Python yoksa)
10. Değişken cheat-sheet sayfası (registry'den auto-generated)
11. Yeniden üretim (seq artar, eski PDF korunur)
12. Şablon CRUD (sil / değiştir / tekrar yükle)
13. LibreOffice + Python install-check banner
14. Eski Tiptap + .odt sistemini emekliye ayır (router, tablo, dosya, UI, migration)

**Promoted to v1.2 (differentiator → table stake):**
- Missing-variable client-side pre-check + deep-link to the tab that owns the field

## Architecture snapshot

```
Browser (shadcn-ui)
  └─ tRPC (react-query)
      └─ Next.js App Router (Node)
          ├─ docxSablon router (CRUD + upload + extract)
          ├─ belgeUret mutation (render + PDF + archive)
          ├─ pipelineSaglik query (LibreOffice/Python check)
          └─ lib/services/docx-pipeline.ts
              └─ execa.spawn(python sidecar)  [JSON over stdin/stdout/stderr]
                  └─ pydantic validate → docxtpl render → soffice headless → slugify archive
```

**New Drizzle tables:**
- `docx_sablon` (id, ad, kategori, dosya_yolu, degiskenler JSON, created_at, updated_at)
- `belge` tablosu reuse: nullable `sablon_id` FK + `tip` = "uretilen"

**Directory layout:**
- `./scripts/docx-pipeline/` — Python package + `.venv-docpipe/`
- `./uploads/docx-templates/{id}.docx`
- `./uploads/sablon-pdf/YYYY/AA/{kategori}/...`

**Retirement migration:**
1. Freeze eski routerları (deprecated error)
2. Migration: DROP tablo `dilekce_*`, `dilekce_odt_sablonu`
3. Filesystem cleanup: `./uploads/odt-templates/` sil
4. Route'ları sil: `app/(dashboard)/dilekce/*`, `app/api/dilekce*`

## Watch Out For (top 6 pitfalls)

1. **LibreOffice SingletonLock hang** — her `soffice` çağrısına `-env:UserInstallation=file:///TEMP` ekle, ayrı profil kullan
2. **Windows Python venv path** — MS Store Python sandbox kırılır; `python.org` installer kullan, PATH'e ekle
3. **docxtpl tag span bug** — Jinja tags Word'de farklı run'lara bölünürse render kaybolur; template yazım kuralı cheat-sheet'te belirt
4. **Subprocess stdout deadlock** — büyük PDF path listesi stdout'u doldurursa Node bloklar; stderr JSON + stdout dar format
5. **seq race condition** — aynı dosya için çift tıklama 2 paralel mutation; DB transaction içinde `SELECT MAX(seq) FOR UPDATE` + belge insert atomik
6. **tenacity retry masking** — soffice exit code 1 retry etme (bozuk docx); sadece timeout + known-transient error retry

## Build order (roadmap için)

1. **Foundation** — Python venv + execa + LibreOffice path detect + pipelineSaglik tRPC + Ayarlar banner
2. **Drizzle schema** — docx_sablon tablo + belge.sablon_id FK migration
3. **Template CRUD** — upload / list / delete + değişken extract + variable registry
4. **Pipeline core** — docx-pipeline.ts + Python sidecar + IPC + render
5. **PDF + Archive** — LibreOffice convert + slugify filename + belge insert transactional
6. **UI integration** — Şablon Yönetimi sayfası + Belgeler tab "Üret" dropdown + cheat-sheet
7. **Retirement** — eski router/table/UI/filesystem delete + migration

## Open Questions (requirements/architecture'a taşı)

- Variable registry: TS const (static) mi, Drizzle'dan introspect (dynamic) mi? → **Öneri: TS const + test ile senkron**
- `sablon.default_aksiyon` alanı v1.2'de eklensin mi (v1.3'ü kolaylaştırır)? → **Öneri: kolon ekle, UI v1.3**
- Silinen şablonun ürettiği PDF'ler? → **Öneri: belge rows kalır, sablon_id NULL olur (CASCADE DEĞİL)**

---
*Synthesized from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
