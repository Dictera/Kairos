# Phase 14: Ayarlar Sigorta Şirketi Ek Alanlar ve Avukat Yönetimi - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Ayarlar sayfasına sigorta şirketi ek alanlar (mersis no, vergi no, bağlı olduğu vergi dairesi, ihtar mail, kep mail) ve avukat yönetimi (ad, TBB Sicil No, IBAN, e-posta, telefon) eklemek. Avukatlar ayrı tablo olarak sigorta şirketleriyle ilişkili. Dosya karşı taraf sekmesinde serbest metin "Vekil Adı" alanı dropdown avukat seçimi ile değiştirilir.

</domain>

<decisions>
## Implementation Decisions

### Sigorta Şirketi Ek Alanlar
- **D-01:** Tüm 5 alan sigorta şirketine eklenir: mersis_no, vergi_no, bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail
- **D-02:** vergi_no zorunlu alan — TCKN/VKN format doğrulaması (10 veya 11 hane)
- **D-03:** ihtar_mail ve kep_mail opsiyonel ama geçerli e-posta formatı zorunlu
- **D-04:** mersis_no ve bagli_oldugu_vergi_dairesi opsiyonel, serbest metin
- **D-05:** UI: mevcut AyarlarCrudSection yapısı korunur ama sigorta şirketi için özel genişletme — tablo sütunları + dialog form ile tüm yeni alanlar

### Avukat Varlık Tasarımı
- **D-06:** Avukat ayrı tablo (avukat) — sigorta şirketiyle ilişki tablosu üzerinden birçok-çağı ilişki (bir avukat birden fazla şirkete hizmet edebilir)
- **D-07:** Avukat tablosu alanları: ad (zorunlu), tbb_sicil_no (zorunlu), iban (opsiyonel, TR formatı), eposta (opsiyonel, e-posta formatı), telefon (opsiyonel, 05XXXXXXXXX — Phase 10 D-01)
- **D-08:** İlişki tablosu: avukat_sigorta_sirketi — avukat_id + sigorta_sirketi_id (many-to-many)
- **D-09:** Ayarlar sayfasında avukatlar sigorta şirketi detayında yönetilir — şirket detayında/kartında "Avukatlar" bölümü ile ekle/düzenle/sil

### Avukat Dropdown Entegrasyonu
- **D-10:** Dosya karşı taraf sekmesinde mevcut "Vekil Adı" serbest metin alanı kaldırılır ve avukat dropdown ile değiştirilir
- **D-11:** Avukat dropdown, seçilen karşı sigorta şirketine göre filtrelenir — şirket değiştiğinde avukat listesi güncellenir
- **D-12:** karsitaraf_vekil serbest metin sütunu kaldırılır, yerine avukat_id FK eklenir (temiz geçiş)

### the agent's Discretion
- Tablo/migration isimlendirmeleri
- Ayarlar sayfasında sigorta şirketi tablosunda hangi sütunlar görünür (Ad + birkaç özet sütun mu, tüm sütunlar mı)
- Avukat ilişki tablosu detayları
- Dialog form alan düzeni ve gruplandırma
- IBAN format doğrulama detayları

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and database
- `lib/schema.ts` — sigortaSirketi table (id, ad only — extend with 5 new columns), taraf table (karsitaraf_vekil field to replace with avukat_id), relations
- `drizzle.config.ts` — Drizzle configuration for migration

### tRPC routes
- `lib/trpc/routers/ayarlar.ts` — makeCrudRouter pattern for sigorta şirketi (extend for new fields + avukat management)
- `lib/trpc/routers/dosya.ts` — tarafSchema, upsertTaraf mutation (will need avukat_id instead of karsitaraf_vekil)

### UI components
- `components/ayarlar/ayarlar-page.tsx` — Current ayarlar page with 3 sections (extend with avukat management)
- `components/ayarlar/ayarlar-crud-section.tsx` — Generic CRUD component (reference for extending or creating new section)
- `components/dosya/karsitaraflar-tab.tsx` — Karşı taraf tab with sigorta dropdown and vekil free text (replace vekil with avukat dropdown)

### Phase decisions (locked)
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — D-01 phone regex 05XXXXXXXXX, D-02 no plate validation, D-03 nullable fields
- `.planning/phases/12-taraf-tab-driver-info-ui/12-CONTEXT.md` — D-01 Card separation pattern, D-03 empty fields hidden, D-06 plate placeholder

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AyarlarCrudSection` component: Generic CRUD with table + dialog pattern — can be extended or used as reference for sigorta şirketi detail/avukat sections
- `makeCrudRouter` in ayarlar.ts: Pattern for creating REST-like CRUD routers — can be extended for new fields and new entities
- `karsitaraflar-tab.tsx` Select dropdown: Existing sigorta şirketi dropdown pattern with `onValueChange` and `SelectItem` rendering — can be adapted for avukat dropdown
- `InfoRow` component in karsitaraflar-tab.tsx: Can be reused for displaying avukat info in view mode

### Established Patterns
- Card-based edit/view toggle pattern (from Phase 12)
- `useForm` + `zodResolver` for form validation
- tRPC mutation + queryClient invalidation for data updates
- Drizzle migration pattern (sequential numbered SQL files)
- Zod validation in tRPC schemas (phone regex, email format, etc.)
- `AyarlarCrudSection` with `showSehir` prop pattern for conditional fields

### Integration Points
- `lib/schema.ts` sigortaSirketi table: Add 5 new columns (mersis_no, vergi_no, bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail)
- `lib/schema.ts`: New avukat table + avukat_sigorta_sirketi relation table needed
- `lib/schema.ts` taraf table: Replace karsitaraf_vekil column with avukat_id FK
- `lib/trpc/routers/ayarlar.ts`: Extend sigortaSirketi CRUD for new fields, add avukat CRUD + relation management
- `components/ayarlar/ayarlar-page.tsx`: Add avukat management UI under sigorta şirketi section
- `components/dosya/karsitaraflar-tab.tsx`: Replace vekil free text Input with avukat Select dropdown filtered by sigorta şirketi

</code_context>

<specifics>
## Specific Ideas

- Avukat dropdown şirkete göre filtrelenmeli — şirket seçildiğinde avukat listesi otomatik güncellenir
- Sigorta şirketi ayar sayfasında "tümü" görünümü korunur ama detayda ek alanlar ve avukatlar gösterilir
- Temiz veritabanı geçişi: karsitaraf_vekil serbest metin tamamen kaldırılır, avukat_id FK ile değiştirilir

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi*
*Context gathered: 2026-04-14*