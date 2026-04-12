---
plan: 02-02
phase: 2
name: Müvekkil UI — List, Detail, Create/Edit/Delete
status: complete
completed_at: 2026-04-12
---

## What Was Built

Müvekkil (client) management UI with full CRUD flow wired to tRPC router.

## Key Files Created

- `components/muvekkil/muvekkil-list.tsx` — Paginated table with Turkish-aware search (TC/Vergi No + name), action menu (view, edit, delete)
- `components/muvekkil/muvekkil-form.tsx` — react-hook-form + zod create/edit form with Turkish validation messages
- `components/muvekkil/muvekkil-detail.tsx` — Detail card showing client info + linked dosyalar table
- `app/(dashboard)/muvekkiller/page.tsx` — List page (server component shell)
- `app/(dashboard)/muvekkiller/yeni/page.tsx` — Create page
- `app/(dashboard)/muvekkiller/[id]/page.tsx` — Detail page
- `app/(dashboard)/muvekkiller/[id]/duzenle/page.tsx` — Edit page

## Decisions Made

- Delete guard: inline error banner when müvekkil has linked dosyalar (cannot delete), AlertDialog when unlinked (safe to delete) — per D-07/D-08 spec
- Turkish error messages throughout form validation
- Redirect to detail page after successful create/edit with success toast

## Self-Check: PASSED

All must_have truths satisfied. TypeScript compiles. tRPC endpoints consumed correctly.
