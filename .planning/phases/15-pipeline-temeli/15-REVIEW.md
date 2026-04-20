---
status: findings
depth: standard
files_reviewed: 16
critical: 2
warning: 5
info: 5
total: 12
phase: 15-pipeline-temeli
review_date: 2026-04-20
---

# Code Review: Phase 15 — Pipeline Temeli

## Critical

### CR-01: Missing `logging` import in `main.py`

**File:** `scripts/docx-pipeline/main.py:24`

```python
wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
```

The `logging` module is used but never imported. This will raise `NameError: name 'logging' is not defined` at module load time, crashing the sidecar before it can process any command.

**Fix:** Add `import logging` to the imports at the top of the file.

---

### CR-02: Health check uses hardcoded `soffice` instead of platform-aware path

**File:** `scripts/docx-pipeline/main.py:53-54`

```python
result = subprocess.run(
    ["soffice", "--version"],
```

The Python sidecar health check invokes `soffice` directly, relying on it being in `PATH`. On Windows, LibreOffice is typically NOT in PATH — it's installed at `C:\Program Files\LibreOffice\program\soffice.exe`. This means the health check will always report LibreOffice as inaccessible on Windows, even when it's installed.

**Fix:** Accept the LibreOffice path as a parameter from the Node.js caller (which already computes it via `getLibreOfficePath()` in `config.ts`), or use `which`-equivalent logic in Python.

---

## Warning

### WR-01: `SIDECAR_DIR` uses `process.cwd()` — unstable in all deployment contexts

**File:** `lib/pipeline/config.ts:6`

```typescript
export const SIDECAR_DIR: string = resolve(process.cwd(), 'scripts/docx-pipeline')
```

`process.cwd()` returns the working directory of the Node process, which can vary depending on how the app is started (e.g., `npm run dev` from project root vs. running from a subdirectory). In production or when invoked from scripts, this may resolve to an incorrect path.

**Fix:** Use `path.resolve(__dirname, '../../scripts/docx-pipeline')` for a path relative to the module file, which is stable regardless of cwd.

---

### WR-02: LibreOffice version display prepends "v" to non-semver string

**File:** `components/pipeline/pipeline-status.tsx:49`

```tsx
<span className="text-xs text-muted-foreground">v{version}</span>
```

LibreOffice `--version` output is something like `LibreOffice 24.2.1.2`, not a bare semver. This renders as `vLibreOffice 24.2.1.2` which looks incorrect.

**Fix:** Either strip the "LibreOffice " prefix before display, or remove the "v" prefix and show the raw version string.

---

### WR-03: Health check cache is not concurrency-safe

**File:** `lib/pipeline/health-check.ts:26-43`

```typescript
let healthCache: HealthCache | null = null

export async function getHealthStatus(): Promise<HealthStatus> {
  if (healthCache && Date.now() < healthCache.expiresAt) {
    return healthCache.result
  }
  const result = await runHealthChecks()
  healthCache = { result, expiresAt: Date.now() + CACHE_TTL_MS }
  return result
}
```

Multiple concurrent requests can pass the cache check simultaneously before any one completes `runHealthChecks()`, causing redundant sidecar spawns. While not a correctness bug (all will produce the same result), it wastes resources.

**Fix:** Use a pending promise pattern — store the in-flight promise and return it to concurrent callers.

---

### WR-04: `runSidecarCommand` uses `main.py` without full path

**File:** `lib/services/docx-pipeline.ts:22`

```typescript
const { stdout, stderr, exitCode } = await execa(pythonPath, ['main.py'], {
```

Passing `main.py` as a bare filename relies on `cwd: SIDECAR_DIR` being correct (see WR-01). If `SIDECAR_DIR` resolves incorrectly, execa will fail with `ENOENT`. Should use `path.join(SIDECAR_DIR, 'main.py')` for the script path.

**Fix:** Change to `['path.join(SIDECAR_DIR, 'main.py')']` to be explicit.

---

### WR-05: `main.py` health check logs `python_accessible=True` hardcoded

**File:** `scripts/docx-pipeline/main.py:69`

```python
python_accessible=True,
```

This is hardcoded to `True` in the log output regardless of whether Python is actually functional. The log line should reflect the actual state or be removed since the sidecar running at all implies Python works.

**Fix:** Remove the field from the log (it's redundant — if the sidecar is running, Python is accessible) or compute it dynamically.

---

## Info

### IN-01: Exit code 99 used but not in `PIPELINE_EXIT_CODES`

**Files:** `scripts/docx-pipeline/main.py:104,112,126,137` and `lib/pipeline/error-codes.ts`

The sidecar uses exit code `99` for unknown commands and internal errors, but `error-codes.ts` only defines codes 0-4. `getTurkishErrorMessage(99)` falls through to the generic "Bilinmeyen hata (kod: 99)" which is acceptable, but the inconsistency between the two files should be documented or code 99 should be added to the map.

---

### IN-02: `runSidecarCommand` result uses type assertion instead of schema validation

**File:** `lib/pipeline/health-check.ts:59-62`

```typescript
const r = result.result as { python_version?: string; python_accessible?: boolean }
```

Uses `as` type assertion instead of `CommandResultSchema.parse()`. If the sidecar returns an unexpected shape, this won't catch it at runtime.

---

### IN-03: Pipeline status added without separator in ayarlar page

**File:** `components/ayarlar/ayarlar-page.tsx:124-126`

All other sections in `AyarlarPage` are separated by `<Separator />` components, but `PipelineStatus` at line 126 follows a `<Separator />` at line 124 with no visual grouping distinction from the password change card above it. Consider adding a heading or visual distinction.

---

### IN-04: `pipeline.test.ts` passes empty context to `createCaller`

**File:** `tests/lib/trpc/routers/pipeline.test.ts:36,49`

```typescript
const caller = pipelineRouter.createCaller({})
```

The tRPC context `{}` may not match the actual context type expected by `@/lib/trpc/init`. If the init layer requires specific context properties (e.g., `session`, `db`), this test could pass while the real router fails.

---

### IN-05: `echo_sidecar.py` ignores the command type and always returns health-check result

**File:** `scripts/docx-pipeline/__test__/echo_sidecar.py:18-26`

The mock sidecar always returns a health-check-shaped response regardless of what command was sent. If tests later send `extract-vars` or `render` commands, this mock will return misleading data.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| Warning  | 5     |
| Info     | 5     |
| **Total** | **12** |

**Blockers:** CR-01 (missing import) will crash the sidecar on startup and must be fixed before any pipeline functionality works. CR-02 causes false-negative LibreOffice detection on Windows.
