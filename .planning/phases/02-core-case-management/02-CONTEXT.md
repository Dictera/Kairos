# Phase 2: Core Case Management - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a complete, searchable registry of the practice: Müvekkil (client) and Dosya (case file) CRUD with full list, detail, create, edit, and archive/delete flows; counter-party details; and Ayarlar definitions (insurance companies, insurance types, courts). Phase 3 adds STK/court process tracking. Phase 6 adds document upload and finance. This phase delivers the shell and data — all 6 tabs exist on the case detail page, but only Genel Bilgiler and Karşı Taraflar are filled.

</domain>

<decisions>
## Implementation Decisions

### Dosya Listesi UX
- **D-01:** Sayfalama (pagination), not infinite scroll. Server-side filtered query guarantees < 1s load for 200+ records.
- **D-02:** Default page size: 25-50 rows/page with page number controls.
- **D-03:** Visible columns (in order): Dosya No | Müvekkil Adı | Tür (STK/AT/AH) | Sigorta Türü | Karşı Sigorta Şirketi | Poliçe No | Durum (Aktif/Arşivlenmiş) — 7 columns, fits desktop without horizontal scroll.
- **D-04:** Search bar + filter controls always visible above the table (not collapsible). Filters: tür (dropdown), durum (dropdown), tarih range. Search: dosya no ve müvekkil adı üzerinden.

### Form Deneyimi
- **D-05:** Dosya oluşturma/düzenleme — ayrı sayfa: `/dosyalar/yeni` ve `/dosyalar/[id]/duzenle`. Browser geri tuşu çalışır.
- **D-06:** Müvekkil oluşturma/düzenleme — ayrı sayfa: `/muvekkiller/yeni` ve `/muvekkiller/[id]/duzenle`. Same pattern as dosya for consistency.

### Müvekkil Silme Davranışı
- **D-07:** Bağlı dosyaları olan müvekkil silinemez. Hata mesajı: "Bu müvekkile ait N dosya bulunuyor. Müvekkili silmek için önce tüm dosyaları silin veya arşivleyin." — with a "Dosyaları Gör" link. Hard block, no cascade option.
- **D-08:** Bağlı dosyası olmayan müvekkil silinmeden önce onay dialog'u (shadcn AlertDialog) gösterilir.

### Sigorta Türü Tanımları
- **D-09:** Sigorta türü (Kasko, Trafik/ZMSS, Sağlık, Hayat vb.) Ayarlar sayfasında kullanıcı tarafından yönetilen bir liste — sigorta şirketi ile aynı pattern. Dosya oluştururken dropdown'dan seçilir.
- **D-10:** Veritabanında `sigorta_turu` tablosu (id, ad). Dosya oluştururken FK ile bağlanır.
- **D-11:** Seed değerleri (migration ile): Kasko, Trafik / ZMSS, Sağlık, Hayat.

### Plaka Alanı (Scope Genişletme)
- **D-12:** `dosya` tablosuna `muvekkil_plaka` (text, nullable) ve `taraf` tablosuna `karsitaraf_plaka` (text, nullable) eklenir. Kasko/Trafik dosyalarında dolu, diğerlerinde boş kalır.
- **D-13:** Plaka dosya detay sayfasında (Genel Bilgiler ve Karşı Taraflar sekmelerinde) görünür; liste sütunlarında yer almaz.

### Dosya Detay Sekmeleri
- **D-14:** 6 sekme DOSYA-03 sırasıyla: Genel Bilgiler | Yargılama Süreci | Belgeler | Notlar/Zaman Çizelgesi | Karşı Taraflar | Dosya Finansı.
- **D-15:** Phase 2'de doldurulan sekmeler: Genel Bilgiler, Karşı Taraflar.
- **D-16:** Boş sekmeler (Yargılama Süreci, Belgeler, Notlar/Zaman Çizelgesi, Dosya Finansı) kilit ikonu + "Bu bölüm henüz yapılandırılmadı." placeholder metni gösterir. Sekme başlıkları görünür ve tıklanabilir — içerik sadece placeholder.

### Claude'un Takdirine Bırakılanlar
- Filtrelerin tam yerleşimi (filter bar'ın tablo üstündeki tam düzeni)
- Sayfalama kontrolü stili (shadcn Pagination bileşeni yeterli)
- Form validation hata mesajları (Türkçe, kullanıcı dostu)
- Dosya numarası (avukat dosya no) uniqueness: validation yapılır ya da yapılmaz — Claude karar verir
- Müvekkil listesi sütunları (ad, telefon, TC/Vergi No, bağlı dosya sayısı — makul seçim Claude'a)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Requirements
- `.planning/REQUIREMENTS.md` §Müvekkil Yönetimi — MUVEK-01 through MUVEK-04
- `.planning/REQUIREMENTS.md` §Dosya Yönetimi — DOSYA-01 through DOSYA-05
- `.planning/REQUIREMENTS.md` §Ayarlar — AYAR-01, AYAR-02, AYAR-03

### Project Constraints
- `.planning/PROJECT.md` §Constraints — tech stack, performance target (< 1s for 200+ dosya), deployment model
- `.planning/PROJECT.md` §Context — dosya türleri (Kasko/Trafik, Sağlık/Hayat), 6-tab detail screen structure

### Prior Phase Decisions
- `.planning/phases/01-foundation/01-CONTEXT.md` §D-01, D-02, D-03 — sidebar navigation order (Dosyalar as primary, Müvekkiller second)
- `.planning/phases/08-ui-yenileme-renk-paleti-degisikligi-ve-shadcn-ui-bilesenleri/08-CONTEXT.md` §D-08 — installed shadcn component set (card, table, badge, tabs, dialog, alert-dialog, form, select, etc.)

[No external specs or ADRs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/` — 23 shadcn components installed: button, card, table, badge, tabs, dialog, alert-dialog, form, select, textarea, input, label, pagination, scroll-area, avatar, separator, popover, sonner, dropdown-menu, checkbox, radio-group, switch, breadcrumb
- `lib/trpc/init.ts` — `createTRPCRouter`, `publicProcedure`, `protectedProcedure`, `createCallerFactory` all ready
- `lib/trpc/client.ts` — typed client with `AppRouter` type; `useTRPC()` hook available in client components
- `lib/db.ts` — SQLite singleton with WAL mode, busy_timeout, foreign_keys pragmas; import as `db` from `@/lib/db`
- `lib/schema.ts` — currently only `schemaTest` stub; Phase 2 adds all real entity tables
- `lib/trpc/routers/_app.ts` — currently only `health` procedure; Phase 2 routers will be added here

### Established Patterns
- tRPC routers: `protectedProcedure` for all entity CRUD (requires login cookie)
- Schema: `drizzle-kit generate` + `drizzle-kit migrate` workflow (never `push`)
- Route groups: `(dashboard)` has sidebar layout; `(auth)` is passthrough
- shadcn CSS tokens: all colors via oklch CSS variables in `app/globals.css` — Navy + Turuncu palette

### Integration Points
- `app/(dashboard)/dosyalar/page.tsx` — current placeholder; Phase 2 replaces with real list page
- `app/(dashboard)/muvekkiller/page.tsx` — current placeholder; Phase 2 replaces with real list page
- `app/(dashboard)/ayarlar/page.tsx` — current placeholder; Phase 2 replaces with Ayarlar CRUD page
- `lib/trpc/routers/_app.ts` — Phase 2 adds `muvekkil`, `dosya`, `ayarlar` sub-routers
- `lib/schema.ts` — Phase 2 replaces schemaTest stub with real entity schemas

</code_context>

<specifics>
## Specific Ideas

- Dosya listesi sütunları kullanıcı tarafından belirtildi: Dosya No, Müvekkil, Tür, Sigorta Türü, Karşı Taraf Sigortası, Poliçe No, Durum — plaka listede değil, detay sayfasında
- Müvekkil ve karşı taraf plaka no alanları kullanıcı talebiyle eklendi (Kasko/Trafik dosyaları için; nullable)
- Sigorta türü dropdown seçimi tercih edildi — "Kasko" vs "kasko" tutarsızlıklarını önlemek için
- Boş sekmeler kilit ikonu ile gösterilmeli — "henüz yapılandırılmadı" mesajı yeterli, faz bilgisi eklenmemeli

</specifics>

<deferred>
## Deferred Ideas

- Filtre sidebar / collapsible filter panel — kullanıcı görünür filter bar ile yetindi; ileride istenirse eklenebilir
- Dosya numarası uniqueness validation — Claude takdirine bırakıldı
- Müvekkil silme cascade seçeneği — kasıtlı olarak reddedildi; blok yaklaşımı tercih edildi

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-core-case-management*
*Context gathered: 2026-04-11*
