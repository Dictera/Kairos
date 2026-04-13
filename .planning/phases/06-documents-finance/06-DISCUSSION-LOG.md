# Phase 6: Documents + Finance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 06-documents-finance
**Areas discussed:** Storage Access, Upload UX, Finance Entry Fields, Finance Dashboard Views, Document Categories, Per-Case Finance Summary

---

## Storage Access

| Option | Description | Selected |
|--------|-------------|----------|
| Static URL (Recommended) | Files in public/uploads/{dosyaId}/ — simple, fast, no auth overhead | ✓ |
| Authenticated route | Route handler checks auth before serving — more secure but adds latency | |

**User's choice:** Static URL (Recommended)

---

## Upload UX

| Option | Description | Selected |
|--------|-------------|----------|
| Both (Recommended) | Drag-and-drop zone + file picker button — maximum flexibility | ✓ |
| File picker only | Simple button that opens file dialog — easier to implement | |
| Drag-and-drop only | Large drop zone — modern but less familiar | |

**User's choice:** Both (Recommended)

---

## Finance Entry Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Receipt number only | Just receipt/fatura no — simple | |
| Receipt + Payment method | Receipt no + payment method (Nakit, Banka, Kredi Kartı) | |
| Minimal (Recommended) | No extra fields — fastest to implement | ✓ |

**User's choice:** Minimal (just type/amount/date/desc)

---

## Finance Dashboard Views

| Option | Description | Selected |
|--------|-------------|----------|
| Tables only (Recommended) | Monthly/yearly income/expense tables — clear, fast | |
| Visual charts | Bar/pie charts — more visual | |
| Both tables and charts | Summary charts + detailed tables | ✓ |

**User's choice:** both tables and chart and use https://recharts.github.io/en-US/

---

## Document Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Default 4 | Dilekçe, Karar, Poliçe, Diğer | |
| Add more | Add: Sigorta poliçesi, Hasar dosyası, Vekaletname, vb. | ✓ |

**User's choice:** Sigorta poliçesi + Hasar dosyası + Vekaletname

**Notes:** Categories: Dilekçe, Karar, Poliçe, Sigorta poliçesi, Hasar dosyası, Vekaletname, Diğer (7 total)

---

## Per-Case Finance Summary

| Option | Description | Selected |
|--------|-------------|----------|
| Simple totals only | Toplam gelen, toplam giden, net bakiye | |
| Breakdown by type (Recommended) | Subtotals per type: Gelen, Giden, Masraf + overall net | ✓ |

**User's choice:** Breakdown by type

---

## Agent's Discretion

- File naming convention on disk (original name preserved vs UUID-based)
- Exact table column layout for finance dashboard
- Chart types (bar, line, pie) — any recharts type that fits the data

## Deferred Ideas

- Receipt/invoice document linking — future phase
- Multi-currency support — TL only for v1
