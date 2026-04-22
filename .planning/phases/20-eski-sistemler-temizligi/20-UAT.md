---
status: complete
phase: 20-eski-sistemler-temizligi
source:
  - 20-01-SUMMARY.md
  - 20-02-SUMMARY.md
  - 20-03-SUMMARY.md
  - 20-04-SUMMARY.md
started: 2026-04-22T14:30:00Z
updated: 2026-04-22T14:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Legacy /dilekce Redirect
expected: |
  Navigating to /dilekce (or any /dilekce sub-path like /dilekce/yeni) redirects to /ayarlar with HTTP 307.
result: pass

### 3. Sidebar Navigation Label
expected: |
  In the sidebar, "Dilekçeler" link is gone. "Şablon Yönetimi" appears in its place with icon, linking to /ayarlar.
result: pass

### 4. Retirement Modal Trigger
expected: |
  On first app load, if old dilekce_sablonu/dilekce_odt_sablonu tables exist in the database, the retirement AlertDialog appears with title "Eski Sistemleri Temizle" and description about permanent deletion.
result: pass

### 5. Retirement Modal — Vazgeç
expected: |
  Clicking "Vazgeç" closes the modal. On next app load, the modal reappears (one-time flag NOT set).
result: pass

### 6. Retirement Modal — Onayla
expected: |
  Clicking "Onayla" triggers cleanup. After completion, toast shows "Eski sistemler temizlendi. Sayfa yenileniyor…" and page reloads. Old tables dropped, uploads/odt-templates deleted.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]