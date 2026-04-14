# Phase 13: Tab Cleanup & UI/UX - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the empty "Notlar/Zaman Çizelgesi" tab by filling it with notes + activity timeline functionality. Adjust tab section content across dosya detail: add new fields to Genel Bilgiler, restructure Yargılama Süreci stages/data points, and improve Belgeler categories. Apply UI/UX improvements across Dosyalar and Müvekkiller list, form, and detail pages. Add müvekkil IBAN field and dosya hasar dosya numarası, kaza tarihi, müvekkil sigorta/kasko şirketi, and kusur oranı fields.

</domain>

<decisions>
## Implementation Decisions

### Boş Sekme Kararı (TAB-01)
- **D-01:** "Notlar / Zaman Çizelgesi" sekmesi doldurulacak — kaldırılmayacak
- **D-02:** Sekme iki bölümden oluşacak: üstte çoklu not alanı (ayrı varlık/CRUD), altta otomatik kapsamlı olay günlüğü
- **D-03:** Notlar ayrı bir veritabanı varlığı olarak saklanacak (mevcut aciklama alanı değil) — birden fazla not eklenebilir, düzenlenebilir, silinebilir
- **D-04:** Zaman çizelgesi otomatik olay günlüğü olarak çalışacak — dosya oluşturma, durum değişiklikleri, süreç aşama geçişleri, finans kayıtları, belge yüklemeleri vb. tüm değişiklikler loglanacak

### Genel Bilgiler Sekmesi Değişiklikleri (TAB-02)
- **D-05:** "Poliçe No" etiketi "Müvekkil Poliçe No" olarak değiştirilecek
- **D-06:** Yeni "Hasar Dosya Numarası" alanı eklenecek — manuel giriş, format "Sigorta Şirketi - 111" gibi, yeni DB alanı
- **D-07:** Yeni "Kaza Tarihi" alanı eklenecek — DatePicker ile, Phase 9 kriterlerine uygun
- **D-08:** Yeni "Müvekkil Sigorta/Kasko Şirketi" alanı eklenecek — dropdown ile mevcut sigorta şirketi listesinden seçim
- **D-09:** Kusur oranları eklenecek — iki ayrı alan: "Karşı Taraf Kusur Oranı" (elle girilen %) ve "Müvekkil Kusur Oranı" (otomatik hesaplanan: 100% - karşı taraf kusur oranı)
- **D-10:** Kusur oranı gösterimi: sadece %0 olmayan değerler gösterilecek — eğer karşı taraf %100 kusurluysa sadece karşı tarafın kusuru görünür, müvekkil 0 gizli
- **D-11:** Kusur oranları dosya seviyesinde Genel Bilgiler sekmesinde gösterilecek

### Yargılama Süreci Sekmesi Değişiklikleri (TAB-02)
- **D-12:** STK aşamaları yeniden yapılandırılacak: İhtar → Arabuluculuk → Başvuru → Ön İnceleme → Bilirkişi → Islah → Karar → İtiraz → Kesinleşme
- **D-13:** STK veri noktaları güncellenecek: STK Esas No, STK Karar No, STK İtiraz Esas No, STK İtiraz Karar No, İhtar Tarihi, Arabuluculuk Son Tutanak Tarihi, Başvuru Tarihi, Bilirkişi Ücreti Talep Tarihi, Bilirkişi Raporu Tebliğ Tarihi, Islah Tarihi, Karar Tarihi, Kesinleşme Tarihi
- **D-14:** Mahkeme aşamaları yeniden yapılandırılacak: Dava Dilekçesi Tebliğ → Cevap Dilekçesi Tebliğ → Replik Dilekçesi Tebliğ → Duplik Dilekçesi Tebliğ → Ön İnceleme → Bilirkişi → Duruşmalar → Karar → Karar Tebliğ → İstinaf → Temyiz → Kesinleşme
- **D-15:** Mahkeme veri noktaları güncellenecek: İlk Derece Esas No, İlk Derece Karar No, İlk Derece Mahkemesi Adı, İstinaf Esas No, İstinaf Karar No, İstinaf Mahkemesi Adı, Temyiz Esas No, Temyiz Karar No, Temyiz Mahkemesi Adı, Dava Dilekçesi Tebliğ Tarihi, Cevap Dilekçesi Tebliğ Tarihi, Replik Dilekçesi Tebliğ Tarihi, Duplik Dilekçesi Tebliğ Tarihi, Bilirkişi Ücreti Talep Tarihi, Bilirkişi Raporu Tebliğ Tarihi, Karar Tebliğ Tarihi, İstinaf Dilekçesi Tebliğ Tarihi, İstinaf Karar Tebliğ Tarihi, Temyiz Dilekçesi Tebliğ Tarihi, Temyiz Karar Tebliğ Tarihi, Kesinleşme Tarihi

### Belgeler Sekmesi Değişiklikleri (TAB-02)
- **D-16:** Belge kategorileri genişletilecek
- **D-17:** Yüklenen belgenin dosya adı, kategori adıyla otomatik eşleşecek/önerilecek — örn. kategori "İhtarname" ise dosya adı da "İhtarname" olsun

### Müvekkil UI/UX (UIUX-01)
- **D-18:** Müvekkil listesinde sütun düzeni ve genel görünüm/his iyileştirmeleri — kompakt ve modern
- **D-19:** Müvekkil formunda alan gruplandırması, düzen ve UX iyileştirmeleri
- **D-20:** Müvekkil detay sayfasında düzen ve okunaklık iyileştirmeleri
- **D-21:** Yeni "IBAN" alanı müvekkil veritabanına eklenecek — form, liste ve detayda gösterilecek

### Dosya UI/UX (UIUX-01)
- **D-22:** Dosya listesinde sütun düzeni ve modern görünüm iyileştirmeleri
- **D-23:** Dosya formunda yeni alanlar (hasar no, kaza tarihi, müvekkil sigorta şirketi, kusur oranları) dahil düzen ve UX iyileştirmeleri
- **D-24:** Dosya detay sayfasında (6 sekme) düzen ve okunaklık iyileştirmeleri

### the agent's Discretion
- Not varlığının tam şema tasarımı (alanlar, ilişkiler)
- Zaman çizelgesi olay günlüğü şema tasarımı (hangi olaylar loglanır, format)
- Kusur oranı hesaplama mantığının UI detayları
- UI/UX iyileştirmelerinin tam görsel detayları (renk, boşluk, tipografi)
- Belge kategori genişletmenin tam liste
- STK/Mahkeme aşama ve veri noktası değişikliklerinin mevcut şemayla uyumu

</decisions>

<specifics>
## Specific Ideas

- Kusur oranı gösterimi: sadece %0 olmayan değerler görünür — karşı taraf %100 kusurlu → sadece karşı tarafın kusuru, müvekkil 0 gizli
- Hasar dosya numarası formatı: kullanıcının manuel girdiği "Sigorta Şirketi - 111" gibi format
- Belge isimleri otomatik olarak kategori ismine eşleşsin — kategori "İhtarname" → dosya adı "İhtarname"
- Zaman çizelgesi "dosyanın logu gibi" — otomatik, kapsamlı
- STK aşamaları: İhtar → Arabuluculuk → Başvuru → Ön İnceleme → Bilirkişi → Islah → Karar → İtiraz → Kesinleşme
- Mahkeme aşamaları: Dava Dilekçesi Tebliğ → Cevap Dilekçesi Tebliğ → Replik Dilekçesi Tebliğ → Duplik Dilekçesi Tebliğ → Ön İnceleme → Bilirkişi → Duruşmalar → Karar → Karar Tebliğ → İstinaf → Temyiz → Kesinleşme

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tab structure and dosya detail
- `components/dosya/dosya-detail-tabs.tsx` — 6-tab structure, EmptyTabContent component, tab order
- `components/dosya/genel-bilgiler-tab.tsx` — Current Genel Bilgiler fields and layout
- `components/dosya/yargilama-sureci-tab.tsx` — Current STK/Mahkeme process stepper and data forms
- `components/dosya/karsitaraflar-tab.tsx` — Karşı Taraflar tab with driver info (Phase 12)

### Dosya list and form
- `components/dosya/dosya-list.tsx` — Current dosya list with filters and pagination
- `components/dosya/dosya-form.tsx` — Current dosya create/edit form (8 fields)

### Müvekkil pages
- `components/muvekkil/muvekkil-list.tsx` — Current müvekkil list with search and pagination
- `components/muvekkil/muvekkil-form.tsx` — Current müvekkil form (6 fields)
- `components/muvekkil/muvekkil-detail.tsx` — Current müvekkil detail with linked dosyalar

### Schema and tRPC
- `lib/schema.ts` — Database schema (dosya, muvekkil, taraf, surec tables)
- `lib/trpc/routers/dosya.ts` — Dosya routes, tarafSchema
- `lib/trpc/routers/muvekkil.ts` — Müvekkil routes

### Phase 10-12 decisions (locked)
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — D-01 phone regex, D-02 no plate validation, D-03 nullable fields
- `.planning/phases/12-taraf-tab-driver-info-ui/12-CONTEXT.md` — D-01 Card separation, D-03 empty fields hidden, D-06 plate placeholder

### Date picker
- `components/ui/date-picker.tsx` — DatePickerField component (Phase 9 standardized)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/dosya/dosya-detail-tabs.tsx` EmptyTabContent: Can be replaced with actual notes + timeline content
- `components/ui/tabs.tsx` + `TabsList/TabsTrigger/TabsContent`: Tab infrastructure already in place
- `components/ui/date-picker.tsx`: DatePickerField for kaza tarihi
- `components/ui/card.tsx`, `badge.tsx`, `button.tsx`: Design system components
- `components/dosya/surec-stepper.tsx`: Stepper component for process stages — may need restructuring for new stage definitions
- `components/dosya/stk-data-form.tsx` + `mahkeme-data-form.tsx`: Data form components for process data points — will need significant updates for new data points
- `components/dosya/durusma-list.tsx` + `sure-list.tsx`: Existing sub-components for hearing and deadlines

### Established Patterns
- Card-based detail view with edit/view toggle (Karşı Taraflar pattern from Phase 12)
- InfoRow + grid layout for view mode data display
- tRPC mutation + queryClient invalidation for data updates
- Drizzle migration pattern (sequential numbered SQL files)
- Zod validation in tRPC schemas
- `useForm` + `zodResolver` pattern for forms

### Integration Points
- `dosya-detail-tabs.tsx` line 210: EmptyTabContent for "notlar" tab — replace with NoteList + Timeline components
- `genel-bilgiler-tab.tsx`: Add new fields (hasar no, kaza tarihi, müvekkil sigorta, kusur oranları)
- `dosya-form.tsx`: Add new form fields and update schema
- `muvekkil-form.tsx` + `muvekkil-list.tsx` + `muvekkil-detail.tsx`: Add IBAN field
- `lib/schema.ts`: Add new columns (hasar_dosya_no, kaza_tarihi, muvekkil_sigorta_id, kusur_orani_karsi, kusur_orani_muvekkil, iban, note/timeline entities)
- `lib/trpc/routers/dosya.ts`: Update schemas and routes for new fields
- `lib/trpc/routers/muvekkil.ts`: Add IBAN field to routes
- STK/Mahkeme stage definitions in `lib/schema.ts`: Restructure stage arrays and data point schemas

</code_context>

<deferred>
## Deferred Ideas

- Ayarlar sayfasında sigorta şirketlerine ek alanlar (mersis no, vergi no, bağlı olduğu vergi dairesi, ihtar mail adresi, kep mail adresi) — yeni faz
- Ayarlar sayfasında sigorta şirketlerine avukat bölümü (ad, TBB Sicil No, IBAN, mail, telefon) — yeni faz
- Karşı taraf seçiminde avukat dropdown ile ayarlardan seçim — yeni faz (aynı faz olarak üstteki)

</deferred>

---

*Phase: 13-tab-cleanup-ui-ux*
*Context gathered: 2026-04-14*