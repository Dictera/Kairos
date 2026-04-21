# Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-22
**Phase:** 19-belgeler-ui-ve-sablon-yonetimi-ekrani
**Mode:** discuss
**Areas discussed:** Belgeler Tab Flow, Template Variable Catalog, Variable Cheat-Sheet, Generated PDF Appearance, Jinja2 Filters, Missing-Variable Error UX

---

## Q&A Record

### Area 1: Belgeler Tab "Şablondan Üret" Flow

**Q1: Where should the "Şablondan Üret" UI sit in the Belgeler tab?**
- Options: Above BelgeUpload / Below BelgeUpload, above BelgeList / Separate card between upload and list
- **Answer:** Above BelgeUpload
- **Rationale:** Template generation is the primary action

**Q2: What should the generation progress UX look like?**
- Options: Inline spinner on button + toast / Modal dialog with step indicators / Tab-level loading overlay
- **Answer:** Modal dialog with step indicators
- **Rationale:** Blocks interaction but gives clear status; closes automatically on success

**Q3: What should happen after PDF generation succeeds?**
- Options: Auto-refresh list + scroll to new item / Toast success + manual list refresh / Success modal with preview/download
- **Answer:** Toast success + manual list refresh
- **Rationale:** Simplest implementation

**Q4: How should the template selector dropdown organize templates?**
- Options: Grouped by category with section headers / Flat alphabetical list with category badge / Category filter + searchable dropdown
- **Answer:** Category filter + searchable dropdown
- **Rationale:** Best for 10+ templates

---

### Area 2: Template Variable Catalog

**Q5: How should the user open a template's variable catalog?**
- Options: Click template row → modal / Inline expandable row / Separate "Detay" button per row
- **Answer:** Click template row → modal
- **Rationale:** Familiar pattern, clean separation

**Q6: What should the variable catalog display show?**
- Options: Grouped by tab with descriptions / Simple flat list with badges / Full detail with examples and deep-links
- **Answer:** Simple flat list with badges
- **Rationale:** Minimal, easy to scan

**Q7: Should unknown variables offer any action, or just the badge?**
- Options: Just the badge / Copy variable name button / Suggest adding to registry
- **Answer:** Just the badge
- **Rationale:** Purely informational

---

### Area 3: Variable Cheat-Sheet

**Q8: Where should the cheat-sheet live?**
- Options: Ayarlar page as expandable card / Separate page under /ayarlar/yardim / Both — summary card + full page
- **Answer:** Both — summary card + full page
- **Rationale:** Best of both

**Q9: What format should the full cheat-sheet page use?**
- Options: Grouped table with search / Copy-paste friendly reference / Interactive explorer with examples
- **Answer:** Copy-paste friendly reference
- **Rationale:** Optimized for lawyers editing Word templates

**Q10: What should the compact summary card on Ayarlar show?**
- Options: Total variable count + quick search / Top 10 most-used variables / Just a link to full page
- **Answer:** Just a link to full page
- **Rationale:** Cleanest, no duplication

---

### Area 4: Generated PDF Appearance

**Q11: How should generated PDF rows differ from manually uploaded documents in BelgeList?**
- Options: Template name as subtitle + seq badge / Different icon + colored border / Separate section within BelgeList
- **Answer:** Different icon + colored border
- **Rationale:** Visual distinction at a glance

---

### Area 5: Jinja2 Filters in Cheat-Sheet

**Q12: Should the cheat-sheet document Jinja2 filters?**
- Options: Yes, as a dedicated "Filtreler" section / Yes, inline with each variable / No, filters documented elsewhere
- **Answer:** Yes, inline with each variable
- **Rationale:** More contextual

---

### Area 6: Missing-Variable Error UX

**Q13: When pre-check fails, how should the deep-link to the missing data work?**
- Options: Clickable tab link in error message / Text-only guidance / Modal with missing vars list + tab buttons
- **Answer:** Text-only guidance
- **Rationale:** Simplest implementation

---

*End of discussion log*
