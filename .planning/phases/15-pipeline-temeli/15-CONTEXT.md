# Phase 15: Pipeline Temeli - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Python sidecar kurulumu, execa IPC protokolü, LibreOffice path detection ve sağlık kontrolü banner'ı. Node.js'den Python subprocess çağrısını güvenilir hale getirmek; yapılandırma eksikse kullanıcı anında görür. PDF üretimi, şablon CRUD, arşivleme ve UI bu fazda DEĞİLDİR — sadece altyapı.

</domain>

<decisions>
## Implementation Decisions

### Sidecar Architecture
- **D-01:** Tek entry point (`main.py`) + subcommand pattern — JSON stdin'den `command` alanı alır (`extract-vars`, `render`, `convert`). Tek process spawn, tüm işlemler aynı schema üzerinden. Modüler yapı yerine basit ve debug'ı kolay yaklaşım.

### Health Check Strategy
- **D-02:** App startup'ta bir kez çalış, sonucu ~5 dakika cache'le. Cache'e göre banner göster veya gizle. Her page load'da tekrar check etmez — performanslı. Cache süresi dolunca bir sonraki request'te yenilenir.
- **D-03:** Sağlık banner'ı tüm sayfalarda üstte görünür (layout-level component). Python VEYA LibreOffice erişilemezse Türkçe uyarı gösterir.
- **D-04:** Ayarlar > Pipeline Durumu kartı: LibreOffice ve Python versiyon bilgisi + erişilebilirlik durumu (yeşil/kırmızı indicator).

### IPC Protocol Design
- **D-05:** Command envelope pattern — stdin: `{"command": "render", "params": {...}}` → stdout: `{"status": "success", "result": {...}}` veya `{"status": "error", "code": 2, "message": "..."}`. Tek envelope, tüm command'lar aynı schema. JSON-RPC 2.0 gereksiz complex.
- **D-06:** stderr JSONL log stream olarak kullanılır (structlog output). tRPC bu logları ignore eder ama debug için erişilebilir tutulur.
- **D-07:** Exit kodları sabit: 0=başarı, 1=validation, 2=render, 3=convert, 4=archive. tRPC bu kodları Türkçe toast mesajlarına çevirir.

### Environment Configuration
- **D-08:** Platform-aware default detect — `LIBREOFFICE_PATH` boşsa: Windows → `C:\Program Files\LibreOffice\program\soffice.exe`, Linux → `/usr/bin/soffice`, macOS → `/Applications/LibreOffice.app/Contents/MacOS/soffice`.
- **D-09:** `PYTHON_PATH` için `python3` veya `python` PATH'te aranır. Bulunamazsa health check başarısız döner.
- **D-10:** `.env.local` override eder — kullanıcı custom install location'ları `.env`'den belirtebilir.

### Python Sidecar Setup
- **D-11:** Sidecar `./scripts/docx-pipeline/` dizininde çalışır. Kendi venv'i olur.
- **D-12:** Gerekli paketler: `pydantic v2`, `docxtpl`, `jinja2`, `babel`, `python-slugify`, `structlog`, `tenacity`.
- **D-13:** `execa` üzerinden spawn edilir — Next.js tarafında `lib/services/docx-pipeline.ts` tek giriş noktası (STATE.md'de kayıtlı karar).

### the agent's Discretion
- Health check cache TTL süresi (5 dakika önerildi ama planner optimize edebilir)
- structlog format detayları (JSON vs text)
- Error message Türkçeleştirme stratejisi (hardcoded vs translation file)
- venv kurulum script'i detayları (otomatik mi manuel mi)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Requirements
- `.planning/REQUIREMENTS.md` §PIPE-01–PIPE-07 — Pipeline Temeli gereksinimleri (PYTHON_PATH, LIBREOFFICE_PATH, health check, sidecar setup, IPC protokolü, exit kodları)
- `.planning/ROADMAP.md` §Phase 15 — Phase goal ve success criteria

### Architecture Decisions
- `.planning/STATE.md` §Accumulated Context — "Sidecar boundary" kararı: tüm Python subprocess çağrıları `lib/services/docx-pipeline.ts` üzerinden

### Project Context
- `.planning/PROJECT.md` — Tech stack (Next.js 15, SQLite, Drizzle, tRPC, shadcn/ui), constraints, key decisions
- `.planning/REQUIREMENTS.md` §Out of Scope — Tiptap/.odt export yok, in-app template editor yok

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/trpc/routers/_app.ts` — Mevcut router registration pattern (yeni pipeline router buraya eklenecek)
- `components/` — shadcn/ui bileşenleri (banner, card, badge için Alert, Card kullanılabilir)
- `.env.local` — Mevcut env pattern (SESSION_PASSWORD, APP_PASSWORD — yeni env'ler aynı dosyaya)
- `lib/services/` — Servis pattern'i (mevcut: `odt-to-pdf.ts`, `degisken-substitution.ts` — bunlar Phase 20'de silinecek)

### Established Patterns
- tRPC router yapısı: `lib/trpc/routers/{feature}.ts` → `_app.ts`'de register
- shadcn/ui components: `components/ui/` dizininde
- Next.js App Router: `app/(dashboard)/` layout pattern
- Drizzle ORM: `drizzle/` dizininde schema + migration pattern

### Integration Points
- `lib/services/docx-pipeline.ts` — Yeni servis dosyası (STATE.md'de belirtilen sidecar boundary)
- App layout — Sağlık banner'ı tüm dashboard sayfalarında görünecek (layout-level)
- `app/(dashboard)/ayarlar/page.tsx` — Pipeline Durumu kartı mevcut Ayarlar sayfasına eklenecek
- `.env.local` — PYTHON_PATH ve LIBREOFFICE_PATH env değişkenleri

</code_context>

<specifics>
## Specific Ideas

- "Kullanıcı .env içinde PYTHON_PATH ve LIBREOFFICE_PATH ayarlayabilir; LIBREOFFICE_PATH boşken sistem default konumu otomatik algılanır" (ROADMAP.md success criteria)
- "Node, Python sidecar'ını (./scripts/docx-pipeline/ venv) execa üzerinden çağırır" (ROADMAP.md success criteria)
- "Sidecar sabit exit kodlarıyla (0=başarı, 1=validation, 2=render, 3=convert, 4=archive) döner" (ROADMAP.md success criteria)
- Windows-first deployment — kullanıcı Windows'ta çalıştırıyor (D:\sigorta-takip path)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-pipeline-temeli*
*Context gathered: 2026-04-20*
