---
slug: takvim-gun-yanlis
status: resolved
trigger: "takvim sayfasında bulunan takvimde günler yanlış her ayın 1 i pazartesi 30 u salı 31 i çarşamba"
created: 2026-04-17
updated: 2026-04-17
---

## Symptoms

- expected: Takvim günleri gerçek haftanın gününe göre doğru hizalanmalı
- actual: Her ayın 1'i Pazartesi, 30'u Salı, 31'i Çarşamba olarak sabit gösteriliyor
- errors: none
- timeline: unknown
- reproduction: Takvim sayfasını aç, herhangi bir ayı görüntüle

## Current Focus

- hypothesis: "Calendar grid had no leading empty cells — daysInMonth rendered directly into grid-cols-7 with no offset, so every month started at column 1 (Monday)."
- test: "Added startOffset = (getDay(monthStart) + 6) % 7 empty placeholder divs before daysInMonth."
- expecting: "April 2026 day 1 now appears in Wednesday column (offset=2). All months align correctly."
- next_action: "Resolved — fix verified by human"
- reasoning_checkpoint: |
    hypothesis: "No leading empty cells in grid-cols-7 causes every month to start at column 1 (Monday)"
    confirming_evidence:
      - "weekDays array starts with Pzt (Monday) — Monday-first intent confirmed"
      - "grid-cols-7 with no offset cells: day[0] always lands in column 1"
      - "April 1 2026 getDay()=3 (Wed) → Monday-first offset=2 → 2 empty cells needed"
      - "Symptom exactly matches: 0 offset makes 1st=Mon, 30th=Tue, 31st=Wed"
    falsification_test: "If offset cells are added and days still misalign, the weekDays header order would be wrong — but Pzt/Sal/Çar matches Mon/Tue/Wed so header is correct"
    fix_rationale: "Prepending (getDay(monthStart) + 6) % 7 empty divs shifts all day cells to their correct CSS grid column"
    blind_spots: "None — entirely client-side, no external calendar library, no locale affecting getDay()"

## Evidence

- timestamp: 2026-04-17T00:00:00Z
  checked: components/calendar/calendar-view.tsx — grid render loop
  found: "daysInMonth.map(...) renders directly into grid-cols-7 with zero leading cells. No startOffset calculation exists."
  implication: "Every month's day 1 lands in CSS grid column 1 = Monday (Pzt), regardless of actual weekday"

- timestamp: 2026-04-17T00:00:00Z
  checked: "node -e getDay(new Date(2026,3,1))"
  found: "April 1 2026 getDay()=3 (Wednesday). Monday-first offset=(3+6)%7=2. Calendar shows it as Monday (0 offset). Bug confirmed."
  implication: "Fix is to prepend 2 empty cells for April. Formula: (getDay(monthStart) + 6) % 7"

- timestamp: 2026-04-17T00:00:00Z
  checked: "Applied fix to components/calendar/calendar-view.tsx"
  found: "Added getDay import from date-fns. Added startOffset = (getDay(monthStart) + 6) % 7. Prepended Array.from({ length: startOffset }) empty divs before daysInMonth in grid."
  implication: "Each month now starts in the correct weekday column."

## Eliminated

## Resolution

- root_cause: "Calendar grid (grid-cols-7, Monday-first) rendered daysInMonth directly with no leading empty placeholder cells. Every month's 1st day therefore landed in column 1 (Monday), making all days appear shifted to incorrect weekdays."
- fix: "Added startOffset = (getDay(monthStart) + 6) % 7 and prepended that many empty <div> cells before daysInMonth in the grid render. Also imported getDay from date-fns."
- verification: "Human confirmed fix works — calendar days now align correctly"
- files_changed: ["components/calendar/calendar-view.tsx"]
