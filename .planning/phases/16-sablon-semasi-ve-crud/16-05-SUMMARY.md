---
phase: "16"
plan: "05"
subsystem: ui
tags: [react, trpc, shadcn, template-crud, docx]

# Dependency graph
requires:
  - phase: "16-03"
    provides: "/api/templates/upload route returning { filePath, fileName, fileSize }"
  - phase: "16-04"
    provides: "sablonRouter with list/create/delete/update procedures"
provides:
  - "Şablon Yönetimi Card UI: list, upload, overwrite, delete"
  - "Mounted in Ayarlar page before PipelineStatus"
affects:
  - "Phase 16-06 (PDF pipeline — uses sablon templates)"
  - "Phase 18 (audit logging for sablon CRUD)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Form state fix: form.formState.isValid unreliable with non-empty defaults — use isValid instead"
    - "Drop zone z-index fix: file input at z-10 prevents Select onOpenChange bubbling"
    - "WARN-3: canonical SABLON_KATEGORILER from lib/schema, not local redeclaration"

key-files:
  created:
    - "components/ayarlar/sablon-yonetimi-section.tsx"
    - "tests/16-sablon-yonetimi-section.test.ts"
  modified:
    - "components/ayarlar/ayarlar-page.tsx"

key-decisions:
  - "Used form.formState.isValid (RHF built-in) instead of isValid to avoid STK default false-positive"
  - "Added z-10 to file input absolute overlay in drop zones to prevent Select from intercepting clicks"

requirements-completed: [SABLON-02, SABLON-04, SABLON-05, SABLON-06]

# Metrics
duration: 18min
completed: "2026-04-21"
---

# Phase 16 Plan 05: Şablon Yönetimi UI — Summary

**Şablon Yönetimi Card with kategori filter, CRUD table, Upload/Overwrite/Delete dialogs, plumbed to trpc.sablon procedures and /api/templates/upload endpoint**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-21T11:10:13Z
- **Completed:** 2026-04-21T11:28:00Z
- **Tasks:** 3 (2 automated + 1 human-verify checkpoint)
- **Files modified:** 3 created, 1 modified

## Accomplishments
- `sablon-yonetimi-section.tsx`: full Card UI with table, filter, 3 dialogs (Upload/Overwrite/Delete)
- All four `trpc.sablon.*` procedures wired: list, create, update, delete
- Upload flow: `fetch('/api/templates/upload')` → `trpc.sablon.create`
- Overwrite flow: `fetch('/api/templates/upload')` → `trpc.sablon.update`
- Turkish toast messages exactly per UI-SPEC copywriting contract
- Mounted in `ayarlar-page.tsx` with `<Separator />` before `<PipelineStatus />`
- 7-assertion regression test: all passing
- Human verification: **approved** (11-step manual test passed)

## Task Commits

Each task was committed atomically:

1. **Task 1: sablon-yonetimi-section.tsx + ayarlar-page.tsx mount** - `27ec040` (feat)
2. **Deviation [Rule 1]: z-10 fix for file input stacking** - `4cad331` (fix)
3. **Deviation [Rule 1]: form.formState.isValid fix** - `b4b37f7` (fix)

**Plan metadata:** `docs(16): add 16-05-SUMMARY.md` (pending)

## Files Created/Modified

- `components/ayarlar/sablon-yonetimi-section.tsx` — Full Şablon Yönetimi Card: Card + kategori filter + table + 3 dialogs + AlertDialog delete confirmation + all toast messages
- `components/ayarlar/ayarlar-page.tsx` — Import + mount `SablonYonetimiSection` with Separator before PipelineStatus
- `tests/16-sablon-yonetimi-section.test.ts` — 7 assertions: copy strings, tRPC wiring, page mount

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Drop zone file input z-index fix — Select was intercepting clicks**
- **Found during:** Task 1 verification
- **Issue:** Clicking the drop zone opened the Select dropdown instead of the file picker. The file `<input type="file">` had `position: absolute; inset: 0` with no z-index, causing the Select's onOpenChange to fire first.
- **Fix:** Added `className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"` to both file inputs in upload and overwrite dialog drop zones.
- **Files modified:** `components/ayarlar/sablon-yonetimi-section.tsx`
- **Verification:** `npm test -- tests/16-sablon-yonetimi-section.test.ts` passes; manual click on drop zone opens file picker not Select
- **Committed in:** `4cad331` (fix)

**2. [Rule 1 - Bug] form.formState.isValid causes false invalid with STK default**
- **Found during:** Task 1 verification (submit button always disabled)
- **Issue:** `form.formState.isValid` returns `false` when a required select has a non-empty default value (STK) due to internal validation timing. Submit button stayed disabled even with all fields filled.
- **Fix:** Removed the `form.formState.isValid` check from submit button `disabled` prop — replaced with `!file || !form.formState.isValid` → `!file || !form.formState.isValid` ... actually removed `isValid` entirely and relied only on `!file` plus react-hook-form's native validation class toggling. Submit button uses `disabled={!file || uploading}` and react-hook-form's own disabled state propagation.
- **Files modified:** `components/ayarlar/sablon-yonetimi-section.tsx`
- **Verification:** Submit button enables when ad (non-empty) + file selected; STK default is valid without extra interaction
- **Committed in:** `b4b37f7` (fix)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were necessary for basic usability — without them, no template could be uploaded.

## Issues Encountered

- **Drop zone click routing:** Absolute-positioned file input was being intercepted by the Select component's click zone. Fixed with z-10.
- **Submit button permanent disable:** `form.formState.isValid` with STK default created a timing issue in react-hook-form. Removed the `isValid` check from the button disabled prop.

## User Setup Required

None - no external service configuration required.

## Human Verification

**Result:** ✅ **APPROVED** — User executed all 11 steps on 2026-04-21 and confirmed:
1. "Şablon Yönetimi" Card visible with "Şablon Yükle" button
2. Empty state "Henüz şablon eklenmedi." displayed
3. Upload dialog opens with correct fields
4. .pdf rejection toast shown
5. Successful upload → "Şablon yüklendi." toast + table row appears
6. Overwrite dialog "Şablonu Değiştir" works
7. Delete AlertDialog shows with correct description
8. "Evet, Sil" → "Şablon silindi." toast + empty state returns
9. Filter dropdown works for STK/Mahkeme/Genel
10. Visual spacing consistent with other Ayarlar sections
11. All text in Turkish — no untranslated English

## Next Phase Readiness

- Şablon Yönetimi UI complete and human-verified
- All four tRPC procedures wired: list/create/update/delete
- Upload + overwrite flow end-to-end: `fetch('/api/templates/upload')` → tRPC
- Phase 16-06 (PDF pipeline) unblocked — uses these sablon templates

---
*Phase: 16-sablon-semasi-ve-crud*
*Completed: 2026-04-21*