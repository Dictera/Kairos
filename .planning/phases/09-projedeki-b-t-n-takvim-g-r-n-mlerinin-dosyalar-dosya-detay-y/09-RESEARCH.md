# Phase 9: Takvim Görünümleri Standardization - Research

**Researched:** 2026-04-13
**Domain:** react-day-picker v9 calendar customization + Turkish locale
**Confidence:** HIGH

## Summary

Phase 9 standardizes calendar/date-picker components across the project to use Turkish locale (Monday week start, `dd.MM.yyyy` format) with the Navy + Turuncu color palette. The primary implementation work involves: (1) extracting the duplicated `DatePickerField` component to a shared location, (2) adding `weekStartsOn={1}` prop to Calendar components, (3) applying Turuncu (`#FA991C`) color to selected days, (4) replacing `<Input type="date">` in sure-list.tsx with DatePickerField, and (5) replacing `<Input type="date">` in dosya-list.tsx filter inputs with DatePickerField.

**Critical finding:** Context document D-03 says `startWeekOn={1}` but react-day-picker v9 API uses `weekStartsOn={1}` (0=Sunday through 6=Saturday). This must be corrected in implementation.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace `<Input type="date">` with Popover+Calendar DatePickerField in sure-list.tsx (both create form and edit dialog) and dosya-list.tsx (filter date inputs)
- **D-02:** All dates use `dd.MM.yyyy` format with Turkish locale (`date-fns/locale/tr`)
- **D-03:** Calendar week starts on Monday — set `weekStartsOn={1}` on all Calendar components
- **D-04:** Calendar styled with Navy + Turuncu palette: selected day highlight `#FA991C` turuncu
- **D-05:** Takvim page (/takvim) excluded — Phase 5 owns this
- **D-06:** Dashboard widgets excluded — leave as-is

### the agent's Discretion
- Exact CSS/customization approach for calendar color styling
- Calendar navigation button styling specifics
- How to handle disabled dates visually

### Deferred Ideas (OUT OF SCOPE)
- Takvim page monthly calendar implementation — Phase 5
- Dashboard widget redesign to calendar-based — future phase
- Adli tatil automatic date extension — Phase 7 deferred to v2

## Phase Requirements

> No specific requirement IDs for this phase — it standardizes existing UI patterns.

## Standard Stack

### Core Libraries (Already Installed)
| Library | Version | Purpose |
|---------|---------|---------|
| react-day-picker | 9.14.0 | Calendar/CalendarDayButton base component |
| date-fns | 4.1.0 | Date parsing, formatting, locale |
| date-fns/locale/tr | (from date-fns) | Turkish locale for date formatting |
| @radix-ui/popover | via radix-ui | Popover container for DatePickerField |

### Supporting Components (Already Available)
| Component | Source | Purpose |
|-----------|--------|---------|
| Popover | components/ui/popover.tsx | Date picker container |
| Calendar | components/ui/calendar.tsx | Base calendar (wraps react-day-picker DayPicker) |
| Button | components/ui/button.tsx | Trigger button for date picker |
| CalendarIcon | lucide-react | Calendar icon in trigger button |

**Verification:** `npm view react-day-picker version` → 9.14.0 ✓

## Architecture Patterns

### 1. DatePickerField (Reference Implementation)
Each form has an inline `DatePickerField` function — pattern is identical across all three reference files:

```tsx
// Pattern from stk-data-form.tsx, mahkeme-data-form.tsx, durusma-dialog.tsx
function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string | null | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
}) {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          {date ? format(date, 'dd.MM.yyyy', { locale: tr }) : placeholder ?? 'Tarih seçin'}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : undefined)}
          locale={tr}
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  )
}
```

**Problem:** This component is duplicated in 3 files with 100% identical code. Should be extracted to `components/ui/date-picker.tsx`.

### 2. Calendar Component Customization (components/ui/calendar.tsx)
The Calendar wraps `DayPicker` from react-day-picker v9 and customizes via:
- `classNames` prop for styling individual elements
- `components` prop for customizing child components (DayButton → CalendarDayButton)
- `data-*` attributes for CSS targeting (`data-selected-single`, `data-range-start`, etc.)

### 3. Color Styling Pattern
Selected day styling uses the `data-selected-single` attribute:
```tsx
// CalendarDayButton in calendar.tsx
data-selected-single={
  modifiers.selected &&
  !modifiers.range_start &&
  !modifiers.range_end &&
  !modifiers.range_middle
}
```

CSS targeting:
```css
/* Example — selected day with Turuncu */
[data-selected-single=true] {
  background-color: var(--primary); /* #FA991C */
  color: var(--primary-foreground);
}
```

## Recommended Project Structure

```
components/ui/
├── calendar.tsx          # Base Calendar (already exists)
├── date-picker.tsx       # NEW: Shared DatePickerField component
└── popover.tsx           # Already exists

components/dosya/
├── stk-data-form.tsx     # Uses DatePickerField (import from ui/)
├── mahkeme-data-form.tsx  # Uses DatePickerField (import from ui/)
├── durusma-dialog.tsx     # Uses DatePickerField (import from ui/)
├── sure-list.tsx         # D-01: Replace Input type="date" with DatePickerField
└── dosya-list.tsx        # D-01: Replace Input type="date" filter inputs with DatePickerField
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|------------|
| Turkish date formatting | Custom format strings | `format(date, 'dd.MM.yyyy', { locale: tr })` from date-fns |
| Week start configuration | Hardcode day index calculations | `weekStartsOn={1}` prop on Calendar |
| Locale month/day names | Custom translation arrays | `locale={tr}` from `date-fns/locale/tr` |
| Calendar color theming | Inline style attributes | CSS custom properties + `classNames` prop |

## Common Pitfalls

### Pitfall 1: Wrong Prop Name — `startWeekOn` vs `weekStartsOn`
**What goes wrong:** Calendar renders with Sunday as first day (default) despite D-03 requirement.

**Root cause:** Context document says `startWeekOn={1}` but react-day-picker v9 API uses `weekStartsOn={1}`.

**How to avoid:** Use `weekStartsOn={1}` — verified in react-day-picker v9.14.0 type definitions at `node_modules/react-day-picker/dist/esm/types/props.d.ts:448`.

**Warning signs:** Weekdays show as "Sun, Mon, Tue..." instead of "Pzt, Sal, Çar..." or first day is Sunday.

### Pitfall 2: Duplicate DatePickerField Code
**What goes wrong:** Same 30-line component copied in 3+ files; changes require updating all copies.

**Root cause:** No shared component created during initial implementation.

**How to avoid:** Extract to `components/ui/date-picker.tsx` before making changes.

### Pitfall 3: Color Customization via Inline Styles
**What goes wrong:** Inline styles on Calendar elements don't respond to dark mode or theme changes.

**How to avoid:** Use CSS custom properties (`--primary`, etc.) and `classNames` prop with Tailwind classes.

### Pitfall 4: Missing `startWeekOn` When Locale Already Sets It
**What goes wrong:** Turkish locale `tr` from date-fns/locale/tr has `weekStartsOn: 1` internally, but react-day-picker doesn't automatically use the locale's week start.

**How to avoid:** Explicitly pass `weekStartsOn={1}` even when using Turkish locale.

## Code Examples

### Extracting Shared DatePickerField
```tsx
// components/ui/date-picker.tsx
'use client'

import { parseISO, format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string | null | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
}) {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {date ? format(date, 'dd.MM.yyyy', { locale: tr }) : placeholder ?? 'Tarih seçin'}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : undefined)}
          locale={tr}
          weekStartsOn={1}
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Updating Calendar with Turuncu Selected Day
```tsx
// In Calendar component or via classNames prop
<Calendar
  mode="single"
  selected={date}
  onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : undefined)}
  locale={tr}
  weekStartsOn={1}
  classNames={{
    day: cn(
      "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
      "[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
      // ...existing day styles
    ),
  }}
  // CalendarDayButton will receive data-selected-single=true
/>
```

### SureList Update (D-01)
```tsx
// In sure-list.tsx inline create form
<FormField
  control={form.control}
  name="son_tarih"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Son Tarih</FormLabel>
      <FormControl>
        {/* Before: <Input type="date" {...field} /> */}
        <DatePickerField
          value={field.value}
          onChange={field.onChange}
          placeholder="Son tarih seçin"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### DosyaList Filter Date Inputs (D-01 - Expanded Scope)
```tsx
// In dosya-list.tsx filter section
// These are controlled inputs with direct state management (no react-hook-form)
// State: const [tarihBaslangic, setTarihBaslangic] = useState('')

<div className="space-y-1">
  <label className="text-sm font-semibold text-muted-foreground">Başlangıç</label>
  {/* Before: <Input type="date" className="w-[160px]" value={tarihBaslangic} onChange={(e) => {...} /> */}
  <DatePickerField
    value={tarihBaslangic}
    onChange={(val) => { setTarihBaslangic(val || ''); setPage(1) }}
    placeholder="Başlangıç tarihi"
  />
</div>

<div className="space-y-1">
  <label className="text-sm font-semibold text-muted-foreground">Bitiş</label>
  {/* Before: <Input type="date" className="w-[160px]" value={tarihBitis} onChange={(e) => {...} /> */}
  <DatePickerField
    value={tarihBitis}
    onChange={(val) => { setTarihBitis(val || ''); setPage(1) }}
    placeholder="Bitiş tarihi"
  />
</div>
```

**Note:** The existing DatePickerField pattern works directly for dosya-list.tsx because:
- It accepts `value` and `onChange` props matching the component's state signature
- It does not require react-hook-form integration
- State updates (setting `tarihBaslangic`/`tarihBitis` + resetting page) can be done in the `onChange` handler

## State of the Art

| Aspect | Current State | Required Change |
|--------|---------------|----------------|
| DatePickerField location | Duplicated in 3 form files | Extract to `components/ui/date-picker.tsx` |
| Week start prop | Missing | Add `weekStartsOn={1}` to all Calendar usages |
| Selected day color | Uses default (primary) | Confirm `--primary` is Turuncu (`oklch(0.746 0.174 57)`) |
| SureList date inputs | `<Input type="date">` | Replace with DatePickerField |
| DosyaList filter dates | `<Input type="date">` | Replace with DatePickerField |

**CSS Variable `--primary`:** Already set to `oklch(0.746 0.174 57)` in `app/globals.css` which corresponds to Turuncu `#FA991C`. ✓

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `weekStartsOn={1}` is the correct prop name | Common Pitfalls | Week start will be Sunday instead of Monday |
| A2 | `--primary` CSS variable is correctly set to Turuncu | Code Examples | Selected day color won't match design |

**Verification for A1:** Confirmed in `node_modules/react-day-picker/dist/esm/types/props.d.ts:448` — `weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined`

**Verification for A2:** Confirmed in `app/globals.css:25` — `--primary: oklch(0.746 0.174 57)` which is Turuncu

## Open Questions

1. **Should DatePickerField support `mode="range"` for future use?**
   - Current reference implementations all use `mode="single"`
   - Phase 5 (Takvim) might need range selection
   - **Recommendation:** Keep `mode="single"` for now; design for extensibility if needed later

## Environment Availability

**Step 2.6: SKIPPED** — No external dependencies identified. Phase involves only existing in-project components (react-day-picker, date-fns, shadcn/ui).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed: vitest 4.1.4) |
| Config file | vitest.config.ts (if exists) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Behavior | Test Type | Test File |
|-----------|-----------|-----------|
| DatePickerField renders with Turkish date format | unit | `tests/components/date-picker.test.tsx` (to be created) |
| Calendar shows Monday as first day | unit | `tests/components/calendar.test.tsx` (to be created) |
| SureList uses DatePickerField not Input type="date" | smoke | Visual verification in browser |
| DosyaList filter inputs use DatePickerField | smoke | Visual verification in browser |

### Wave 0 Gaps
- [ ] `tests/components/date-picker.test.tsx` — DatePickerField Turkish locale and format
- [ ] `tests/components/calendar.test.tsx` — Calendar weekStartsOn=1
- [ ] Framework: Vitest already installed

## Security Domain

**Security enforcement:** Disabled for this phase (UI standardization only — no security-relevant changes).

No authentication, authorization, input validation, or cryptographic operations involved in this phase.

## Sources

### Primary (HIGH confidence)
- `components/ui/calendar.tsx` — Base calendar implementation with CalendarDayButton
- `components/dosya/stk-data-form.tsx` — DatePickerField reference (lines 45-78)
- `node_modules/react-day-picker/dist/esm/types/props.d.ts` — `weekStartsOn` prop type definition
- `app/globals.css` — CSS variable definitions (--primary, --sidebar, etc.)
- Phase 8 Context (`.planning/phases/08-.../08-CONTEXT.md`) — Navy + Turuncu palette decisions

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Confirms `weekStartsOn={1}` usage

### Tertiary (LOW confidence)
- None — all claims verified from primary sources

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all libraries already installed and verified
- Architecture: HIGH — patterns clearly visible in reference implementations
- Pitfalls: HIGH — prop name verified in type definitions

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days for stable domain)
