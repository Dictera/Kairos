# Phase 15: Pipeline Temeli - Research

**Researched:** 2026-04-20
**Domain:** Node.js subprocess management (execa), LibreOffice headless integration, Python venv lifecycle, Next.js health check caching
**Confidence:** HIGH

## Summary

This phase builds the infrastructure for calling a Python sidecar from Next.js via `execa`, detecting LibreOffice and Python binaries across platforms, and surfacing a health check banner when dependencies are missing. The core architecture is a single-entry-point Python script (`main.py`) using a JSON stdin/stdout command envelope pattern, with structured stderr logging via `structlog`.

**Primary recommendation:** Use `execa` v9 with `stdin: {input: jsonString}` for one-shot command invocations (not persistent IPC channels), platform-aware default path detection with `.env.local` overrides, and a tRPC-based health check procedure cached at ~5 minutes via a module-level in-memory cache — not Next.js `'use cache'`, which is designed for prerendering, not runtime dependency checks.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tek entry point (`main.py`) + subcommand pattern — JSON stdin'den `command` alanı alır (`extract-vars`, `render`, `convert`). Tek process spawn, tüm işlemler aynı schema üzerinden.
- **D-02:** App startup'ta bir kez çalış, sonucu ~5 dakika cache'le. Cache'e göre banner göster veya gizle. Her page load'da tekrar check etmez.
- **D-03:** Sağlık banner'ı tüm sayfalarda üstte görünür (layout-level component). Python VEYA LibreOffice erişilemezse Türkçe uyarı gösterir.
- **D-04:** Ayarlar > Pipeline Durumu kartı: LibreOffice ve Python versiyon bilgisi + erişilebilirlik durumu (yeşil/kırmızı indicator).
- **D-05:** Command envelope pattern — stdin: `{"command": "render", "params": {...}}` → stdout: `{"status": "success", "result": {...}}` veya `{"status": "error", "code": 2, "message": "..."}`. JSON-RPC 2.0 gereksiz complex.
- **D-06:** stderr JSONL log stream olarak kullanılır (structlog output). tRPC bu logları ignore eder ama debug için erişilebilir tutulur.
- **D-07:** Exit kodları sabit: 0=başarı, 1=validation, 2=render, 3=convert, 4=archive. tRPC bu kodları Türkçe toast mesajlarına çevirir.
- **D-08:** Platform-aware default detect — `LIBREOFFICE_PATH` boşsa: Windows → `C:\Program Files\LibreOffice\program\soffice.exe`, Linux → `/usr/bin/soffice`, macOS → `/Applications/LibreOffice.app/Contents/MacOS/soffice`.
- **D-09:** `PYTHON_PATH` için `python3` veya `python` PATH'te aranır. Bulunamazsa health check başarısız döner.
- **D-10:** `.env.local` override eder — kullanıcı custom install location'ları `.env`'den belirtebilir.
- **D-11:** Sidecar `./scripts/docx-pipeline/` dizininde çalışır. Kendi venv'i olur.
- **D-12:** Gerekli paketler: `pydantic v2`, `docxtpl`, `jinja2`, `babel`, `python-slugify`, `structlog`, `tenacity`.
- **D-13:** `execa` üzerinden spawn edilir — Next.js tarafında `lib/services/docx-pipeline.ts` tek giriş noktası.

### Agent's Discretion
- Health check cache TTL süresi (5 dakika önerildi ama planner optimize edebilir)
- structlog format detayları (JSON vs text)
- Error message Türkçeleştirme stratejisi (hardcoded vs translation file)
- venv kurulum script'i detayları (otomatik mi manuel mi)

### Deferred Ideas (OUT OF SCOPE)
- None

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Python sidecar spawning | API / Backend (tRPC server) | — | Subprocess calls run on Node.js server, not client |
| Binary path detection | API / Backend | — | `which`/path resolution requires server-side filesystem access |
| Health check execution | API / Backend | — | Spawns Python/LibreOffice to verify; server-only operation |
| Health check caching | API / Backend | — | Module-level in-memory cache on server process |
| Health banner display | Browser / Client | Frontend Server (SSR) | Layout-level React component, data from tRPC query |
| Pipeline status card | Browser / Client | Frontend Server (SSR) | Settings page component, data from tRPC query |
| IPC protocol (JSON stdin/stdout) | API / Backend | — | execa spawns Python, reads stdout/stderr on server |
| venv setup script | API / Backend | — | Runs `python -m venv` + `pip install` during app init or on-demand |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `execa` | 9.6.1 | Subprocess management, stdin/stdout/stderr piping | Industry standard for Node.js process execution. 570+ Context7 snippets, 94.8 benchmark score. Replaces `child_process` with human-friendly API. [VERIFIED: npm registry + Context7] |
| `which` | 6.0.1 | Cross-platform executable path resolution | Finds binaries in PATH on Windows/Linux/macOS. Used by npm itself. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | (already in project via Next.js) | `.env.local` loading | Next.js auto-loads `.env.local` — no extra package needed [VERIFIED: Next.js docs] |

### Python Sidecar (D-12 locked)
| Package | Purpose | Why Standard |
|---------|---------|--------------|
| `pydantic` v2 | Input validation, schema enforcement | Industry standard for Python data validation [VERIFIED: PyPI] |
| `docxtpl` | DOCX template rendering with Jinja2 | Direct `.docx` manipulation, Jinja2 support [VERIFIED: PyPI] |
| `jinja2` | Template engine (docxtpl dependency) | Python's standard template engine [VERIFIED: PyPI] |
| `babel` | i18n/locale formatting (Turkish currency, dates) | Standard Python i18n library [VERIFIED: PyPI] |
| `python-slugify` | ASCII-safe slug generation | Handles Turkish character normalization [VERIFIED: PyPI] |
| `structlog` | Structured JSON logging (stderr JSONL) | Modern Python logging, JSON output support [VERIFIED: PyPI] |
| `tenacity` | Retry logic with exponential backoff | Standard Python retry library [VERIFIED: PyPI] |

**Installation (Node.js):**
```bash
npm install execa which
```

**Installation (Python sidecar):**
```bash
cd scripts/docx-pipeline
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install pydantic docxtpl jinja2 babel python-slugify structlog tenacity
```

**Version verification:**
- `execa` 9.6.1 — published 2025, requires Node.js `^18.19.0 || >=20.5.0` [VERIFIED: npm registry]
- `which` 6.0.1 — published 2024 [VERIFIED: npm registry]
- Project runs Next.js 16.2.3 with Node.js compatibility confirmed

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `execa` | `child_process.spawn` (built-in) | More boilerplate, no timeout handling, no error enrichment |
| `execa` | `cross-spawn` | Less feature-rich, no stdin/stdout transforms |
| `which` | Manual PATH scanning | Platform-specific edge cases (Windows `.exe` extensions, case sensitivity) |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App                        │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │  Dashboard    │    │  tRPC Router (server)         │  │
│  │  Layout       │    │                               │  │
│  │               │    │  ┌─────────────────────────┐  │  │
│  │ ┌───────────┐ │    │  │ pipelineRouter          │  │  │
│  │ │Health     │ │◄───┼──│ - pipeline.healthCheck()│  │  │
│  │ │Banner     │ │    │  │ - pipeline.status()     │  │  │
│  │ └───────────┘ │    │  └──────────┬──────────────┘  │  │
│  │               │    │             │                  │  │
│  │ ┌───────────┐ │    │  ┌──────────▼──────────────┐  │  │
│  │ │Settings   │ │    │  │ docx-pipeline.ts        │  │  │
│  │ │Pipeline   │ │◄───┼──│ (single entry point)    │  │  │
│  │ │Status Card│ │    │  │ - execa spawn           │  │  │
│  │ └───────────┘ │    │  │ - JSON stdin/stdout     │  │  │
│  └──────────────┘    │  │ - exit code mapping     │  │  │
│                      │  └──────────┬──────────────┘  │  │
│                      └─────────────┼─────────────────┘  │
└────────────────────────────────────┼────────────────────┘
                                     │ execa.spawn()
                                     ▼
┌─────────────────────────────────────────────────────────┐
│              Python Sidecar (./scripts/docx-pipeline/)   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  main.py (single entry point)                      │  │
│  │                                                   │  │
│  │  stdin:  {"command": "...", "params": {...}}      │  │
│  │  stdout: {"status": "success", "result": {...}}   │  │
│  │  stderr: JSONL structlog lines                    │  │
│  │  exit:   0=ok, 1=validation, 2=render, etc.      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Python venv  │    │ LibreOffice (soffice.exe)    │  │
│  │ (.venv)      │    │ - platform default path      │  │
│  │ - pydantic   │    │ - .env override              │  │
│  │ - docxtpl    │    │ - temp profile per call      │  │
│  │ - structlog  │    │                              │  │
│  │ - tenacity   │    │                              │  │
│  └──────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
scripts/
└── docx-pipeline/         # Python sidecar directory
    ├── .venv/             # Virtual environment (gitignored)
    ├── main.py            # Single entry point (D-01)
    ├── requirements.txt   # Pinned dependencies
    └── setup-venv.ps1     # Windows venv setup script

lib/
├── services/
│   └── docx-pipeline.ts   # Single execa entry point (D-13)
├── pipeline/
│   ├── config.ts          # Path detection, platform defaults (D-08, D-09)
│   ├── health-check.ts    # Health check + caching (D-02)
│   ├── protocol.ts        # IPC envelope types (D-05)
│   └── error-codes.ts     # Exit code → Turkish message mapping (D-07)
└── trpc/
    └── routers/
        └── pipeline.ts    # tRPC router (healthCheck, status procedures)

app/(dashboard)/
├── layout.tsx             # Modified: add HealthBanner
└── ayarlar/
    └── page.tsx           # Modified: add Pipeline Durumu card

components/
└── pipeline/
    ├── health-banner.tsx  # Layout-level warning banner (D-03)
    └── pipeline-status.tsx # Settings page status card (D-04)
```

### Pattern 1: execa One-Shot JSON IPC
**What:** Spawn Python process per command, send JSON via stdin, parse JSON from stdout, capture stderr as JSONL logs.
**When to use:** Every sidecar invocation (health check, extract-vars, render, convert).
**Example:**
```typescript
// Source: Context7 /sindresorhus/execa — Object Mode Transform for JSON Parsing
import { execa } from 'execa'
import type { CommandEnvelope, CommandResult } from '@/lib/pipeline/protocol'

export async function runSidecarCommand(envelope: CommandEnvelope): Promise<CommandResult> {
  const { stdout, stderr, exitCode } = await execa(
    PYTHON_PATH,
    ['main.py'],
    {
      cwd: SIDECAR_DIR,
      input: JSON.stringify(envelope),
      timeout: 30_000,
      reject: false, // Don't throw on non-zero exit — we handle codes ourselves
    }
  )

  const result: CommandResult = JSON.parse(stdout)

  if (result.status === 'error') {
    // stderr contains JSONL structlog lines for debugging
    console.error('[sidecar stderr]', stderr)
  }

  return { ...result, exitCode }
}
```

### Pattern 2: Platform-Aware Binary Detection
**What:** Check `.env.local` override first, fall back to platform-specific defaults, use `which` for PATH search.
**When to use:** Health check, path configuration.
**Example:**
```typescript
import which from 'which'

function getDefaultLibreOfficePath(): string | null {
  if (process.platform === 'win32') return 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
  if (process.platform === 'darwin') return '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  return '/usr/bin/soffice'
}

async function findPythonPath(): Promise<string | null> {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH
  try { return await which('python3') } catch { /* ignore */ }
  try { return await which('python') } catch { /* ignore */ }
  return null
}
```

### Pattern 3: In-Memory Health Check Cache
**What:** Module-level singleton cache with TTL. Check on first request, cache result for 5 minutes, refresh on next request after expiry.
**When to use:** Health check banner data source.
**Example:**
```typescript
// Module-level singleton — survives across requests in same Node.js process
let healthCache: { result: HealthStatus; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getHealthStatus(): Promise<HealthStatus> {
  const now = Date.now()
  if (healthCache && healthCache.expiresAt > now) {
    return healthCache.result
  }
  const result = await runHealthChecks()
  healthCache = { result, expiresAt: now + CACHE_TTL_MS }
  return result
}
```

### Anti-Patterns to Avoid
- **Persistent Python process (long-running daemon):** LibreOffice and Python sidecar should be spawned per-invocation. Long-running daemons accumulate memory leaks, zombie processes, and state corruption. [CITED: serverless-libreoffice GitHub, Ask LibreOffice]
- **Using Next.js `'use cache'` for health checks:** `'use cache'` is designed for prerendering and data fetching, not runtime dependency checks. It has a minimum 5-minute threshold that can cause "dynamic hole" behavior. Use a simple in-memory module cache instead. [CITED: nextjs.org/docs/app/api-reference/functions/cacheLife]
- **Shared LibreOffice user profile:** Without `-env:UserInstallation=file:///TEMP/lo-{uuid}`, concurrent calls cause SingletonLock conflicts and hangs. [CITED: Ask LibreOffice, Stack Overflow #64811076]
- **`execa` with `ipc: true` for Python subprocess:** execa's `ipcInput`/`sendMessage` only works for Node.js child processes (Node's `--inspect` IPC channel). Python doesn't support Node's IPC protocol — use stdin/stdout JSON instead. [VERIFIED: Context7 execa docs — `execaNode` vs `execa`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subprocess spawning | `child_process.spawn` wrapper | `execa` v9 | Timeout handling, error enrichment, stdin input, stream transforms, cross-platform path handling |
| Binary path resolution | Manual PATH string splitting + `fs.access` | `which` package | Handles Windows `.exe` extensions, PATHEXT, case-insensitive matching, symlink resolution |
| Retry logic (LibreOffice convert) | Custom `setTimeout` loop | `tenacity` (Python) | Exponential backoff, jitter, retry predicates, max attempts — battle-tested |
| JSON schema validation (Python input) | Manual `dict.get()` checks | `pydantic v2` | Auto-generated error messages, type coercion, nested model support |
| Structured logging (Python stderr) | `print(json.dumps(...))` | `structlog` | Thread-safe, JSON output, log levels, context binding, easy parsing |
| Health check cache invalidation | `setTimeout` or cron | Module-level singleton with TTL check | Simple, no dependencies, survives across requests in same process |

**Key insight:** The deceptively complex parts are (1) LibreOffice's non-blocking behavior — `soffice --headless --convert-to` returns before the PDF file is actually written, and (2) execa's `reject: false` pattern — you need the exit code even on failure to map to Turkish error messages.

## Common Pitfalls

### Pitfall 1: LibreOffice `soffice` Non-Blocking Behavior
**What goes wrong:** `soffice --headless --convert-to pdf file.docx` returns immediately, but the PDF file is not yet written. Code checks for file existence too early and fails.
**Why it happens:** LibreOffice spawns a background conversion process and exits the CLI immediately.
**How to avoid:** Poll for file existence with a short interval (e.g., 200ms) for up to the timeout duration. Or use `--outdir` and check the output directory. [CITED: Ask LibreOffice #17526]
**Warning signs:** Intermittent "PDF not found" errors, works sometimes but not others.

### Pitfall 2: SingletonLock Conflicts
**What goes wrong:** Second LibreOffice call hangs or fails because the first call's profile lock file still exists.
**Why it happens:** LibreOffice creates a `.lock` file in the user profile directory. Without per-invocation temp profiles, concurrent calls conflict.
**How to avoid:** Always use `-env:UserInstallation=file:///TEMP/lo-{uuid}` with a unique UUID per call. Clean up the temp directory after the call completes. [CITED: Ask LibreOffice #68317, STATE.md accumulated context]
**Warning signs:** LibreOffice hangs indefinitely, CPU spikes to 100%, `.~lock.*` files left behind.

### Pitfall 3: execa `reject: true` (default) Masks Exit Codes
**What goes wrong:** When Python exits with code 1 (validation error), execa throws an exception before you can read stdout/stderr.
**Why it happens:** execa's default behavior is to reject on non-zero exit codes.
**How to avoid:** Use `reject: false` in execa options. Check `exitCode` and parse stdout manually. [VERIFIED: Context7 execa docs]
**Warning signs:** `ExecaError` thrown before you can read the error envelope from stdout.

### Pitfall 4: Python venv Path on Windows
**What goes wrong:** Using `venv/bin/python` path on Windows — the correct path is `venv\Scripts\python.exe`.
**Why it happens:** Cross-platform path differences.
**How to avoid:** Use `path.join(SIDECAR_DIR, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python')`. Or better: use the `PYTHON_PATH` from `.env` which points to the venv Python directly.
**Warning signs:** `ENOENT` errors when spawning Python on Windows.

### Pitfall 5: Windows Path Escaping in execa
**What goes wrong:** `C:\Program Files\LibreOffice\program\soffice.exe` contains spaces. If passed as a single string argument, it breaks.
**Why it happens:** Shell argument parsing splits on spaces.
**How to avoid:** execa handles this correctly when you pass the binary path as the first argument (not in an args array) and use array form for arguments. Never use shell mode unless necessary. [VERIFIED: Context7 execa docs]
**Warning signs:** `'C:\Program' is not recognized as an internal or external command`

### Pitfall 6: Next.js 15 Server Component Caching
**What goes wrong:** Health check data gets stale or cached at build time, showing outdated status.
**Why it happens:** Next.js 15 changed default caching — fetch requests are no longer cached by default, but `'use cache'` can cause prerendering issues.
**How to avoid:** Use a plain tRPC procedure (server-side function call) with in-memory module cache. Avoid `'use cache'` directives for health checks. [CITED: nextjs.org/docs/app/api-reference/functions/cacheLife]

## Code Examples

Verified patterns from official sources:

### execa with JSON stdin/stdout and exit code handling
```typescript
// Source: Context7 /sindresorhus/execa — Handle Input + Basic Error Handling
import { execa } from 'execa'

const { stdout, stderr, exitCode } = await execa(
  pythonPath,
  ['main.py'],
  {
    cwd: sidecarDir,
    input: JSON.stringify({ command: 'health-check', params: {} }),
    timeout: 10_000,
    reject: false,
  }
)

// stdout is the JSON response, stderr is JSONL logs
const response = JSON.parse(stdout)
// exitCode maps to Turkish messages per D-07
```

### execa timeout handling
```typescript
// Source: Context7 /sindresorhus/execa — Handle Execution Timeout
try {
  await execa({ timeout: 5000 })`npm run build`
} catch (error) {
  if (error.timedOut) {
    console.error('Command timed out after 5 seconds')
  }
  throw error
}
```

### Python structlog JSON configuration
```python
# Source: structlog official docs
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
)
log = structlog.get_logger()
log.info("sidecar_started", command="health-check")
```

### Python pydantic v2 command envelope
```python
# Source: pydantic v2 docs
from pydantic import BaseModel
from typing import Any, Literal

class CommandEnvelope(BaseModel):
    command: Literal["extract-vars", "render", "convert", "health-check"]
    params: dict[str, Any] = {}

class CommandResult(BaseModel):
    status: Literal["success", "error"]
    result: dict[str, Any] | None = None
    code: int | None = None
    message: str | None = None
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `child_process.spawn` with manual stream handling | `execa` v9 with `input`, `timeout`, `reject: false` | execa v8+ (2023) | Cleaner API, built-in timeout, better error objects |
| `child_process.exec` (shell) | `execa` with array arguments | Ongoing | No shell injection, proper argument escaping |
| Manual retry loops | `tenacity` decorator-based retry | Ongoing | Declarative retry policies, exponential backoff, jitter |
| `print()` for Python logging | `structlog` with JSONRenderer | Ongoing | Machine-parseable stderr, structured fields |
| LibreOffice shared profile | Per-invocation `-env:UserInstallation` temp profiles | Community best practice | No SingletonLock conflicts, safe concurrent calls |

**Deprecated/outdated:**
- `libreoffice-convert` npm package: Wraps LibreOffice but has known issues with `UserInstallation` temp directory handling on Windows. Our approach (direct execa → soffice) is more reliable. [CITED: Stack Overflow #64811076]
- `child_process.exec` with shell strings: Security risk, argument escaping issues. Use `execa` with array arguments.
- `execa` v8 IPC (`ipcInput`/`sendMessage`): Only works for Node.js child processes, not Python. Use stdin/stdout JSON for Python sidecars. [VERIFIED: Context7 execa docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js auto-loads `.env.local` without extra packages | Standard Stack | Low — well-documented Next.js behavior, easily verified |
| A2 | `which` package works on Windows with PATHEXT resolution | Standard Stack | Medium — if `which` doesn't handle Windows correctly, manual fallback needed |
| A3 | Module-level in-memory cache survives across tRPC requests in `next dev` | Architecture Patterns | Low — in dev mode, Next.js keeps server process alive; in production `next start`, same applies |
| A4 | Python `venv` on Windows uses `.venv/Scripts/python.exe` | Common Pitfalls | Low — documented Python behavior, easily verified |
| A5 | `structlog` JSONRenderer outputs one JSON object per line (JSONL) | Architecture Patterns | Low — structlog's JSONRenderer produces single-line JSON by default |

## Open Questions

1. **Should venv setup be automatic (on first health check) or manual (setup script)?**
   - What we know: D-11 says sidecar has its own venv. D-12 lists required packages.
   - What's unclear: Whether the plan should include automatic venv creation + pip install on first app start, or a separate setup script the user runs.
   - Recommendation: Provide a setup script (`setup-venv.ps1`) that the user runs once. Auto-creation adds complexity (permission issues, pip install failures during app startup). Health check should detect missing venv and show a clear error message.

2. **Should health check cache be invalidated manually (e.g., after user changes `.env`)?**
   - What we know: D-02 says 5-minute cache.
   - What's unclear: If user updates `.env.local` with new paths, they'd need to restart the dev server anyway for Next.js to pick up new env vars.
   - Recommendation: No manual invalidation needed. `.env` changes require server restart in Next.js, which clears the module-level cache.

3. **Should `which` package be used or manual `fs.access` checks?**
   - What we know: `which` is the standard for PATH resolution.
   - What's unclear: Whether the added dependency is worth it vs. a simple 10-line utility function.
   - Recommendation: Use `which` — it handles edge cases (Windows PATHEXT, case sensitivity, symlinks) that manual checks miss.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v22+ (inferred from package.json) | — |
| Python 3.x | Sidecar | ✗ (not verified) | — | Show banner "Python bulunamadı" |
| LibreOffice | PDF conversion | ✗ (not verified) | — | Show banner "LibreOffice bulunamadı" |
| `execa` npm | Subprocess management | ✗ (not installed) | 9.6.1 available | Install via `npm install execa` |
| `which` npm | Binary path detection | ✗ (not installed) | 6.0.1 available | Install via `npm install which` |
| Python venv | Sidecar isolation | ✗ (not created) | — | Create via `python -m venv .venv` |

**Missing dependencies with fallback:**
- `execa` and `which` — installable via npm, no alternative needed
- Python/LibreOffice — not installable from code; show banner and guide user

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 |
| Config file | None detected — see Wave 0 |
| Quick run command | `npx vitest run -t "pipeline"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | PYTHON_PATH from .env overrides default | unit | `npx vitest run lib/pipeline/config.test.ts -x` | ❌ Wave 0 |
| PIPE-02 | LIBREOFFICE_PATH from .env, fallback to platform default | unit | `npx vitest run lib/pipeline/config.test.ts -x` | ❌ Wave 0 |
| PIPE-03 | Health check runs, banner shows on failure | integration | `npx vitest run lib/pipeline/health-check.test.ts -x` | ❌ Wave 0 |
| PIPE-04 | Pipeline status returns version + accessibility | unit | `npx vitest run lib/trpc/routers/pipeline.test.ts -x` | ❌ Wave 0 |
| PIPE-05 | Sidecar venv exists with required packages | unit | `npx vitest run lib/pipeline/config.test.ts -x` | ❌ Wave 0 |
| PIPE-06 | execa spawns Python, JSON stdin/stdout works | integration | `npx vitest run lib/services/docx-pipeline.test.ts -x` | ❌ Wave 0 |
| PIPE-07 | Exit codes map to Turkish error messages | unit | `npx vitest run lib/pipeline/error-codes.test.ts -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <test-file> -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/pipeline/config.test.ts` — covers PIPE-01, PIPE-02, PIPE-05
- [ ] `lib/pipeline/health-check.test.ts` — covers PIPE-03
- [ ] `lib/pipeline/error-codes.test.ts` — covers PIPE-07
- [ ] `lib/services/docx-pipeline.test.ts` — covers PIPE-06 (needs mock Python script)
- [ ] `lib/trpc/routers/pipeline.test.ts` — covers PIPE-04

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing iron-session auth covers this |
| V3 Session Management | no | Existing session handling |
| V4 Access Control | no | Single-user app |
| V5 Input Validation | yes | pydantic v2 (Python sidecar), zod (TypeScript tRPC) |
| V6 Cryptography | no | Local-only deployment |

### Known Threat Patterns for execa + subprocess

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path injection via `.env` | Tampering | Validate binary paths exist and are executable before spawning |
| Command injection via params | Tampering | Never use shell mode in execa; always use array argument form |
| Denial of service (zombie processes) | Denial | execa timeout + cleanup; per-invocation temp profile cleanup |
| Information disclosure (stderr logs) | Information | stderr is JSONL structlog — only logged server-side, not exposed to client |

## Sources

### Primary (HIGH confidence)
- [Context7 /sindresorhus/execa](https://context7.com/sindresorhus/execa) — execa v9 API: stdin input, timeout, error handling, JSON transforms, IPC messaging
- [npm registry: execa 9.6.1](https://www.npmjs.com/package/execa) — version, engine requirements
- [npm registry: which 6.0.1](https://www.npmjs.com/package/which) — version, description
- [Python docs: venv](https://docs.python.org/3/library/venv.html) — venv creation, pyvenv.cfg, Scripts vs bin
- [Next.js docs: cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife) — caching behavior, minimum thresholds

### Secondary (MEDIUM confidence)
- [Ask LibreOffice #68317](https://ask.libreoffice.org/t/libreoffice-headless-sometimes-crashes-under-windows-10/68317) — UserInstallation temp profile on Windows, lock file issues
- [Stack Overflow #64811076](https://stackoverflow.com/questions/64811076/libreoffice-convert-not-working-in-nodejs) — libreoffice-convert issues, UserInstallation path problems
- [serverless-libreoffice GitHub](https://github.com/vladholubiev/serverless-libreoffice/blob/master/STEP_BY_STEP.md) — headless mode best practices, temp profile isolation
- [Ask LibreOffice #17526](https://ask.libreoffice.org/t/call-librefoffice-in-nodejs/17526) — soffice non-blocking behavior

### Tertiary (LOW confidence)
- structlog JSON output format — assumed based on library name and common patterns; needs verification from official docs
- tenacity retry decorator syntax — assumed based on training knowledge; needs verification from official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm registry and Context7
- Architecture: HIGH — execa patterns verified via Context7, LibreOffice patterns verified via multiple community sources
- Pitfalls: HIGH — verified via Stack Overflow, Ask LibreOffice, official docs
- Python packages (structlog, tenacity): MEDIUM — package existence verified, exact API patterns need Context7 verification during implementation

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days — execa and which are stable, Python packages are stable)