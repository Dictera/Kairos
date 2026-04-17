# Phase 12: Taraf Tab Driver Info UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 12-taraf-tab-driver-info-ui
**Areas discussed:** Form layout, View mode display, Validation & UX, Edit toggle, Empty state behavior

---

## Form layout & sectioning

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Card | Clear visual separation as its own "Diğer Sürücü Bilgileri" card below existing card | ✓ |
| Collapsible section | Expandable/collapsible within the existing card | |
| Inline with divider | Blended into existing form with a visual divider | |

**User's choice:** Separate Card — clear separation between counter-party info and driver info
**Notes:** Matches the existing card-per-section pattern in the tab

---

## View mode display

| Option | Description | Selected |
|--------|-------------|----------|
| Separate section when filled | Show driver section below existing grid only when data exists | ✓ |
| Mixed into existing grid | Always show driver rows in the same 2-column grid | |
| Always visible section | Always show the section with empty-state message | |

**User's choice:** Separate section when filled — hidden when all driver fields empty
**Notes:** Clean UX, no visual clutter when driver info is irrelevant

---

## Validation & UX

| Option | Description | Selected |
|--------|-------------|----------|
| Hint text + Turkish error | Show "Format: 05XXXXXXXXX" below phone field, Turkish error on invalid | ✓ |
| Minimal — errors only | No hints, let validation errors speak for themselves | |

**User's choice:** Hint text + Turkish error — guide users to correct format proactively

---

## Edit toggle mode

| Option | Description | Selected |
|--------|-------------|----------|
| Single edit toggle | One "Düzenle" / "İptal" for both cards, edit mode toggles together | ✓ |
| Independent edit toggles | Each card has its own enable/disable editing | |

**User's choice:** Single edit toggle — simpler, matches current behavior

---

## Empty state behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden when empty | Don't render driver section at all if no driver data exists | ✓ |
| Placeholder message | Show "Sürücü bilgisi girilmedi" text with edit link when empty | |

**User's choice:** Hidden when empty — cleanest approach, no visual noise

---

## the agent's Discretion

- Exact field order within driver section
- Empty edit-mode card styling details
- Whether to add field labels in Turkish or use English field names as labels

## Deferred Ideas

None — discussion stayed within phase scope.