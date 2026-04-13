# Phase 7: Petition Templates + PDF + Reports - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 07-petition-templates-pdf-reports
**Areas discussed:** Template editor, Variable insertion UX, PDF library, Variable set, Report layout, Font validation, Template types, Save to Belgeler

---

## Template Editor

| Option | Description | Selected |
|--------|-------------|----------|
| Rich text editor (Tiptap/Slate) | Rich text with formatting (bold, lists, headings) — more powerful but complex | ✓ |
| Plain textarea with variable markers | Simple textarea where users type {{variable}} manually — less UI complexity | |
| WYSIWYG with live preview | Split layout: formatted preview on one side, variable-rich text on the other | |

**User's choice:** Rich text editor (Tiptap/Slate)

---

## Variable Insertion UX

| Option | Description | Selected |
|--------|-------------|----------|
| Insert from dropdown menu | Menu shows all available variables — user clicks to insert at cursor position | ✓ |
| Autocomplete as you type | Start typing variable name, autocomplete suggests matching variables | |
| Toolbar button dialog | Toolbar button opens variable list dialog — select to insert | |

**User's choice:** Insert from dropdown menu

---

## PDF Library

| Option | Description | Selected |
|--------|-------------|----------|
| pdfmake (Recommended) | Declarative document definition — good Turkish font support, mature, battle-tested | ✓ |
| @react-pdf/renderer | React component model — more flexible but larger bundle, Turkish font setup more complex | |

**User's choice:** pdfmake (Recommended)

---

## Variable Set

| Option | Description | Selected |
|--------|-------------|----------|
| Full set (all DILEKCE-02 variables) | Cover all DILEKCE-02 variables: müvekkil_adı, dosya_no, dava_no, stk_no, mahkeme, duruşma_tarihi, talep_tutari, sigorta_şirketi, karşı taraf, vekil, poliçe no, and more | |
| Minimal viable set | Start with basic variables — add more as users request them | |
| Full set + custom variables | All DILEKCE-02 variables plus user can define custom variables per template | ✓ |

**User's choice:** Full set + custom variables

---

## Report Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Charts + summary stats + tables | Summary stats + visual charts (bar/pie) for portfolio breakdown, with table detail below | ✓ |
| Table-centric with export options | Detailed tables with all numbers, sparklines for trends, export buttons for PDF/Excel | |
| Dynamic filter with live preview | Interactive: user can filter by date range, case type, stage — preview updates live before export | |

**User's choice:** Charts + summary stats + tables

---

## Font Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Validate as Plan 07-01 spike | Validate in Plan 07-01 spike — if fonts don't work, switch library before planning continues | |
| Roboto TTF (bundled) | Use Roboto TTF — widely available, covers Turkish chars, embed in PDF | |
| DejaVu Sans TTF | Use DejaVu Sans TTF — excellent Turkish coverage, also embed in PDF | |

**User's choice:** times new roman

**Notes:** User selected Times New Roman as system font. Clarified: Times New Roman is a system font, relies on Windows installation. Not embedded in PDF.

---

## Template Types

| Option | Description | Selected |
|--------|-------------|----------|
| Two types: STK and Mahkeme | STK (Tahkim) and Mahkeme (Court) template types — each with their own variable sets | |
| Single type, no categories | All templates are general — user selects which variables to use | |
| Multiple named categories | Built-in categories for different petition types (objection, appeal, response, etc.) | ✓ |

**User's choice:** Multiple named categories

**Notes:** Three categories: İtiraz Dilekçesi, Cevap Dilekçesi, Genel

---

## Save to Belgeler

| Option | Description | Selected |
|--------|-------------|----------|
| Save to Belgeler button (one click) | After generating PDF, show button 'Save to Case Documents' — one click to save to Belgeler list | |
| Download only | Generate and download — no automatic save option | |
| Both: preview then save or download | Generate, preview, then decide — Save/Download options shown after preview | ✓ |

**User's choice:** Both: preview then save or download

---

## Agent's Discretion

The user delegated the following to the agent's discretion:
- Exact Tiptap plugin configuration and toolbar layout
- PDF styling (margins, font sizes, header/footer)
- Chart library choice for reports (recharts or similar)
- Excel library choice (xlsx, exceljs)
- Portfolio report: exact chart types (bar/pie for stage breakdown)
- Custom variable UI in template editor
- Variable substitution service exact implementation
- Save-to-belge: exact filename format for generated PDF

## Deferred Ideas

- Adli tatil automatic calculation in PDF date display — future phase
- Template versioning — user can save multiple versions of same template

---

*Phase: 07-petition-templates-pdf-reports*
*Discussion completed: 2026-04-13*