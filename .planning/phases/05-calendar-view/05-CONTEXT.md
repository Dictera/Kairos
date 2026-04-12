# Phase 5: Calendar View - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Aylık takvim görünümü — tüm duruşma (durusma) ve süre (sure) tarihlerini grid üzerinde göster, event'lere tıklayınca ilgili dosya detay sayfasına git. Sadece görüntüleme yapılır — veri girişi başka phase'lerin sorumluluğunda.

</domain>

<decisions>
## Implementation Decisions

### Event Display on Calendar Days
- **D-01:** Her gün hücresinde inline badge sayısı gösterilir — "3 süre, 2 duruşma" formatında. Temiz, bilgi yoğun görünüm.

### Month Navigation
- **D-02:** Hem prev/next month butonları hem ay+yll dropdown seçici — react-day-picker `captionLayout="dropdown"` ile. Kullanıcı hem incremental navigation hem direct jump yapabilir.

### Event Popover Content
- **D-03:** Tıklanan günde event özeti gösterilir: her event için tür badge'i + dosya no + müvekkil adı + (duruşma ise saat). Tüm liste tıklanabilir → dosya detay sayfasına gider.

### Multiple Events Per Day
- **D-04:** Önce süre (deadline) sonra duruşmalar chronological sırada. Süre öncelikli — yargılama süresi kritik.

### Empty Day Behavior
- **D-05:** Event olmayan günlere tıklama sessizce ignored — popover açılmaz, hiçbir şey olmaz.

### Data Query Strategy
- **D-06:** Sadece görünen ayın verisi çekilir (startOfMonth → endOfMonth). Next/prev ay için ayrı query. Basit ve performanslı.

### Empty Month Behavior
- **D-07:** Ayda hiç event yoksa sıradan calendar grid gösterilir — özel empty state mesajı yok.

### Turkish Locale & Styling (Carried from Phase 9)
- **D-08:** Calendar Turkish locale (`dd.MM.yyyy` format, Pazartesi hafta başı, `date-fns/locale/tr`)
- **D-09:** Navy + Turuncu renk paleti — Phase 8/9'da standardizasyonu yapıldı, burada sadece uygulanacak

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 4 Requirements
- `.planning/REQUIREMENTS.md` §Süre (Deadline) Takibi — SURE-01 through SURE-05
- `.planning/REQUIREMENTS.md` §Dashboard & Takvim — DASH-01, DASH-02
- `.planning/phases/04-deadline-engine-dashboard/04-CONTEXT.md` — sure and durusma tables, dashboard query patterns

### Phase 9 Calendar Standardization
- `.planning/phases/09-projedeki-b-t-n-takvim-g-r-n-mlerinin-dosyalar-dosya-detay-y/09-CONTEXT.md` — Turkish locale, Navy+Turuncu palette decisions
- `components/ui/calendar.tsx` — Base calendar component with Phase 9 customizations

### Data Model
- `lib/schema.ts` — `sure` table (id, dosya_id, ad, son_tarih, tur, notlar), `durusma` table (id, dosya_id, tarih, saat, mahkeme_kurum, tur, notlar)

### Existing Routers
- `lib/trpc/routers/dashboard.ts` — dashboard query for durusma + sure by date (reference for calendar query structure)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/calendar.tsx` — react-day-picker based Calendar, Phase 9'da Turkish locale + Navy+Turuncu ile customize edilmiş
- `lib/trpc/routers/dashboard.ts` — `getUpcomingDeadlines` ve `getTodayHearings` procedures, date range query örnekleri
- `lib/trpc/routers/sure.ts` — sure CRUD procedures (create, update, delete, list by dosya_id)
- `lib/trpc/routers/surec.ts` — durusma CRUD (list, create, update, delete by dosya_id)

### Established Patterns
- tRPC protectedProcedure for all data access
- Drizzle ORM with SQLite, date stored as YYYY-MM-DD text
- `date-fns/locale/tr` for Turkish date formatting
- React Query (Tanstack Query) for client-side data fetching

### Integration Points
- New calendar router: `lib/trpc/routers/calendar.ts` — procedure to fetch all durusma + sure for a given month range
- `lib/trpc/routers/_app.ts` — add calendar router
- New page: `app/(dashboard)/takvim/page.tsx` — the calendar view page

</codebase_context>

<specifics>
## Specific Ideas

- Dashboard'daki event'ler zaten takvim formatında gösteriliyor — calendar page bu görünümü monthly grid'e taşıyor
- Event dot renkleri: 🔴 süre (deadline), 🔵 duruşma (hearing) — badge sayısı altında gösterilecek

</specifics>

<deferred>
## Deferred Ideas

- Takvimden directly yeni duruşma/süre ekleme — Phase 3 veya 4'e aittir, calendar sadece görüntüler
- Dashboard widget'larını calendar-based yapma — future phase
- Haftalık veya günlük takvim view — sadece monthly ile başlanacak

</deferred>

---

*Phase: 05-calendar-view*
*Context gathered: 2026-04-13*
