# Architecture Research — v1.2 Şablon Belgeler Pipeline

**Domain:** Next.js 15 + tRPC monolith with embedded Python document-generation sidecar (Windows 11, local-only)
**Researched:** 2026-04-20
**Confidence:** HIGH (Node subprocess, docxtpl/LibreOffice patterns, Drizzle migrations well-established + verified against existing codebase)

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (React / shadcn-ui)                    │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
│  │ Şablon Yönetimi  │   │  Belgeler tab    │   │ Ayarlar (banner) │  │
│  │ (list/upload)    │   │  "Şablondan Üret"│   │  LibreOffice OK? │  │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘  │
│           │  tRPC (react-query)  │                      │            │
├───────────┼──────────────────────┼──────────────────────┼────────────┤
│           ▼                      ▼                      ▼            │
│                    Next.js 15 App Router (Node)                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  tRPC routers:                                                 │  │
│  │  - docxSablon    (CRUD + upload + variables extraction)        │  │
│  │  - belgeUret     (mutation: render template → PDF → archive)   │  │
│  │  - pipelineSaglik (LibreOffice/Python check)                   │  │
│  └─────────────────────────┬──────────────────────────────────────┘  │
│                            │ calls                                   │
│  ┌─────────────────────────▼──────────────────────────────────────┐  │
│  │  lib/services/docx-pipeline.ts                                 │  │
│  │    - buildDosyaPayload(dosyaId): DosyaPayload                  │  │
│  │    - runPipeline(payload, opts): Promise<PipelineResult>       │  │
│  │    - healthCheck(): { python, libreoffice, templates_dir }     │  │
│  └──────────────┬─────────────────────┬───────────────────────────┘  │
│                 │ child_process.spawn │  sqlite INSERT (belge row)   │
├─────────────────┼─────────────────────┼──────────────────────────────┤
│                 ▼                     ▼                              │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐      │
│  │  Python sidecar          │  │  Drizzle + better-sqlite3    │      │
│  │  scripts/docx-pipeline/  │  │  ./data/db.sqlite            │      │
│  │    cli.py (stdin JSON)   │  │                              │      │
│  │    schema.py (pydantic2) │  │  Tables:                     │      │
│  │    filters.py (tr_*)     │  │    docx_sablon    (NEW)      │      │
│  │    render.py (docxtpl)   │  │    belge          (reuse)    │      │
│  │    convert.py (LO hless) │  │    dilekce_*      (DROP)     │      │
│  └──────────┬───────────────┘  └──────────────────────────────┘      │
│             │ spawns                                                 │
│             ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  LibreOffice headless (soffice.exe --headless --convert) │        │
│  └──────────────────────────────────────────────────────────┘        │
├──────────────────────────────────────────────────────────────────────┤
│                         Filesystem                                    │
│  ./uploads/docx-templates/{template-id}.docx                         │
│  ./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/{müvekkil}-{plaka}-N.pdf│
│  ./uploads/pipeline-logs/YYYY-MM-DD.jsonl                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `app/(dashboard)/sablonlar/` | Şablon Yönetimi UI — list, upload, delete | Server component page + client `ShablonList`, `ShablonUploadDialog` |
| `SablondanUretButton` ("Şablondan Üret") | In-tab picker; filters templates by kategori matching dosya türü | Client component in `app/(dashboard)/dosyalar/[id]/belgeler/` |
| tRPC `docxSablon` router | CRUD over `docx_sablon` + base64 upload + variable extraction via subprocess | `lib/trpc/routers/docx-sablon.ts` (NEW) |
| tRPC `belgeUret` router | Orchestrates: build payload → spawn Python → write PDF → insert `belge` row → logOlay | `lib/trpc/routers/belge-uret.ts` (NEW) |
| tRPC `pipelineSaglik` router | Health probe — returns `{python_ok, libreoffice_ok, versions}` | `lib/trpc/routers/pipeline.ts` (NEW) |
| `lib/services/docx-pipeline.ts` | Subprocess boundary. Constructs JSON payload, spawns Python, parses result | TypeScript service (NEW) |
| `lib/services/payload-builder.ts` | `buildDosyaPayload(dosyaId)` — one big `db.query.dosya.findFirst({ with: { muvekkil, taraflar.avukat, durusmalar, sureler, finans_kalemleri, notlar } })` | TypeScript (NEW) |
| `scripts/docx-pipeline/` | Python project: pydantic validation, docxtpl render, LibreOffice convert | Python 3.11+ venv (NEW) |
| `./uploads/docx-templates/` | Uploaded `.docx` templates, one file per template-id | Flat directory |
| `./uploads/sablon-pdf/YYYY/AA/{kategori}/` | Generated PDFs, partitioned by year/month/category | Auto-created by Python |
| `./uploads/pipeline-logs/` | JSONL logs from structlog (one file per day) | Python append-only |

---

## 2. Recommended Project Structure

```
sigorta-takip/
├── app/
│   └── (dashboard)/
│       ├── sablonlar/                # NEW — şablon yönetimi
│       │   ├── page.tsx              # list page (server component)
│       │   ├── _components/
│       │   │   ├── ShablonList.tsx
│       │   │   ├── ShablonUploadDialog.tsx
│       │   │   └── LibreOfficeBanner.tsx
│       │   └── loading.tsx
│       ├── dosyalar/[id]/belgeler/
│       │   └── _components/
│       │       └── SablondanUretButton.tsx   # NEW — dropdown + trigger
│       └── dilekce/                  # DELETE (v1.2 retirement)
├── app/api/
│   ├── dilekce/                      # DELETE
│   ├── dilekce-odt/                  # DELETE
│   └── upload/                       # reuse pattern for docx
├── lib/
│   ├── schema.ts                     # + docx_sablon; DROP dilekce_sablonu, dilekce_odt_sablonu
│   ├── trpc/routers/
│   │   ├── docx-sablon.ts            # NEW
│   │   ├── belge-uret.ts             # NEW
│   │   ├── pipeline.ts               # NEW (health)
│   │   ├── _app.ts                   # MODIFY — register new, remove dilekce*
│   │   ├── dilekce.ts                # DELETE
│   │   └── dilekce-odt.ts            # DELETE
│   └── services/
│       ├── docx-pipeline.ts          # NEW — subprocess boundary
│       ├── payload-builder.ts        # NEW — DB → JSON payload
│       ├── filename-builder.ts       # NEW — slug + seq filename
│       ├── odt-to-pdf.ts             # DELETE
│       └── degisken-substitution.ts  # DELETE (Tiptap-only)
├── scripts/
│   └── docx-pipeline/                # NEW — Python sidecar (co-located)
│       ├── pyproject.toml            # uv / poetry
│       ├── requirements.txt          # pinned
│       ├── .venv/                    # gitignored
│       ├── src/
│       │   └── docx_pipeline/
│       │       ├── __init__.py
│       │       ├── cli.py            # entrypoint — reads stdin JSON
│       │       ├── schema.py         # pydantic v2 models (mirror Drizzle)
│       │       ├── filters.py        # tr_currency, tr_date, title_tr, ...
│       │       ├── render.py         # docxtpl wrapper
│       │       ├── convert.py        # LibreOffice subprocess
│       │       ├── logging_conf.py   # structlog → JSONL
│       │       └── paths.py          # resolve LIBREOFFICE_PATH
│       └── tests/
│           └── test_render.py
├── uploads/                          # outside /public — served via /api/files/*
│   ├── docx-templates/               # NEW
│   ├── sablon-pdf/                   # NEW
│   ├── pipeline-logs/                # NEW
│   ├── odt-templates/                # DELETE after migration
│   └── files/{dosyaId}/...           # existing belge storage
├── drizzle/
│   └── migrations/
│       └── 00XX_v1_2_sablon_pipeline.sql  # CREATE docx_sablon; DROP dilekce*
└── .env                              # + LIBREOFFICE_PATH, PYTHON_PATH
```

### Structure Rationale

- **`scripts/docx-pipeline/` co-located, not separate repo:** Solo-avukat deployment ships one `git clone`. Versioning the Python pipeline alongside the Node app guarantees Pydantic schema and Drizzle schema stay in lock-step — a migration touching `dosya` columns forces a Python side update in the *same commit*. Cost: adds Python to the monorepo (accepted — deployment is already manual/local).
- **`uploads/` at repo root (not `public/uploads/`):** Generated PDFs must **not** be statically served by Next.js. They flow through `/api/files/*` which checks auth. The existing `dilekce-odt.ts` already uses `path.join(process.cwd(), 'uploads', 'odt-templates')` — same pattern.
- **`lib/services/docx-pipeline.ts` as single subprocess boundary:** All `child_process.spawn` usage lives here. tRPC routers never spawn directly — this makes the boundary mockable for tests and keeps the security surface narrow.
- **Router split (`docxSablon` vs `belgeUret`):** Template CRUD is a different domain concern from rendering. Splitting allows independently evolving upload quotas, variable extraction, and generation throttling.

---

## 3. Architectural Patterns

### Pattern 1: One-Shot Subprocess with JSON-over-stdin (NOT long-running worker)

**What:** Each generation call spawns a fresh `python cli.py`. Node writes the full payload to the child's stdin as a single JSON document; Python reads `sys.stdin.read()`, validates via Pydantic, renders, converts, then exits with structured JSON on stdout.

**When to use:** Low concurrency (solo user, < 1 generation/sec), payload < ~1 MB, cold-start tolerable (~1.5 s for Python import + LibreOffice spawn).

**Why this over a persistent Python daemon:**

| Criterion | One-shot subprocess | Long-running worker |
|-----------|---------------------|---------------------|
| Complexity | **Low** — no lifecycle, crashes isolated | High — need PID file, health checks, restart logic |
| Windows behavior | Clean — no orphaned processes after Next.js restart | Orphaned `python.exe` on `next dev` HMR reload |
| Isolation | Fresh interpreter each time → no memory leak accumulation | `docxtpl`/`lxml` memory leaks compound over hundreds of renders |
| Latency | ~1.2–1.8 s cold | ~200–400 ms warm |
| Throughput ceiling | ~0.5–1 req/s sustained | 5–10 req/s |
| Debuggability | `stderr` is single-request scoped | Interleaved logs from many requests |

**For the solo-avukat workload (~5–20 generations/day peak) the one-shot model wins decisively.** The ~1.5 s cold start is invisible behind a spinner.

**Example (Node side):**

```ts
// lib/services/docx-pipeline.ts
import { spawn } from 'node:child_process'
import path from 'node:path'

export async function runPipeline(payload: PipelinePayload, opts: PipelineOptions): Promise<PipelineResult> {
  const pythonPath = process.env.PYTHON_PATH ?? 'python'
  const scriptPath = path.join(process.cwd(), 'scripts', 'docx-pipeline', 'src', 'docx_pipeline', 'cli.py')

  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [scriptPath], {
      cwd: path.join(process.cwd(), 'scripts', 'docx-pipeline'),
      env: {
        ...process.env,
        LIBREOFFICE_PATH: process.env.LIBREOFFICE_PATH ?? '',
        PYTHONIOENCODING: 'utf-8',          // critical on Windows — cp1254 default breaks Türkçe
        PYTHONUTF8: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 60_000)
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    child.stdout.on('data', b => stdout.push(b))
    child.stderr.on('data', b => stderr.push(b))

    child.on('error', err => { clearTimeout(timer); reject(err) })
    child.on('close', code => {
      clearTimeout(timer)
      const out = Buffer.concat(stdout).toString('utf-8')
      const err = Buffer.concat(stderr).toString('utf-8')
      if (code !== 0) return reject(new PipelineError(code, err, out))
      try { resolve(JSON.parse(out) as PipelineResult) }
      catch (e) { reject(new PipelineError(code, 'Invalid JSON from sidecar', out)) }
    })

    // Send JSON payload, close stdin → Python reads to EOF
    child.stdin.end(JSON.stringify(payload), 'utf-8')
  })
}
```

**Key Windows gotchas (HIGH confidence):**
- Always set `PYTHONIOENCODING=utf-8` and `PYTHONUTF8=1`; Windows Python defaults to cp1254 on Turkish locale, which corrupts `İÖÇĞŞÜ` on stdin/stdout
- Use `windowsHide: true` to suppress flashing console windows during `next dev`
- Don't use `shell: true` — quoting bugs with UTF-8 paths (`Belgeler`, Turkish paths)
- Pass LIBREOFFICE_PATH via **env**, not CLI args — Windows CreateProcess limit is 32 767 chars

**Trade-offs:**
- ✓ Crash isolation — bad template/data kills one request, not the server
- ✓ Zero IPC state — no socket/pipe management
- ✗ ~1.5 s per-request cost (acceptable here)
- ✗ Debugging requires log files because stderr is ephemeral

---

### Pattern 2: JSON-over-stdin vs. Temp-File IPC — Hybrid Threshold

**What:** Use stdin for payloads < 1 MB (the default case). For rare giant payloads (≥ 1 MB), switch to a temp file: Node writes `./uploads/.ipc/{uuid}.json`, passes the path as CLI arg, Python reads + `os.unlink`s it after parsing.

**Why the threshold:**
- Windows pipe buffer is ~4 KB per write; Node chunks automatically but very large payloads can deadlock if Python hasn't started reading yet (Python's `sys.stdin.read()` is blocking, happens after imports — ~400 ms window where the 4 KB buffer fills)
- **MEDIUM confidence on the 1 MB threshold** — for a solo-avukat with 200 files the realistic payload stays well under 200 KB

**Realistic payload size estimate:**

| Component | Typical size |
|-----------|--------------|
| `dosya` row + parsed `surec_detay` | ~2 KB |
| `muvekkil` + `taraf` + `avukat` | ~1 KB |
| `durusma` (× ~5) | ~1 KB |
| `sure` (× ~10) | ~2 KB |
| `finans_kalemi` (× ~20) | ~3 KB |
| `dosya_not` (× ~20) | ~10 KB |
| Template metadata + filters | ~1 KB |
| **Total** | **~20 KB** — stdin path is safe |

**Recommendation:** Start with stdin-only. Add temp-file fallback only if telemetry ever flags a payload > 500 KB. Do NOT preemptively build both paths.

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| stdin | No filesystem writes, no cleanup, atomic IPC | Pipe buffer deadlock risk on huge payloads |
| temp-file | No size limit, easy to inspect during debug | Extra I/O, needs cleanup, path-traversal concern |
| args | Fast for tiny payloads | 32 KB Windows limit, escaping nightmare for JSON |

---

### Pattern 3: Pydantic Mirrors Drizzle (Schema Contract)

**What:** `scripts/docx-pipeline/src/docx_pipeline/schema.py` defines Pydantic v2 models whose field names and nullability exactly match the `buildDosyaPayload()` result. Pydantic validates before `docxtpl` ever sees the data.

**When to use:** Always. This is the *contract* between Node and Python.

**Example:**

```python
# schema.py
from pydantic import BaseModel, Field
from datetime import date
from typing import Literal, Optional

class Muvekkil(BaseModel):
    id: int
    ad: str
    soyad: str
    telefon: Optional[str] = None
    tc_vergi_no: Optional[str] = None
    iban: Optional[str] = None
    adres: Optional[str] = None

class Taraf(BaseModel):
    karsitaraf_ad: Optional[str] = None
    karsitaraf_plaka: Optional[str] = None
    police_no: Optional[str] = None
    sigorta_sirketi_ad: Optional[str] = None     # flattened from join
    avukat_ad: Optional[str] = None              # flattened
    surucu_ad: Optional[str] = None
    surucu_soyad: Optional[str] = None
    surucu_plaka: Optional[str] = None
    surucu_telefon: Optional[str] = None

class Dosya(BaseModel):
    id: int
    dosya_no: str
    tur: Literal['STK', 'AT', 'AH']
    durum: Literal['aktif', 'arsiv']
    talep_tutari: Optional[float] = None
    muvekkil_plaka: Optional[str] = None
    kaza_tarihi: Optional[date] = None

class PipelineInput(BaseModel):
    template_path: str
    output_dir: str
    filename_hint: str                            # müvekkil-plaka-seq skeleton
    dosya: Dosya
    muvekkil: Muvekkil
    taraf: Optional[Taraf] = None
    durusmalar: list[Durusma] = Field(default_factory=list)
    sureler: list[Sure] = Field(default_factory=list)
    finans_kalemleri: list[FinansKalemi] = Field(default_factory=list)
    notlar: list[DosyaNot] = Field(default_factory=list)
    stk: Optional[StkSurec] = None
    mahkeme: Optional[MahkemeSurec] = None
```

**Contract-violation behavior:** Pydantic validation error → exit code 2, structured error on stderr, nothing on stdout. Node translates to tRPC `BAD_REQUEST` with Turkish message "Şablon için gereken veriler eksik: {field}".

**Trade-offs:**
- ✓ Bugs caught at the boundary, not deep inside jinja rendering
- ✓ Self-documenting — Pydantic schema IS the data dictionary for template authors
- ✗ **Duplicates Drizzle schema** — must be kept in sync manually

---

### Pattern 4: Atomic Output Write + DB Insert (Transaction Boundary)

**What:** Python writes PDF to a `.tmp` sibling path, then renames on success. Node **only after** successful rename inserts the `belge` row inside a `db.transaction`. If DB insert fails, the PDF is `fs.unlink`ed in the catch block.

**Example:**

```ts
const result = await runPipeline(payload, { timeoutMs: 60_000 })
// result.output_path = './uploads/sablon-pdf/2026/04/stk/ahmet-yilmaz-34abc123-1.pdf'

try {
  await db.transaction(async (tx) => {
    const [belgeRow] = await tx.insert(belge).values({
      dosya_id: input.dosyaId,
      dosya_no: dosya.dosya_no,
      kategori: mapKategoriToBelge(sablon.kategori),
      dosya_adi: path.basename(result.output_path),
      dosya_yolu: toPublicUrl(result.output_path),
      dosya_boyutu: result.size_bytes,
      mime_tur: 'application/pdf',
    }).returning()
    await logOlay(tx, input.dosyaId, 'belge', `Şablondan üretildi: ${sablon.ad}`)
    return belgeRow
  })
} catch (e) {
  await fs.promises.unlink(result.output_path).catch(() => {})
  throw e
}
```

**Trade-offs:**
- ✓ No dangling `belge` rows pointing to missing PDFs
- ✓ No orphaned PDFs (catch-cleanup)
- ✗ No true two-phase commit — crash between rename and DB insert leaves an orphan PDF (acceptable for solo-user)

---

### Pattern 5: Graceful Degradation on Missing LibreOffice

**What:** On `/sablonlar` page load, `pipelineSaglik.check` probes `LIBREOFFICE_PATH` (or well-known Windows paths: `C:\Program Files\LibreOffice\program\soffice.exe`). If missing, UI shows a persistent amber banner and disables the "Üret" button.

**Discovery algorithm (Python `paths.py`):**

```python
def find_libreoffice() -> Optional[Path]:
    # 1. Explicit env override (wins)
    if env := os.environ.get('LIBREOFFICE_PATH'):
        p = Path(env)
        if p.is_file(): return p
    # 2. Windows well-known locations
    candidates = [
        Path(r'C:\Program Files\LibreOffice\program\soffice.exe'),
        Path(r'C:\Program Files (x86)\LibreOffice\program\soffice.exe'),
    ]
    # 3. PATH fallback
    if which_soffice := shutil.which('soffice'):
        candidates.insert(0, Path(which_soffice))
    for c in candidates:
        if c.is_file(): return c
    return None
```

**Trade-offs:**
- ✓ Clear failure mode — user knows what's wrong
- ✓ `.env` override handles non-standard installs (e.g., `D:\LibreOffice`)
- ✗ Probing LO startup is slow (~800 ms) — cache health result for 5 min in memory

---

## 4. Data Flow

### Primary flow — "Şablondan Üret" button

```
User clicks "İhtarname Üret" in Belgeler tab
   │
   ▼
tRPC belgeUret.generate({ dosyaId, sablonId })
   │
   ├─ 1. db.query.docxSablon.findFirst({ id: sablonId })
   │      → { dosya_yolu, kategori, degiskenler }
   │
   ├─ 2. buildDosyaPayload(dosyaId)
   │      → db.query.dosya.findFirst({
   │          with: {
   │            muvekkil, taraflar: { with: { avukat, sigortaSirketi } },
   │            durusmalar, sureler, finans_kalemleri, notlar
   │          }})
   │      → parseSurecDetay(dosya.surec_detay)
   │      → flatten relations for Pydantic shape
   │
   ├─ 3. filenameBuilder(muvekkil, dosya.muvekkil_plaka, existingSeq)
   │      → "ahmet-yilmaz-34abc123-1.pdf"
   │
   ├─ 4. spawn python scripts/docx-pipeline/...cli.py
   │      stdin: { template_path, output_dir, filename_hint, ...payload }
   │      │
   │      ├─ Pydantic validate
   │      ├─ docxtpl.render(template, ctx) → .docx in temp
   │      ├─ soffice --headless --convert-to pdf → .pdf in temp
   │      ├─ fsync + rename to output_path
   │      └─ stdout: { output_path, size_bytes, warnings: [] }
   │
   ├─ 5. db.transaction:
   │      INSERT INTO belge (dosya_id, kategori, dosya_yolu, ...)
   │      INSERT INTO olay_gunlugu (dosya_id, olay_turu='belge', ...)
   │
   └─ 6. return { belgeId, filename, url } to client
          → client invalidates belge.listByDosya → list refreshes
          → toast "İhtarname oluşturuldu: ahmet-yilmaz-34abc123-1.pdf"
```

### Variable-extraction flow (upload time)

```
User uploads ihtarname.docx via ShablonUploadDialog
   │
   ▼
tRPC docxSablon.upload({ baslik, kategori, dosyaData: base64 })
   │
   ├─ 1. decode base64 → write to ./uploads/docx-templates/{uuid}.docx
   │
   ├─ 2. spawn python cli.py --mode=extract-vars {path}
   │      → Python unzips docx, greps `{{ var }}` and `{% for ... %}` tags
   │      → stdout: { variables: ["muvekkil_ad", "dosya_no", ...], loops: ["durusmalar"] }
   │
   ├─ 3. validate against known fields (sanity check, warn on unknowns)
   │
   └─ 4. INSERT INTO docx_sablon (ad, kategori, dosya_yolu, degiskenler)
```

### Health-check flow

```
/sablonlar page load:
   tRPC pipelineSaglik.check()
     → spawn python cli.py --mode=health
     → { python_version, libreoffice_path, libreoffice_version, templates_dir_writable }
     → cached 5 min in memory
   → if !libreoffice_ok: render <LibreOfficeBanner /> at top of sablonlar/
```

---

## 5. Drizzle Schema Changes

### ADD — `docx_sablon`

```ts
export const docxSablon = sqliteTable('docx_sablon', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  kategori: text('kategori').notNull(),          // 'STK' | 'Mahkeme' | 'Genel'
  dosya_yolu: text('dosya_yolu').notNull(),      // absolute-ish path under ./uploads/docx-templates/
  degiskenler: text('degiskenler').notNull().default('[]'),  // JSON extracted variables
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_docx_sablon_kategori').on(t.kategori),
])
```

### REUSE — `belge` table (no schema change required)

Generated PDFs sit in the existing `belge` table with `kategori` mapped to the appropriate `BELGE_KATEGORILER` value (e.g., `İhtarname`, `Dilekçe`). **Optional nicety:** add nullable `kaynak_sablon_id` FK for provenance — defer-able.

### DROP — Retirement tables

```sql
-- drizzle/migrations/00XX_v1_2_retire_old_dilekce.sql
DROP TABLE IF EXISTS dilekce_sablonu;
DROP TABLE IF EXISTS dilekce_odt_sablonu;
```

---

## 6. Retirement & Migration Strategy (Tiptap + ODT Cleanup)

Per PROJECT.md: **"Mevcut Tiptap/ODT verisinin export'u yok — kullanıcı onayı ile silinecek"**. This is a destructive migration; sequencing matters to keep the app bootable at every commit.

### Phase-ordered retirement checklist

| Step | Action | Location |
|------|--------|----------|
| R1 | Remove `dilekceRouter` + `dilekceOdtRouter` registration from `_app.ts` | `lib/trpc/routers/_app.ts` |
| R2 | Delete `app/(dashboard)/dilekce/` directory (pages + components) | `app/(dashboard)/dilekce/` |
| R3 | Delete `app/api/dilekce/` and `app/api/dilekce-odt/` | `app/api/` |
| R4 | Delete router files `dilekce.ts`, `dilekce-odt.ts` | `lib/trpc/routers/` |
| R5 | Delete services `odt-to-pdf.ts`, `degisken-substitution.ts` | `lib/services/` |
| R6 | Remove nav link "Dilekçe" from dashboard layout | `app/(dashboard)/layout.tsx` |
| R7 | Uninstall unused packages: Tiptap, `adm-zip`, `@xmldom/xmldom` (if not used elsewhere) | `package.json` |
| R8 | Drizzle migration: `DROP TABLE dilekce_sablonu; DROP TABLE dilekce_odt_sablonu;` | `drizzle/migrations/` |
| R9 | Remove ORM definitions `dilekceSablonu`, `dilekceOdtSablonu` from `schema.ts` | `lib/schema.ts` |
| R10 | One-shot cleanup script deletes `./uploads/odt-templates/*.odt` + logs count | `scripts/cleanup-v1-2.ts` |

### Safety guards

1. **Manual backup before R8:** `copy ./data/db.sqlite ./data/db.sqlite.pre-v1.2.bak` — documented in milestone runbook, not automated (explicit user consent).
2. **Cleanup script refuses without `--yes` flag** and without a fresh `.bak` present.
3. **R1–R7 ship first and are tested.** Only after the UI layer is clean do you drop tables (R8); dropping tables before removing imports causes runtime errors.
4. **Post-cleanup smoke test:** `next build` must pass with zero references to `dilekceSablonu`/`dilekceOdtSablonu`.

### Why no export?

Per PROJECT.md Out of Scope: user has explicitly opted out; do not silently preserve data.

---

## 7. Suggested Build Order (Unblocks Early UAT)

The ordering maximizes commits that keep the app green and shortens the time until the user can **manually test a full generation end-to-end** — the fastest path to learning whether docxtpl + LibreOffice produces usable PDFs for this user's Turkish templates.

### Phase A — Foundation (Python sidecar harness, zero UI impact)

1. `scripts/docx-pipeline/` scaffolding: pyproject.toml, venv, pinned requirements (pydantic v2, docxtpl, jinja2, babel, python-slugify, structlog, tenacity)
2. `cli.py --mode=health` — no template logic yet
3. `lib/services/docx-pipeline.ts` — `healthCheck()` only
4. tRPC `pipelineSaglik` router + one-off page `/ayarlar/pipeline` displaying result
5. **UAT checkpoint:** user runs on their machine, confirms LibreOffice detected or sets `LIBREOFFICE_PATH` in `.env`

### Phase B — Template CRUD (no rendering yet)

6. Drizzle migration: CREATE `docx_sablon`
7. tRPC `docxSablon` router: list / byId / upload / delete
8. Python `cli.py --mode=extract-vars` — parses `{{ var }}` and `{% %}` tags from docx
9. `app/(dashboard)/sablonlar/` page + `ShablonList` + `ShablonUploadDialog`
10. **UAT checkpoint:** user uploads 2–3 real templates, confirms variable list looks right

### Phase C — Pipeline Core (render + convert + write)

11. `schema.py` Pydantic models mirroring Drizzle
12. `render.py` docxtpl wrapper + `filters.py` (tr_currency, tr_date, title_tr)
13. `convert.py` LibreOffice subprocess with retry (tenacity, 2 attempts)
14. `cli.py --mode=render` reads stdin JSON, writes PDF to output_path
15. `lib/services/payload-builder.ts`
16. `lib/services/docx-pipeline.ts` full `runPipeline()`
17. Dev-only debug CLI: `npm run generate-test -- --dosya=5 --sablon=2`
18. **UAT checkpoint:** generate 3–5 test PDFs against real dosya data, visually verify Turkish chars, numbers, dates — **this retires the biggest architectural risk**

### Phase D — Archive + DB Integration

19. `filename-builder.ts` — `{müvekkil-slug}-{plaka-slug}-{seq}.pdf`
20. Year/month/kategori directory auto-creation (Python side)
21. tRPC `belgeUret.generate` mutation — orchestrates pipeline + transactional belge insert + logOlay
22. **UAT checkpoint:** trigger via tRPC panel, verify PDF appears in Belgeler tab and download works

### Phase E — UI Integration

23. `SablondanUretButton` component — dropdown listing templates filtered by dosya.tur
24. Optimistic UI + loading state during ~1.5 s generation
25. `LibreOfficeBanner` conditional render
26. **UAT checkpoint:** user performs the full "İhtarname Üret" workflow from Belgeler tab

### Phase F — Retirement

27. Execute R1–R7 (code removal)
28. Execute R8 (Drizzle migration dropping tables) + R10 (filesystem cleanup)
29. Run `next build` — must pass
30. **UAT checkpoint:** nothing visible references old "Dilekçe" pages; new pipeline is sole document generator

**Why this order:** Phases A–C are *additive* and break nothing. By Phase C (checkpoint 18) user can manually generate a PDF end-to-end — de-risks the biggest uncertainty (does docxtpl+LO produce Turkish-correct PDFs?) before any UI or retirement work. Retirement (F) runs last so rollback is always possible until the final commit.

---

## 8. Pipeline Logging

### Where logs live

| Log source | Destination | Format | Rotation |
|------------|-------------|--------|----------|
| Python sidecar | `./uploads/pipeline-logs/YYYY-MM-DD.jsonl` | structlog JSONL | Daily file, manual cleanup |
| Node service (`docx-pipeline.ts`) | Console (`next dev`) + same JSONL via append | JSON line tagged `source: "node"` | Same file |
| tRPC request errors | Next.js server console | Text | None |

### Log shape (structlog)

```json
{"ts":"2026-04-20T14:32:11.123Z","source":"python","level":"info","event":"render_started","dosya_id":42,"sablon_id":7,"template":"ihtarname.docx","req_id":"a1b2c3"}
{"ts":"2026-04-20T14:32:12.456Z","source":"python","level":"info","event":"libreoffice_convert","duration_ms":980,"req_id":"a1b2c3"}
{"ts":"2026-04-20T14:32:12.789Z","source":"python","level":"info","event":"render_completed","output_path":"./uploads/sablon-pdf/2026/04/stk/ahmet-yilmaz-34abc-1.pdf","size_bytes":184523,"req_id":"a1b2c3"}
```

**`req_id`:** Node generates `crypto.randomUUID().slice(0,8)` per request, passes in payload, Python echoes in every log line. Trivially `grep`-able.

### Rationale

- **JSONL over plain text:** searchable with `jq`, parseable in Excel if user wants to inspect
- **Not in DB:** would add insert-per-log pressure on SQLite (checkpoint interference); filesystem is cheap and natural for append-only
- **Not just stderr:** stderr is scoped to a single subprocess run; a persistent log file enables debugging "this template failed yesterday" without reproducing
- **One file per day:** simple eyes-on debugging; no logrotate needed for solo-user scale

---

## 9. Scaling Considerations

| Scale | Architecture adjustment |
|-------|-------------------------|
| 1 user, < 50 generations/day (current) | One-shot subprocess is perfect. No changes needed. |
| 1 user, bulk batch (500 generations) | Serialize via queue in Node — do NOT parallelize spawns (LibreOffice headless on Windows locks a single user profile dir). Sequential with progress toast. |
| Multi-user future (out of scope) | Replace with persistent Python FastAPI worker, session-isolate LO profiles via `-env:UserInstallation=...` — major rearchitecture. |

### Scaling Priorities

1. **Payload size on big dosyas:** stdin pipe deadlock — switch that one request to temp-file IPC.
2. **LibreOffice cold start (~800 ms):** pre-warm by spawning `soffice --headless --nologo --norestore` on app boot if it ever matters.

Both are **not day-1 concerns**.

---

## 10. Anti-Patterns

### Anti-Pattern 1: Spawning Python from inside the tRPC handler

**What people do:** `child_process.spawn(...)` sits directly in the router mutation.
**Why it's wrong:** Makes handlers untestable, duplicates env/path logic across endpoints, couples auth/validation to OS-level concerns.
**Do this instead:** All subprocess calls route through `lib/services/docx-pipeline.ts`.

### Anti-Pattern 2: Storing generated PDFs in `public/uploads/`

**What people do:** Put generated PDFs under `public/` so Next.js serves them directly.
**Why it's wrong:** Bypasses auth — anyone who guesses a filename downloads the PDF.
**Do this instead:** Write to `./uploads/sablon-pdf/...` (outside `public/`), serve via the existing authenticated `/api/files/*` route.

### Anti-Pattern 3: Running LibreOffice concurrently

**What people do:** Fire two generate requests, two `soffice.exe` spawn in parallel.
**Why it's wrong:** LibreOffice on Windows uses a single `%APPDATA%\LibreOffice\4\user\` profile; concurrent invocations race on lockfiles and one silently fails (empty PDF).
**Do this instead:** Serialize at the Node layer with an in-memory mutex (`p-queue` with concurrency=1 or a `let busy = false` guard).

### Anti-Pattern 4: Passing raw Drizzle query result to Python

**What people do:** `child.stdin.write(JSON.stringify(dosyaWithRelations))`.
**Why it's wrong:** Drizzle result shape changes when relations are edited. Python either silently accepts extras or fails inside jinja with confusing `UndefinedError`.
**Do this instead:** `buildDosyaPayload()` explicitly maps Drizzle rows to the documented payload shape. Pydantic validates. Drift fails fast at the boundary.

### Anti-Pattern 5: Long-running Python daemon "for performance"

**What people do:** FastAPI/ZeroMQ worker because "subprocess is slow".
**Why it's wrong:** Port management, auth, lifecycle, HMR-orphan cleanup for a solo user with < 1 req/sec. 1.5 s cold start is invisible behind a spinner.
**Do this instead:** One-shot subprocess. Revisit only if measurement shows UX pain.

### Anti-Pattern 6: Trusting `template_path` and `output_path` from the client

**What people do:** Let the frontend pass file paths straight through to Python.
**Why it's wrong:** Path traversal or writing PDFs outside `./uploads/`.
**Do this instead:** Node resolves paths server-side. Template path looked up by `sablonId`. Output path built by `filename-builder.ts` under a fixed root. Python additionally validates paths stay inside expected roots.

---

## 11. Integration Points

### External Services (local-binary dependencies)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Python 3.11+ interpreter | Resolved via `PYTHON_PATH` env or `python` on PATH; venv at `scripts/docx-pipeline/.venv/` | Runbook documents `py -3.11 -m venv .venv` |
| LibreOffice (soffice.exe) | Resolved via `LIBREOFFICE_PATH` env, Windows well-known paths, or PATH | Health check probes version + writable user profile dir |
| `docxtpl` + `python-docx` | Pinned version in `requirements.txt`; pure-Python, no OS deps | Conservative upgrades — `docxtpl` rendering quirks change between minor versions |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| tRPC router ↔ `docx-pipeline.ts` | Direct function call | Service throws `PipelineError` subclass; router maps to tRPC errors |
| `docx-pipeline.ts` ↔ Python sidecar | `child_process.spawn` + JSON stdin/stdout | UTF-8 env enforced; 60 s timeout; stderr captured |
| Python sidecar ↔ LibreOffice | `subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', ...])` | Retry once on failure; optionally isolate profile with `-env:UserInstallation=file:///<tempdir>` |
| Python sidecar ↔ filesystem | Atomic write: `tmp → fsync → rename`; unlinks `.tmp` on failure | Never reads outside `./uploads/docx-templates/` |
| Node service ↔ Drizzle (SQLite) | Standard `db.query` + `db.transaction`; transaction spans belge insert + logOlay | Transaction opens AFTER Python completes — don't hold SQLite lock during 1.5 s subprocess |
| Existing `/api/files/*` ↔ generated PDFs | PDFs referenced by `belge.dosya_yolu` — served through the same auth-checked endpoint | No new endpoint needed |

---

## 12. Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Subprocess pattern choice (one-shot vs daemon) | HIGH | Standard Windows Node practice; solo-user load unambiguous fit |
| JSON-over-stdin reliability | HIGH | Payload budget (~20 KB) comfortably fits; UTF-8 env vars well-documented |
| docxtpl + LibreOffice rendering | MEDIUM-HIGH | Widely used combination; Turkish-character correctness deserves early UAT (Phase C ckpt 18) |
| Pydantic-mirrors-Drizzle contract | HIGH | Clean boundary; proven pattern |
| Retirement migration safety | HIGH | Straightforward drop; existing code surface mapped from current routers/services |
| Build order unblocking UAT | HIGH | Each phase ends with verifiable checkpoint; biggest risk retires at ~halfway |
| LibreOffice concurrent-instance limitation on Windows | HIGH | Documented; serialization guard is standard |
| 1 MB stdin threshold | MEDIUM | Empirical, not formally measured for this workload; stdin will always be safe here |

---

## Sources

- Python `subprocess` on Windows — stdio encoding, `PYTHONUTF8`, `PYTHONIOENCODING` (official Python docs)
- `docxtpl` (elapouya/python-docx-template) — Jinja2-templated docx rendering
- LibreOffice headless `--convert-to pdf` CLI, `-env:UserInstallation` isolation (LibreOffice docs)
- Existing codebase: `lib/trpc/routers/dilekce.ts`, `lib/trpc/routers/dilekce-odt.ts`, `lib/services/odt-to-pdf.ts`, `lib/schema.ts`
- `.planning/PROJECT.md` — v1.2 milestone scope and retirement mandate
- Drizzle ORM docs — `db.transaction`, `db.query.*.findFirst` with relations
- tRPC v11 + Next.js App Router integration patterns

---

*Architecture research for: Python-sidecar document pipeline integrated into Next.js + tRPC + Drizzle monolith on Windows 11.*
*Researched: 2026-04-20*
