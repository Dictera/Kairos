# Feature Research — v1.2 Şablon Belgeler

**Domain:** Legal Document Automation (dilekçe / belge üretim pipeline)
**Researched:** 2026-04-20
**Confidence:** MEDIUM (domain familiarity + PROJECT.md + milestone_context; external WebSearch / Brave Search / ctx7 CLI were not available this run, so Turkish-market-specific feature surveys are based on pre-cutoff familiarity rather than a verified 2026 live scan.)

---

## Domain Framing

Professional legal document automation products (HotDocs, Woodpecker, Gavel/Documate, Clio Draft, Lawyaw, BriefCatch+Word merge, Turkish practice-management tools such as Hukuk Partner / LexOffice-TR şablon bölümü / custom UYAP-entegre dilekçe modülleri) converge on a common mental model:

1. **Template** = a `.docx` (occasionally `.odt` / `.docm`) with named placeholders.
2. **Variable catalog** = the strict schema of things a template can ask for.
3. **Binding** = pulling values from the matter (dosya) into the placeholders.
4. **Render** = producing a deterministic document (DOCX and/or PDF).
5. **Archive + link back** = the generated file lives in the matter file cabinet, linked to the template that produced it.

v1.2 implements steps 1–5 with `docxtpl` (Jinja2), LibreOffice headless, and a Python sidecar. The open product questions are UX-shaped: what metadata does a template carry, how does the user discover which variables exist, how much preview / batch / versioning do we expose. That is what this file categorises.

---

## Feature Landscape

### Table Stakes (Users Expect These — must ship in v1.2)

Missing any of these makes the new pipeline feel like a prototype rather than a replacement for the retired Tiptap editor + .odt flow.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `.docx` upload with name + mandatory category (STK / Mahkeme / Genel) | Category drives archive path (`./uploads/sablon-pdf/YYYY/AA/{kategori}/`) and tab-level filtering. Named templates are how lawyers think ("İhtarname", "Cevap Dilekçesi"). | LOW | Scoped directly by the milestone brief. Reject non-`.docx`, enforce category at DB level (NOT NULL + CHECK or enum). |
| Auto-extract `{{ variable }}` + `{%p %}` placeholders on upload, persist on the sablon row | User must see immediately whether the uploaded template is usable. Silent extraction = later runtime surprises. | MEDIUM | `docxtpl.DocxTemplate.get_undeclared_template_variables()` plus a regex pass for `{%p %}` paragraph tags. Store as JSON array on `sablon`. |
| Variable catalog view per template (extracted vars, recognised vs unknown) | Lawyer uploads a Word-authored template and must see "7 of 9 placeholders map to system fields; 2 unknown" before ever clicking generate. | MEDIUM | Compare extracted vars against a hardcoded variable registry (`muvekkil.*`, `taraf[n].*`, `surucu.*`, `stk.*`, `mahkeme.*`, `durusma[n].*`, `sure.*`, `finans.*`, `notlar`, dosya-level meta). Flag unknowns with badge. |
| One-click "Üret" button in Belgeler tab (dosya context) | The product thesis. "İhtarname Üret" button on the open dosya binds context + renders PDF in one click. Multi-step wizards defeat the purpose. | MEDIUM | tRPC mutation → pick template → bind dosya context → spawn Python sidecar → receive PDF path → refresh belge list. Optimistic UI + Turkish toast. |
| Deterministic filename scheme `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` (skip plaka segment when missing, seq per dosya auto-increment) | Filesystem archive must be legible without the app (lawyer opens File Explorer). `seq` per dosya avoids collisions on re-generation. | LOW | `python-slugify` in sidecar; seq computed on the TS side by counting existing sablon-generated belgeler rows per dosya. |
| Auto-archive to `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` AND auto-register in `belge` table (transactional) | Two retrieval paths: File Explorer and Belgeler tab. Both must stay in sync. Manual re-upload after generation = the flow is broken. | LOW | Transactional in TS: sidecar writes PDF → drizzle insert belge row → commit. Any failure rolls back both (delete PDF). |
| Jinja2 conditional blocks + loops (`{% if %}`, `{% for taraf in taraflar %}`, `{%p %}` paragraph tag, `{%tr tr %}` / `{%tc %}` table control) | Real dilekçeler have "if sürücü != müvekkil, add paragraph", "per karşı taraf one paragraph" — without this, users fall back to hand-editing every template per case. | MEDIUM | Supported natively by `docxtpl`; document the syntax for the lawyer via a cheat-sheet page in Ayarlar or Şablon detail. |
| Turkish filters: `tr_currency` ("150.000,00 TL"), `tarih` (dd.MM.yyyy), `upper_tr`, `lower_tr` | `.upper()` on "ıstanbul" produces "ISTANBUL" (wrong). Currency "150000" must render "150.000,00 TL". Non-negotiable in TR legal text. | LOW | Babel `format_currency(... locale='tr_TR')` and Python `str.translate()` for Turkish case. Register as jinja2 custom filters in the sidecar. |
| Turkish-language error surfacing (missing variable, unknown variable, LibreOffice not found, sidecar timeout, docxtpl render error) | Silent failures on PDF generation = lost trust. Every failure path needs a user-facing Turkish message. | MEDIUM | Sidecar emits structured JSON error (`{code, message, detail}`); tRPC translates to a toast. Banner on Ayarlar when `LIBREOFFICE_PATH` or `PYTHON_PATH` unset / invalid. |
| Variable reference / cheat-sheet page (what variables exist, TR-friendly names, example values) | Without this, the lawyer has to reverse-engineer variable names from the DB schema. Blocker for template authoring. | LOW | Static Markdown / React page under Ayarlar > Yardım, auto-generated from the variable registry so it never drifts. |
| Re-generate the same template for the same dosya (bumps seq, both kept) | Lawyer edits taraf bilgisi and re-runs ihtarname. Expectation: old PDF kept, new one is `…-002.pdf`. | LOW | Seq-based naming handles this; UI in Belgeler tab should show both, not collapse into one row. |
| Delete / replace uploaded template | User uploads wrong file, iterates. | LOW | Standard CRUD. Cascade does NOT delete previously generated PDFs — those are independent `belge` rows. |
| LibreOffice + Python install-check banner | The whole pipeline depends on two external binaries. Any path misconfiguration must surface at the top of the app, not at the moment of first generation. | LOW | Ayarlar page detects + displays version; global banner when either is missing. |
| Retire Tiptap editor + .odt upload code/UI/tables | This milestone's cleanup half. Two competing systems = confused UX and schema cruft. | MEDIUM | Destructive: remove `dilekce` + `dilekce-odt` routers, tables, UI tabs, and file-system folders. Per PROJECT.md, no export — user-confirmed deletion. |

### Differentiators (Competitive Advantage — pick 1–2 for v1.2, defer rest)

These are where v1.2 can exceed generic HotDocs-clones and feel bespoke for insurance-arbitration solo-lawyer work.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Missing-variable client-side pre-check + deep-link to the tab that owns the missing field | Fails fast in Turkish before the sidecar call; "Mahkeme esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin" with a clickable link. Saves a slow LibreOffice crash path and teaches the user. | LOW | Pure TS check against the registry at click-time. Highest-leverage UX addition for lowest cost. **Strong candidate for v1.2.** |
| Dry-run / preview binding (show resolved context as JSON or table before rendering) | Lawyer sees exactly what will substitute into every placeholder. Catches empty fields, wrong taraf, missing plaka. | MEDIUM | Separate tRPC endpoint: `previewBinding(dosyaId, sablonId)` returns the resolved context dict. Read-only table UI. Few competitors expose this — real differentiator. |
| Named quick-action buttons in Belgeler tab (e.g. "İhtarname Üret", "Cevap Dilekçesi Üret") + `is_default_for_action` flag on `sablon` | Lawyer flags their most-used template as the default for an action; one click = the right template. Much faster than a 30-item dropdown. | MEDIUM | Requires `sablon.default_aksiyon` enum or flag and a small `hizli_aksiyonlar` area on the Belgeler tab. |
| Template-to-dosya generation history (per template: which dosya, when, which seq) | Answers "did I already send ihtarname for dosya 2024/47?" without manual Belgeler search. | LOW | Simple view / query over `belge` rows joined on `sablon_id`. |
| Deterministic / reproducible PDF rendering (same dosya + same template + same seq → byte-identical PDF) | Legal defensibility — lawyer can reproduce exactly what was sent. | MEDIUM | Pin LibreOffice version + strip embedded metadata (`--convert-to pdf:writer_pdf_Export:...`). Defer unless user asks. |
| Fuzzy-match typo warning on upload ("your template references `muvekk.ad_soyad`; did you mean `muvekkil.ad_soyad`?") | Typos in Word are invisible until runtime. Levenshtein / first-segment match against the registry warns on upload. | MEDIUM | Warn only; do not block upload. |
| Multi-template batch (select N templates, generate all for one dosya in one click) | Common workflow: after STK başvurusu, lawyer wants ihtarname + dilekçe + vekâletname at once. | MEDIUM | Server-side loop over templates; single progress UI; each produces its own seq. Small win — likely v1.3. |

### Anti-Features (Commonly Requested, Explicitly NOT Add in v1.2)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-app WYSIWYG template editor | "Why do I have to leave the app and open Word?" | This is exactly what v1.2 is *retiring* (Tiptap). `.docx` + Word is a vastly better authoring surface than any web editor for Turkish typography, tables, numbering. | Keep "download template → edit in Word → re-upload" loop. PROJECT.md explicitly lists this as out of scope. |
| Template versioning with history / diff / rollback | "I want the previous version of ihtarname.docx back." | Full semver + Word-XML diff + UI version tree = 10× scope explosion. Lawyer already has Word + OneDrive/local file history outside the app. | Overwrite on upload. Optionally keep a single `.docx.bak` as "önceki sürüm" — not in v1.2. |
| Cloud template library / marketplace / shared templates across lawyers | "Can other lawyers share templates?" | Contradicts offline-first / single-user architecture. | Out of scope per PROJECT.md. |
| AI / LLM-generated dilekçe text, auto-fill of free-text fields | Hot 2025–26 legal-tech trend. "Let the model write itiraz gerekçesi." | Hallucination risk, PII privacy in insurance matters, requires cloud LLM → breaks offline-first. Different product. | Out of scope. Revisit in v2+ only if a fully-local Turkish-legal-corpus model becomes viable. |
| Digital signing / e-imza / KEP / UYAP integration | "Can the app sign the PDF and submit it to UYAP?" | Requires e-signature SDKs, KEP provider contracts, UYAP protocol, cert lifecycle. Full project in itself. | Out of scope v1.2. Lawyer signs manually and uploads the signed copy via existing Belge upload. |
| Live in-browser DOCX preview (Word-online-style) before PDF render | "Let me see the filled document in the browser before PDF." | DOCX-to-HTML faithful rendering is notoriously buggy (Mammoth.js, etc.). Turkish chars + tables + page-break drift = user blames the tool. | Render PDF, show PDF in browser via iframe after generation. Faster to ship, more reliable, same user intent. |
| Conditional-logic GUI builder (clicks instead of `{% if %}`) | "I don't want to learn Jinja syntax." | Rebuilds a programming language in a UI. HotDocs spent 20 years on this. Scope-insane for a solo-lawyer local tool. | Jinja2 cheat-sheet page + 3–5 example templates shipped in-app. |
| Parallel "variable entry form" inside the app (type values into a form, render) | "Why can't I just type the values directly?" | Contradicts the design: data lives in the dosya tabs. A parallel form = two sources of truth + staleness. | If a variable is missing, deep-link to the tab that owns it. Never create a bypass form. |
| Template variables that fetch from outside the dosya (HMK maddeleri, içtihat, TCMB kur) | "Can the template auto-insert the HMK madde text?" | Requires maintaining a legal-corpus DB in the app. Big scope, little v1.2 value. | Lawyer pastes boilerplate in the template itself. |
| Multiple canonical output formats (DOCX + PDF + HTML + ODT) | "Can I also download the Word version?" | Keep the generated DOCX as an intermediate deleted after PDF; offering both doubles storage and raises the "which is canonical" question. | PDF-only canonical output. If lawyer wants DOCX, they edit the template itself. |
| Export of existing Tiptap / .odt data before cleanup | "What about the old dilekçeler I wrote in the Tiptap editor?" | Dual-format export tooling is large, and PROJECT.md specifies user-confirmed deletion with no export. | Confirm deletion prompt; no export pipeline. |

---

## Feature Dependencies

```
[.docx upload + category]
    └──required-by──> [placeholder extraction]
                           └──required-by──> [variable-registry match / unknown-var flag]
                                                   └──required-by──> [missing-var client pre-check]
                                                                           └──required-by──> [one-click generate]
                                                                                                   └──required-by──> [archive + belge register]
                                                                                                                           └──required-by──> [deterministic filename + seq]

[variable registry]  ──enables──> [cheat-sheet page]
                     ──enables──> [preview binding (dry-run)]
                     ──enables──> [fuzzy-match typo autocomplete]
                     ──enables──> [named quick-action buttons]

[Jinja2 conditionals/loops via docxtpl]  ──enables──> [multi-taraf templates]
                                         ──enables──> [optional paragraph blocks]

[TR filters (tr_currency, tarih, upper_tr, lower_tr)]  ──required-by──> [any currency or date placeholder]
                                                       ──required-by──> [Turkish-correct casing in headings]

[LibreOffice headless]  ──required-by──> [PDF conversion]
    └──requires──> [LIBREOFFICE_PATH env + Ayarlar install-check banner]

[Python sidecar + .env PYTHON_PATH]  ──required-by──> [docxtpl render + filter registration]
    └──requires──> [sidecar install-check banner]

[one-click generate]  ──enhanced-by──> [named quick-action buttons]
                      ──enhanced-by──> [default-template-per-action flag]
                      ──enhanced-by──> [template-to-dosya generation history]

[multi-template batch]  ──requires──> [one-click generate]   (defer to v1.3)

[retire Tiptap + .odt]  ──conflicts-with──> [in-app WYSIWYG editor]  (the whole point is to remove it)
```

### Dependency Notes

- **Placeholder extraction requires the variable registry:** Without a hardcoded registry of all exposed dosya fields, extraction can *list* names but cannot *validate* them. The registry is the contract between the Word-author lawyer and the Python sidecar — it must be the single source of truth for both the cheat-sheet page and the client-side pre-check.
- **One-click generate requires archive + belge register:** The "one click" is the whole experience. If the generated PDF doesn't auto-appear in Belgeler, the user has to manually find and re-upload = broken.
- **Missing-var client pre-check enhances one-click generate:** Without it, generation fails deep in the sidecar with a cryptic Jinja2 `UndefinedError`. With it, it fails fast, in Turkish, with a deep-link. This is the single highest-leverage UX addition and should ship in v1.2.
- **Named quick-action buttons sit above a generic dropdown, not replace it:** Otherwise lesser-used templates become invisible. Ship both — buttons for the 3–5 most-used, dropdown "Diğer şablonlar…" for the rest.
- **Deterministic rendering conflicts with LibreOffice default metadata:** Requires specific export flags. Defer unless the lawyer asks, since it's a legal-defensibility feature most solo practitioners don't articulate until audited.
- **Retire-Tiptap conflicts with any in-app editor idea:** The two are mutually exclusive within v1.2.

---

## MVP Definition

### Launch With (v1.2 — must-have)

- [ ] **.docx upload + name + mandatory category (STK / Mahkeme / Genel)** — foundation of the whole pipeline
- [ ] **Auto-extract `{{ var }}` + `{%p %}` placeholders on upload, persist on `sablon`** — makes templates legible to the app
- [ ] **Variable registry + extracted-vs-known diff + unknown-var flag on template detail** — catches bad templates before first generation
- [ ] **One-click "Üret" button in Belgeler tab, binds dosya context, renders PDF** — the product thesis
- [ ] **docxtpl + Jinja2 conditionals/loops fully supported** — real dilekçeler need them
- [ ] **TR filters: `tr_currency`, `tarih` (dd.MM.yyyy), `upper_tr`, `lower_tr`** — non-negotiable for Turkish legal text
- [ ] **Deterministic filename `{müvekkil-slug}-{plaka-slug}-{seq}.pdf`, skip plaka segment when missing, auto-seq per dosya** — archive legibility
- [ ] **Auto-archive `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` + auto-register in `belge` table, transactional** — two retrieval paths stay in sync
- [ ] **LibreOffice + Python install-check + global banner when misconfigured** — prevents silent failures
- [ ] **Turkish-language error surfacing (missing var, unknown var, sidecar timeout, LO crash, docxtpl render error)** — trust
- [ ] **Variable cheat-sheet page (auto-generated from registry, under Ayarlar > Yardım or Şablon detail)** — template authoring unblocked
- [ ] **Missing-variable client-side pre-check with deep-link to owning tab** — promote from differentiator to table stakes; tiny code, huge UX
- [ ] **Retire Tiptap editor + .odt upload code / UI / tables / filesystem content (user-confirmed, no export)** — the reason v1.2 exists

### Add After Validation (v1.3 — measurable-win differentiators)

- [ ] **Dry-run / preview binding (JSON or table view of resolved context)** — add when lawyer reports "I generated 3 ihtarnames with wrong data before catching it"
- [ ] **Named quick-action buttons + `is_default_for_action` flag on sablon** — add when dropdown picker grows past ~10 templates
- [ ] **Template-to-dosya generation history view** — add once 50+ generated PDFs accumulate and "did I already send X?" becomes real
- [ ] **Fuzzy-match / typo autocomplete on upload** — add with the first "why doesn't my template work" support question

### Future Consideration (v2+ — defer until product-market fit is established)

- [ ] **Multi-template batch generation** — nice workflow speed-up, but only after the single-template path is proven
- [ ] **Deterministic / reproducible PDF output (pinned LO + stripped metadata)** — legal-defensibility; defer until user requests or audit requirement arrives
- [ ] **Single-step "önceki sürüm" backup on template upload** — only if lawyer hits wrong-upload often enough to complain
- [ ] **DOCX alongside PDF as downloadable artifact** — only on explicit user request; adds storage cost
- [ ] **E-imza / KEP / UYAP submission** — separate project; out of scope under current Core Value

Anything marked *anti-feature* stays permanently out-of-scope unless Core Value shifts.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| .docx upload + category | HIGH | LOW | **P1** |
| Placeholder auto-extraction | HIGH | LOW | **P1** |
| Variable registry + unknown-var flag | HIGH | LOW | **P1** |
| One-click generate from Belgeler | HIGH | MEDIUM | **P1** |
| Jinja2 conditionals/loops (via docxtpl native) | HIGH | LOW (library-provided) | **P1** |
| TR filters (tr_currency, tarih, upper/lower_tr) | HIGH | LOW | **P1** |
| Deterministic filename + auto-seq | MEDIUM | LOW | **P1** |
| Auto-archive + belge register (transactional) | HIGH | LOW | **P1** |
| LibreOffice + Python install-check banner | MEDIUM | LOW | **P1** |
| TR error surfacing | HIGH | MEDIUM | **P1** |
| Variable cheat-sheet static page | MEDIUM | LOW | **P1** |
| Missing-var client pre-check + deep-link | HIGH | LOW | **P1** |
| Retire Tiptap + .odt code paths | HIGH (cleanliness) | MEDIUM | **P1** |
| Dry-run / preview binding | MEDIUM | MEDIUM | **P2** |
| Named quick-action buttons | MEDIUM | MEDIUM | **P2** |
| Template-to-dosya history view | MEDIUM | LOW | **P2** |
| Fuzzy-match typo autocomplete | LOW | MEDIUM | **P2** |
| Multi-template batch | MEDIUM | MEDIUM | **P3** |
| Deterministic / reproducible PDF export | LOW | MEDIUM | **P3** |
| Single-step "önceki sürüm" backup | LOW | LOW | **P3** |
| Template versioning / diff / rollback | LOW | HIGH | **anti-feature** |
| In-app WYSIWYG editor | NEG | HIGH | **anti-feature** |
| LLM / AI-generated text | NEG | HIGH | **anti-feature** |
| E-imza / KEP / UYAP integration | MEDIUM | VERY HIGH | **anti-feature (v1.2)** |
| Live in-browser DOCX preview | LOW | HIGH | **anti-feature** |
| Conditional-logic GUI builder | LOW | VERY HIGH | **anti-feature** |
| In-app variable entry form | NEG | MEDIUM | **anti-feature** |
| External legal-corpus variables | LOW | HIGH | **anti-feature** |
| Multi-format canonical output | LOW | MEDIUM | **anti-feature** |
| Tiptap / .odt data export pre-cleanup | LOW | MEDIUM | **anti-feature** |

**Priority key:**
- **P1** = must have for v1.2 launch
- **P2** = v1.3, add when v1.2 feedback points there
- **P3** = v2+, only if product-market fit sustains and demand materialises
- **anti-feature** = permanently out of scope under current Core Value

---

## Competitor Feature Analysis

| Feature | HotDocs / Woodpecker (enterprise) | Clio Draft / Lawyaw (SaaS) | Turkish market (UYAP modules / Hukuk Partner / custom) | Our Approach |
|---------|-----------------------------------|----------------------------|--------------------------------------------------------|--------------|
| Template format | Proprietary (.hdt) + Word merge | Word + Clio merge syntax | Mostly .docx with manual `[MÜVEKKİL]` tokens; some .odt | **.docx + `{{ jinja }}` via docxtpl** — standard, authored in Word, no proprietary editor |
| Variable catalog | Declared in template + external schema | Bound to matter schema | Often free-text, no catalog | **Hardcoded registry mirroring dosya tabs; flag unknowns** — strict contract, predictable |
| Conditional logic | Full expression language + GUI builder | Limited merge-field conditions | Typically none; manual per-case edit | **Full Jinja2 via docxtpl** — power users welcome, cheat-sheet for the rest |
| Preview before render | Live DOCX preview + dry-run | Form-fill then Word render | Often none; generate and hope | **PDF rendered and shown in iframe; optional dry-run JSON in v1.3** — avoids DOCX-render bug surface |
| Output format | DOCX + PDF + others | DOCX + PDF | DOCX or PDF, rarely both | **PDF canonical; DOCX not persisted** — single source of truth |
| Archive / matter linkage | First-class "documents for matter X" | Auto-attach to matter | Manual upload back | **Auto-register in `belge` keyed by `dosya_id` + `sablon_id`** — seamless |
| Versioning | Full semantic versioning | Some | None typical | **None — overwrite on re-upload; rely on external file history** — scope discipline |
| Signing | Integrated (DocuSign etc.) | Integrated | KEP / e-imza in some tools | **Not in v1.2** — out of scope |
| AI / LLM drafting | Added 2024–25 | Added 2024–25 | Rare | **Explicitly excluded** — offline-first + PII privacy |
| Localisation (Turkish) | Generic i18n | Generic i18n | Native | **Native + custom TR filters + TR error messages** — table stakes here, differentiator vs generic SaaS |

**Why this minimal scope still wins for the solo-lawyer-insurance-disputes use case:**
- Single user, single machine, offline → enterprise collaboration features are dead weight.
- Narrow domain (STK + Asliye Ticaret/Hukuk + ihtarname / dilekçe / vekâletname) → a small variable registry covers ~90% of realistic templates.
- `.docx` + Word as the authoring surface beats any in-app editor on typography, table control, and Turkish character rendering — and it's free.

---

## Implications for Requirements (v1.2)

Mapping the buckets above into the categories the Requirements phase will consume:

**Must-have (P1) — in v1.2 milestone scope:**
- Upload surface (name + category + .docx validation)
- Extraction + registry + unknown flag
- Rendering pipeline (sidecar + docxtpl + TR filters + LO → PDF)
- One-click generate + missing-var pre-check + deep-link
- Filename + seq + archive + `belge` auto-register (transactional)
- Install-check banner + TR error surfacing
- Variable cheat-sheet page
- Cleanup of retired Tiptap + .odt systems

**Should-have (P2) — v1.3 unless effort is trivial:**
- Preview-before-generate (dry-run binding)
- Named quick-action buttons + default-per-action flag
- Template-to-dosya generation history view
- Fuzzy-match typo autocomplete on upload

**Explicitly out-of-scope (anti-features / v2+):**
- In-app editors (of any kind), cloud sync, AI drafting, e-imza, multi-format canonical output, versioning/diff, external legal-corpus variables, Tiptap/.odt data export.

**Cross-cutting dependencies for phase ordering:**
1. Variable registry ships *before* extraction UI (everything else matches against it).
2. Extraction + registry ship *before* generate (generate needs them to pre-check).
3. Generate ships *before* archive (archive is generate's output side).
4. Archive ships *with* belge-auto-register (they must be transactional).
5. Retirement of Tiptap/.odt happens *last*, after the new pipeline is proven end-to-end, to avoid leaving the user without a working document path mid-milestone.

---

## Sources

- **PROJECT.md (validated):** existing feature inventory, Core Value, Out of Scope, v1.2 milestone target features.
- **Milestone brief (validated):** explicit feature list; stack decisions (Python sidecar, docxtpl, Jinja2, Babel, python-slugify, structlog, tenacity, LibreOffice); archive path; filename scheme; categories.
- **Domain familiarity (unverified at runtime):** general feature envelope of legal-document-automation category — HotDocs, Woodpecker, Clio Draft, Lawyaw, Gavel/Documate, Turkish practice-management products. External WebSearch and Brave Search tools were not available for this run; feature categorisation should be re-validated against live competitor scans before any high-stakes ordering decision.
- **Not independently verified this run:** specific feature sets of current (April 2026) competitor versions; a live Turkish-market dilekçe-automation survey; Context7 docs for `docxtpl` / `python-docx` (not reachable).

### Confidence by Section

| Section | Confidence | Reason |
|---------|------------|--------|
| Table Stakes | **HIGH** | Scoped directly by the milestone brief; every item maps to a listed feature or a derived no-regret UX necessity |
| Differentiators | **MEDIUM** | Reasoned from UX principles + docxtpl capability; each item is concretely small and testable, but competitor benchmark not live-verified |
| Anti-Features | **HIGH** | Grounded in PROJECT.md Out of Scope + the explicit intent of the milestone (retire Tiptap, retire .odt) |
| Dependencies | **HIGH** | Mechanical from the pipeline architecture (upload → extract → bind → render → archive → register) |
| MVP bucketing | **HIGH** | Mirrors the milestone brief with conservative P2/P3 cuts |
| Competitor comparison | **LOW–MEDIUM** | External search blocked; based on pre-cutoff familiarity; flag for verification if used to defend a specific feature decision |

---

*Feature research for: Sigorta Uyuşmazlık Takip v1.2 — Şablon Belgeler (legal document automation / dilekçe pipeline)*
*Researched: 2026-04-20*
