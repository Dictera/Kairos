---
plan: 02-03
phase: 2
name: Dosya UI — List, Create/Edit Form, 6-Tab Detail Shell
status: complete
completed_at: 2026-04-12
---

## What Was Built

Full Dosya (case file) management UI: server-side filtered list, create/edit form, 6-tab detail shell.

## Key Files Created

- `components/dosya/dosya-list.tsx` — Paginated table (7 columns D-03), always-visible toolbar with search + 3 filter dropdowns + tarih range, skeleton loading, empty states (Wave 1 agent)
- `components/dosya/dosya-form.tsx` — 8-field create/edit form with müvekkil/sigorta selects, duplicate dosya_no field error, archive action in edit mode
- `components/dosya/dosya-detail-tabs.tsx` — 6-tab shell (D-14 order), tab hash persistence, archive/delete actions
- `components/dosya/genel-bilgiler-tab.tsx` — All dosya fields including muvekkil_plaka (D-12), türçe format, linked müvekkil
- `components/dosya/karsitaraflar-tab.tsx` — Read/edit mode, upsertTaraf mutation, karsitaraf_plaka (D-13)
- `app/(dashboard)/dosyalar/page.tsx` — List page (Wave 1 agent)
- `app/(dashboard)/dosyalar/yeni/page.tsx` — Create page
- `app/(dashboard)/dosyalar/[id]/page.tsx` — Detail page with 6 tabs
- `app/(dashboard)/dosyalar/[id]/duzenle/page.tsx` — Edit page with archive action

## Decisions Made

- 4 locked tabs show Lock icon + "Bu bölüm henüz yapılandırılmadı." (D-16)
- Tab persistence via URL hash
- Plaka shown in Genel Bilgiler and Karşı Taraflar tabs only, NOT in list (D-12, D-13)

## Self-Check: PASSED

TypeScript: 0 errors. Tests: 35 passed. All must_have truths satisfied.
