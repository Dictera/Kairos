# Phase 9: Takvim Görünümleri Standardization - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize all calendar/date-picker UI components across the project to match the reference implementation in dosyalar/dosya detayı/yargılama süreci. Apply Turkish locale settings, Monday-week-start, and Navy + Turuncu color palette to all calendar components.

Out of scope:
- Takvim page (/takvim) — Phase 5 owns this
- Dashboard widgets (Yaklaşan Süreler, Bugünkü Duruşmalar) — leave as-is

</domain>

<decisions>
## Implementation Decisions

### Date Picker Standardization
- **D-01:** SureList deadline form → DatePickerField — Replace `<Input type="date">` with Popover+Calendar DatePickerField component in sure-list.tsx (both create form and edit form)

### Turkish Locale Configuration
- **D-02:** All date displays use `dd.MM.yyyy` format with Turkish locale (`date-fns/locale/tr`) — already implemented in existing DatePickerField, must be preserved in SureList update
- **D-03:** Calendar week starts on Monday — Set `startWeekOn={1}` prop on all Calendar components (Turkish locale standard)

### Color Palette Application
- **D-04:** Calendar component styled with Navy + Turuncu palette (from Phase 8):
  - Selected day highlight: turuncu (`#FA991C`)
  - Primary button/state: turuncu tones
  - Today indicator: Navy or turuncu accent
  - Match existing DatePickerField button styling in yargılama süreci forms

### Scope Exclusions (confirmed with user)
- **D-05:** Takvim page (/takvim) — not part of Phase 9; Phase 5 implements the full monthly calendar page
- **D-06:** Dashboard widgets (Yaklaşan Süreler, Bugünkü Duruşmalar) — not part of Phase 9; remain as list-based widgets

### Agent's Discretion
- Exact CSS/customization approach for calendar color styling
- Calendar navigation button styling specifics
- How to handle disabled dates visually

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 8 Theme Decisions
- `.planning/phases/08-ui-yenileme-renk-paleti-degisikligi-ve-shadcn-ui-bilesenleri/08-CONTEXT.md` — Navy + Turuncu palette D-01 through D-06

### Reference Implementation (Yargılama Süreci)
- `components/dosya/stk-data-form.tsx` — DatePickerField reference implementation
- `components/dosya/mahkeme-data-form.tsx` — DatePickerField reference implementation
- `components/dosya/durusma-dialog.tsx` — DatePickerField reference implementation
- `components/ui/calendar.tsx` — Base calendar component to be customized

### Phase 4 Requirements (Date Handling)
- `.planning/REQUIREMENTS.md` §Süre (Deadline) Takibi — SURE-01 through SURE-05
- `.planning/phases/04-deadline-engine-dashboard/04-CONTEXT.md` — deadline display format

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/calendar.tsx` — shadcn Calendar from react-day-picker; base component to be customized with Turkish locale and color palette
- `components/dosya/stk-data-form.tsx` DatePickerField — the reference implementation (Popover + Calendar + locale=tr + captionLayout="label")
- `components/dosya/sure-list.tsx` — needs DatePickerField update in both create and edit forms

### Established Patterns
- DatePickerField: Button variant="outline" + CalendarIcon + Popover + Calendar mode="single"
- Turkish date format: `format(date, 'dd.MM.yyyy', { locale: tr })`
- Calendar locale: `tr` from date-fns/locale/tr

### Integration Points
- `components/dosya/sure-list.tsx` — update inline create form and edit dialog form date inputs
- `components/ui/calendar.tsx` — add startWeekOn prop and color customization

</code_context>

<specifics>
## Specific Ideas

- "bütün datepickerlar türk formatında olmalı ve haftanın ilk günü pazartesi olmalı" — all date pickers must use Turkish format with Monday as first day of week
- "renk paletleri de yargılama sürecinde olduğu gibi projeye uygun olsun" — color palettes should match the yargılama süreci implementation, appropriate for the project
- "hiç bir değişiklik yapılmamış base date picker kullanılmasın" — no base/unmodified date picker should be used; all must be customized DatePickerField

</specifics>

<deferred>
## Deferred Ideas

- Takvim page monthly calendar implementation — Phase 5
- Dashboard widget redesign to calendar-based — future phase
- Adli tatil automatic date extension — Phase 7 deferred to v2

---

*Phase: 09-projedeki-b-t-n-takvim-g-r-n-mlerinin-dosyalar-dosya-detay-y*
*Context gathered: 2026-04-13*
