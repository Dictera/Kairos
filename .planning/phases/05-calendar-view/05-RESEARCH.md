# Phase 5: Calendar View - Research

**Researched:** 2026-04-13
**Domain:** Monthly calendar view with event markers and navigation
**Confidence:** HIGH

## Summary

Phase 5 implements a monthly calendar view showing all hearings (duruşma) and deadlines (süre) from the database. The calendar uses react-day-picker v9.14.0 as its base (already customized in Phase 9 with Turkish locale and Navy+Turuncu palette). The key challenge is displaying event indicators per day and implementing a popover with clickable links to case detail pages.

**Primary recommendation:** Build a custom `DayButton` component that renders inline badge counts (e.g., "3 süre, 2 duruşma") per day cell. Use a controlled `month` state with `onMonthChange` to fetch data per visible month. Use `Popover` from shadcn/ui for the event detail popover on day click.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Inline badge counts per day — "3 süre, 2 duruşma" format
- **D-02:** Prev/next month buttons + `captionLayout="dropdown"` for direct month jump
- **D-03:** Event popover content: type badge + dosya no + müvekkit adı + (duruşma ise saat)
- **D-04:** Chronological order: süre (deadlines) first, then duruşma (hearings)
- **D-05:** Empty day behavior: no popover, silent ignore
- **D-06:** Query strategy: fetch only visible month data (startOfMonth → endOfMonth)
- **D-07:** Empty month: normal calendar grid, no special empty state
- **D-08:** Turkish locale (`dd.MM.yyyy` format, Pazartesi hafta başı, `date-fns/locale/tr`)
- **D-09:** Navy + Turuncu color palette from Phase 8/9

### the agent's Discretion

- Exact popover styling and animation
- How to handle very long event lists (overflow strategy)
- Event dot colors: 🔴 süre, 🔵 duruşma (confirmed in specifics)

### Deferred Ideas

- Adding events directly from calendar — Phase 3/4 scope
- Dashboard widget redesign — future phase
- Weekly/daily views — monthly only

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TAKVIM-01 | Aylık takvim görünümü — duruşma ve süre tarihleri işaretli | react-day-picker v9 custom DayButton with badge counts per day |
| TAKVIM-02 | Takvimden duruşma detayına tıklanabilir bağlantı | Popover with clickable links to `/dosyalar/${dosya_id}` |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | 9.14.0 | Monthly calendar grid | Already customized with Turkish locale in Phase 9 |
| date-fns | 4.1.0 | Date manipulation and Turkish formatting | Project standard |
| date-fns/locale/tr | (from date-fns) | Turkish locale | Already in use across project |
| @tanstack/react-query | 5.97.0 | Client-side data fetching | Project standard |
| @trpc/tanstack-react-query | 11.16.0 | tRPC integration | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Popover (radix-ui) | via shadcn/ui | Event detail popover | Day click with events |
| Badge (shadcn/ui) | via shadcn/ui | Type indicators (süre/duruşma) | Event popover content |
| Card (shadcn/ui) | via shadcn/ui | Page layout wrapper | Calendar container |

**Installation:** No new packages needed — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
lib/trpc/routers/
├── calendar.ts          # NEW: calendar queries (month data)
└── _app.ts              # Add calendar router

app/(dashboard)/
└── takvim/
    └── page.tsx         # MODIFY: full calendar page

components/calendar/
├── calendar-view.tsx    # NEW: main calendar component with data
├── calendar-day-cell.tsx # NEW: custom DayButton with badge counts
└── calendar-event-popover.tsx # NEW: popover content component
```

### Pattern 1: Controlled Month with Data Fetching

**What:** Use `month` + `onMonthChange` controlled props to fetch data per visible month.

**When to use:** Calendar requires server data that changes with month navigation.

**Example:**
```typescript
// Source: https://daypicker.dev/docs/navigation (adapted)
const [month, setMonth] = useState(new Date())

const { data } = useQuery(
  trpc.calendar.getMonthEvents.queryOptions({ 
    year: month.getFullYear(), 
    month: month.getMonth() + 1 
  })
)

<Calendar 
  month={month} 
  onMonthChange={setMonth}
  // ...
/>
```

### Pattern 2: Custom DayButton with Event Counts

**What:** Override the `DayButton` component to render inline badge counts per day cell.

**When to use:** Need to show multiple events per day without opening popover.

**Example:**
```typescript
// Source: https://daypicker.dev/guides/custom-components (adapted)
function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: DayButtonProps & { locale?: Partial<Locale> }) {
  const eventsForDay = getEventsForDate(day.date) // from props/context
  
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("relative flex flex-col gap-1", className)}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {eventsForDay.sureCount > 0 && (
        <span className="text-[10px] text-red-500">{eventsForDay.sureCount} süre</span>
      )}
      {eventsForDay.durusmaCount > 0 && (
        <span className="text-[10px] text-blue-500">{eventsForDay.durusmaCount} duruşma</span>
      )}
    </Button>
  )
}
```

### Pattern 3: Popover on Day Click

**What:** Use `onDayClick` handler with a controlled `selectedDay` state to open a Popover.

**When to use:** User clicks a day to see event details.

**Example:**
```typescript
// Source: https://daypicker.dev/guides/custom-components (adapted)
const [selectedDay, setSelectedDay] = useState<Date | null>(null)
const [popoverOpen, setPopoverOpen] = useState(false)

const handleDayClick = (day: Date, modifiers: Modifiers) => {
  const events = getEventsForDate(day)
  if (events.length === 0) return // D-05: silent ignore
  setSelectedDay(day)
  setPopoverOpen(true)
}

<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
  <PopoverTrigger asChild>
    <div> {/* Calendar trigger area */} </div>
  </PopoverTrigger>
  <PopoverContent>
    {/* Event list with links */}
  </PopoverContent>
</Popover>
```

### Pattern 4: Calendar Router Query

**What:** tRPC procedure that fetches all events for a given month range.

**When to use:** Data fetching for the calendar view.

**Example:**
```typescript
// Source: dashboard.ts patterns adapted
getMonthEvents: protectedProcedure
  .input(z.object({ 
    year: z.number(), 
    month: z.number() // 1-12
  }))
  .query(async ({ input }) => {
    const startDate = `${input.year}-${String(input.month).padStart(2, '0')}-01`
    const endDate = format(endOfMonth(new Date(input.year, input.month - 1)), 'yyyy-MM-dd')
    
    const [sures, durusmalar] = await Promise.all([
      db.select({ ... }).from(sure)
        .innerJoin(dosya, eq(sure.dosya_id, dosya.id))
        .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
        .where(and(gte(sure.son_tarih, startDate), lte(sure.son_tarih, endDate)))
        .orderBy(sure.son_tarih),
      db.select({ ... }).from(durusma)
        .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
        .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
        .where(and(gte(durusma.tarih, startDate), lte(durusma.tarih, endDate)))
        .orderBy(durusma.tarih, durusma.saat),
    ])
    
    return { sures, durusmalar }
  })
```

### Pattern 5: Turkish Locale Configuration

**What:** Set `locale={tr}` and `startWeekOn={1}` for Turkish calendar.

**When to use:** Every Calendar component in the project.

**Source:** [VERIFIED: Phase 9 context confirms `date-fns/locale/tr` + `startWeekOn={1}` pattern]

```typescript
import { tr } from 'date-fns/locale/tr'

<Calendar
  locale={tr}
  startWeekOn={1}
  captionLayout="dropdown"
  // ...
/>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid rendering | Custom table-based calendar | react-day-picker DayPicker | Accessibility, keyboard navigation, animate transitions already built |
| Month navigation logic | Custom prev/next handlers | `month` + `onMonthChange` controlled props | Built-in, handles edge cases |
| Turkish date formatting | Manual Intl.DateTimeFormat | `date-fns/locale/tr` | Tree-shakable, consistent with project |
| Popover positioning | Custom absolute positioning | shadcn Popover (radix-ui) | Handles viewport edge cases, focus management |

**Key insight:** react-day-picker v9's component override system is designed for exactly this use case — layering custom content (event counts, popovers) on top of the accessible calendar grid.

## Common Pitfalls

### Pitfall 1: React Query Key Mismanagement
**What goes wrong:** Month data refetches on every navigation but may cache incorrectly or cause waterfall requests.
**Why it happens:** Not using a stable query key with month/year.
**How to avoid:** Use `[month, year]` tuple as query key:
```typescript
queryKey: ['calendar', 'monthEvents', year, month]
```
**Warning signs:** Console shows duplicate queries, data flashes old then new.

### Pitfall 2: Popover Opens on Empty Days
**What goes wrong:** D-05 violated — empty days trigger popover with empty content or broken state.
**Why it happens:** `onDayClick` fires regardless of whether the day has events.
**How to avoid:** Check `events.length === 0` in click handler and return early:
```typescript
const handleDayClick = (day: Date, modifiers: DayModifiers) => {
  const events = getEventsForDate(day)
  if (events.length === 0) {
    setPopoverOpen(false)
    return
  }
  setSelectedDay(day)
  setPopoverOpen(true)
}
```

### Pitfall 3: Locale Not Passed to Custom DayButton
**What goes wrong:** Day number formatting correct but week starts on Sunday instead of Monday.
**Why it happens:** `locale` prop not forwarded through the component chain.
**How to avoid:** Ensure CalendarDayButton receives `locale` prop:
```typescript
<Calendar 
  locale={tr}
  components={{
    DayButton: (props) => <CalendarDayButton {...props} locale={tr} />
  }}
/>
```

### Pitfall 4: Date Offset Bug in Month Boundary Queries
**What goes wrong:** Events on month boundary (e.g., Jan 31 or Feb 1) missing or duplicated.
**Why it happens:** JavaScript `Date` month is 0-indexed but SQL stores as 1-indexed; mismatch in `startOfMonth`/`endOfMonth` calculation.
**How to avoid:** Use explicit string formatting for SQL:
```typescript
const startDate = `${year}-${String(month).padStart(2, '0')}-01`
const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
```

### Pitfall 5: Event Ordering Wrong in Popover
**What goes wrong:** D-04 violated — duruşma appears before süre in popover list.
**Why it happens:** Two separate arrays merged incorrectly or sorted by wrong field.
**How to avoid:** Sort by date, then by type with süre having priority:
```typescript
const sortedEvents = [...sures, ...durusmalar].sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  // süre (deadline) comes first within same day
  return a.type === 'süre' ? -1 : 1
})
```

## Code Examples

### Calendar Day Cell with Event Counts
```typescript
// components/calendar/calendar-day-cell.tsx
// Source: react-day-picker v9 DayButton props + custom content pattern

import { DayButton, type DayButtonProps } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Locale } from 'react-day-picker'

type DayEvents = {
  sureCount: number
  durusmaCount: number
}

type CalendarDayCellProps = DayButtonProps & {
  locale?: Partial<Locale>
  events: DayEvents
}

export function CalendarDayCell({
  className,
  day,
  modifiers,
  locale,
  events,
  ...props
}: CalendarDayCellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 h-full w-full",
        className
      )}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {events.sureCount > 0 && (
        <span className="text-[9px] leading-none text-red-500 font-medium">
          {events.sureCount} süre
        </span>
      )}
      {events.durusmaCount > 0 && (
        <span className="text-[9px] leading-none text-blue-500 font-medium">
          {events.durusmaCount} duruşma
        </span>
      )}
    </Button>
  )
}
```

### Event Popover Content
```typescript
// components/calendar/calendar-event-popover.tsx
// Source: Popover patterns from dashboard components + D-03/D-04 decisions

import { Badge } from '@/components/ui/badge'
import { PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from '@/components/ui/popover'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import Link from 'next/link'

type CalendarEvent = {
  id: number
  type: 'süre' | 'duruşma'
  ad: string
  dosya_id: number
  dosya_no: string
  muvekkil_ad: string
  tarih: string
  saat?: string | null
}

type CalendarEventPopoverProps = {
  events: CalendarEvent[]
  selectedDate: Date
}

function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: tr })
}

export function CalendarEventPopover({ events, selectedDate }: CalendarEventPopoverProps) {
  // D-04: Sort: süre first, then duruşma, both chronological
  const sortedEvents = [...events].sort((a, b) => {
    if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih)
    return a.type === 'süre' ? -1 : 1
  })

  return (
    <PopoverContent className="w-80">
      <PopoverHeader>
        <PopoverTitle>{formatDate(selectedDate)}</PopoverTitle>
        <PopoverDescription>
          {events.length} etkinlik
        </PopoverDescription>
      </PopoverHeader>
      
      <div className="mt-2 space-y-2">
        {sortedEvents.map((event) => (
          <Link
            key={`${event.type}-${event.id}`}
            href={`/dosyalar/${event.dosya_id}`}
            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Badge 
              variant={event.type === 'süre' ? 'destructive' : 'secondary'}
              className="shrink-0"
            >
              {event.type === 'süre' ? 'Süre' : 'Duruşma'}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.ad}</p>
              <p className="text-xs text-muted-foreground">
                {event.muvekkil_ad} — #{event.dosya_no}
                {event.type === 'duruşma' && event.saati && ` • ${event.saati}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PopoverContent>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base react-day-picker without locale | Custom Calendar component with Turkish locale | Phase 9 | Consistent date formatting across project |
| List-based dashboard | Calendar-based monthly view | Phase 5 | Spatial overview of monthly workload |

**No SOTA changes detected for this phase — established patterns from Phase 9 and dashboard are being extended.**

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Event dot colors: 🔴 süre (red), 🔵 duruşma (blue) | Code Examples | Visual design — planner should verify with Phase 8/9 palette |
| A2 | Badge counts display "X süre, Y duruşma" format inline | Pattern 2 | User may prefer icons instead of text |
| A3 | Navigation uses prev/next buttons + dropdown (D-02) | User Constraints | If user prefers only buttons or only dropdown, display differs |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **What happens on very busy days (10+ events)?**
   - What we know: Badge counts can become long ("10 süre, 8 duruşma")
   - What's unclear: Should there be a "+" indicator or scrollable popover?
   - Recommendation: Plan for overflow in popover; long lists scroll internally

2. **Should the calendar pre-fetch adjacent months?**
   - What we know: D-06 says fetch only visible month
   - What's unclear: User experience during rapid month navigation
   - Recommendation: Stick with D-06; add `keepPreviousData` from TanStack Query for smooth transitions

## Environment Availability

> Step 2.6: SKIPPED — no external dependencies beyond project code (calendar.tsx exists, Popover/Badge already installed via shadcn).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing project setup) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAKVIM-01 | Calendar renders monthly grid with event markers | unit/integration | `npm test -- calendar` | ❌ Wave 0 |
| TAKVIM-02 | Clicking event navigates to case detail | integration | `npm test -- takvim` | ❌ Wave 0 |
| D-02 | Prev/next and dropdown navigation work | unit | `npm test -- calendar-navigation` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --filter="calendar"`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/calendar/calendar-view.test.tsx` — TAKVIM-01, TAKVIM-02
- [ ] `tests/calendar/calendar-day-cell.test.tsx` — D-01 inline badge format
- [ ] `tests/calendar/calendar-navigation.test.tsx` — D-02 month navigation
- [ ] `tests/calendar/calendar-event-popover.test.tsx` — D-03 popover content
- [ ] `tests/calendar/calendar-router.test.ts` — month query procedure
- [ ] `tests/conftest.ts` — shared fixtures (mock data, test DB setup)
- [ ] Framework install: Vitest already in devDependencies

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | tRPC `protectedProcedure` + middleware auth |
| V5 Input Validation | yes | Zod schema validation on tRPC input |
| V2 Authentication | yes | Cookie-based auth via middleware (existing) |

### Known Threat Patterns for Calendar Feature

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Month query manipulation | Tampering | Zod `z.object({ year: z.number(), month: z.number() })` — validated input |
| Cross-dosya data leakage | Information Disclosure | `protectedProcedure` enforces auth; queries join on dosya_id |

**No calendar-specific security concerns beyond standard tRPC/Drizzle patterns.**

## Sources

### Primary (HIGH confidence)
- [react-day-picker v9 docs](https://daypicker.dev) — Calendar customization, custom components, navigation
- [Phase 9 Context](.planning/phases/09-projedeki-b-t-n-takvim-g-r-n-mlerinin-dosyalar-dosya-detay-y/09-CONTEXT.md) — Turkish locale, Navy+Turuncu palette decisions
- [Phase 5 Context](.planning/phases/05-calendar-view/05-CONTEXT.md) — Locked implementation decisions D-01 through D-09
- [Schema](lib/schema.ts) — `sure` and `durusma` table definitions with indexes

### Secondary (MEDIUM confidence)
- [Dashboard router](lib/trpc/routers/dashboard.ts) — Date range query patterns adapted for calendar
- [Dashboard components](components/dashboard/) — Badge, Popover usage patterns
- [Popover component](components/ui/popover.tsx) — Event popover structure

### Tertiary (LOW confidence)
- [Date-fns locale import path](https://date-fns.org/) — Assumed `date-fns/locale/tr` tree-shakable import; verify at implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-day-picker v9.14.0 confirmed in package.json, all dependencies exist
- Architecture: HIGH — react-day-picker v9 component override patterns documented at daypicker.dev
- Pitfalls: MEDIUM — Date handling patterns verified; specific React Query patterns not explicitly checked

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — stable library API)
