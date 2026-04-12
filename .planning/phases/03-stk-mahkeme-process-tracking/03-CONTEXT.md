# Phase 3: STK & Mahkeme Process Tracking - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Yargılama Süreci sekmesini doldurmak: STK tahkim süreç aşamalarını (9 aşama) ve mahkeme süreç aşamalarını (8 aşama) dosya bazında kayıt ve ilerleme takibi; tüm ilgili veri noktaları (STK başvuru no, kabul tarihi, raportör, hakem karar tarihi; Esas No, Karar No, mahkeme adı vb.); ve dosyaya bağlı çoklu duruşma (hearing) kayıtları. Süre hesaplama ve dashboard Phase 4'e aittir. Belgeler ve finans Phase 6'ya aittir.

</domain>

<decisions>
## Implementation Decisions

### Çift Süreç Takibi
- **D-01:** Bir STK dosyası hem STK tahkim aşamalarını hem de (itiraz davası açılırsa) mahkeme aşamalarını **aynı dosya altında** takip eder. `dosya.tur = 'STK'` olsa bile mahkeme süreci bölümü aktif edilebilir. AT/AH dosyaları yalnızca mahkeme sürecini taşır. Yargılama Süreci sekmesi iki bölüm gösterir: "STK Tahkim Süreci" (STK veya tüm dosyalar) ve "Mahkeme Süreci" (koşullu görünür).
- **D-02:** `surec_detay` JSON kolonu dosya üzerinde hem STK state hem mahkeme state'ini ayrı anahtarlarla tutar: `{ stk: { asama, veriler... }, mahkeme: { asama, veriler... } }`. AT/AH dosyaları yalnızca `mahkeme` anahtarını kullanır; STK dosyaları isteğe bağlı olarak her ikisini de kullanabilir.

### Aşama İlerletme UX
- **D-03:** Kullanıcı aşamayı **sıralı "İleri Al" butonu** ile ilerletir. Atlama yapılamaz; yalnızca bir sonraki aşamaya geçiş desteklenir. Stepper görsel olarak tamamlanmış aşamaları (●), mevcut aşamayı (◎) ve gelecek aşamaları (○) gösterir. "İleri Al →" butonu mevcut aşamanın yanında konumlandırılır.
- **D-04:** Aşama geri alınamaz (önceki aşamaya dönüş yok). Hatalı ilerleme durumunda kullanıcı veriyi düzenleyebilir ama aşama başlangıca dönemez.

### Veri Noktaları Formu
- **D-05:** Tüm STK veri alanları (STK başvuru no, başvuru tarihi, kabul tarihi, raportör adı, bilirkişi, hakem karar tarihi, tebligat tarihi, itiraz tarihi) stepper'ın hemen altında **tek bir formda** her zaman görünür olur. Tüm mahkeme veri alanları (Esas No, Karar No, mahkeme adı, dava tarihi, tebligat tarihleri, karar tarihi) benzer şekilde tek formda gösterilir.
- **D-06:** Form alanları bağımsız kayıt edilir: kullanıcı aşamadan bağımsız herhangi bir alanı istediği zaman doldurup kaydedebilir. Aşama ilerletme ve veri formu kaydetme ayrı eylemlerdir.

### Duruşma Kaydı UX
- **D-07:** Duruşma ekle/düzenle için **shadcn Dialog (modal)** kullanılır. Yargılama Süreci sekmesinin alt bölümünde kronolojik sıralı duruşma listesi gösterilir. Listenin altında "Duruşma Ekle" butonu bulunur; her satırda "Düzenle" ve "Sil" aksiyonları vardır.
- **D-08:** Dialog alanları: tarih (date picker), saat (text), mahkeme/kurum (ayarlardan tanımlı liste veya serbest metin), duruşma türü (serbest metin: "esas", "ara karar", "bilirkişi" vb.), notlar (textarea). Bir dosyaya birden fazla duruşma eklenebilir (SUREC-05).

### Claude'un Takdirine Bırakılanlar
- Stepper bileşeninin tam görsel tasarımı (shadcn'de built-in Stepper yok — Claude özel CSS veya `cn()` + Badge bileşeni ile yapar)
- Mahkeme süreci bölümünün STK dosyalarında nasıl aktif edileceği ("Mahkeme süreci başlat" butonu mu, yoksa otomatik görünür mü)
- Form validation hata mesajlarının tam metni (Türkçe, kullanıcı dostu)
- Duruşma listesi sütunları (tarih, saat, mahkeme, tür yeterli — notlar tooltip/genişleme ile)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 Requirements
- `.planning/REQUIREMENTS.md` §STK & Mahkeme Süreç Takibi — SUREC-01 through SUREC-05 (tüm aşama enum'ları, veri noktaları, duruşma yapısı)

### Project Constraints
- `.planning/PROJECT.md` §Constraints — tech stack (Next.js 15, SQLite, Drizzle ORM, tRPC, shadcn/ui, Tailwind)
- `.planning/PROJECT.md` §Context — 6-tab detail screen structure, dosya türleri

### Prior Phase Decisions (directly relevant)
- `.planning/phases/02-core-case-management/02-CONTEXT.md` §D-14, D-15, D-16 — 6 sekme yapısı; Yargılama Süreci Phase 2'de placeholder (kilit ikonu); Phase 3 bu sekmeyi doldurur
- `.planning/phases/02-core-case-management/02-CONTEXT.md` §Code Context — mevcut shadcn bileşenleri (Dialog, Badge, Tabs, Form, Card, Button vb.)

[No external specs or ADRs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/dialog.tsx` — shadcn Dialog (duruşma ekle/düzenle modal için)
- `components/ui/badge.tsx` — stepper aşama badge'leri için
- `components/ui/tabs.tsx` — Yargılama Süreci zaten sekme içinde; iç içe sekme gerekmez
- `components/ui/form.tsx`, `input.tsx`, `textarea.tsx` — veri formu alanları
- `lib/trpc/init.ts` — `protectedProcedure`, `createTRPCRouter` hazır
- `lib/db.ts` — SQLite singleton; import `db` from `@/lib/db`
- `lib/schema.ts` — `dosya` tablosu mevcut; Phase 3 `surec_detay` JSON kolonu ve `durusma` tablosu ekler

### Established Patterns
- tRPC routers: `protectedProcedure` tüm entity CRUD için (login cookie zorunlu)
- Schema: `drizzle-kit generate` + `drizzle-kit migrate` iş akışı (asla `push`)
- Formlar ayrı sayfa değil (D-05 Phase 2: "ayrı sayfa" dosya/müvekkil içindi) — Yargılama Süreci sekmesi içi form, modal dialog ile uyumlu
- Toast (sonner) başarı/hata bildirimleri için kullanılıyor

### Integration Points
- `components/dosya/dosya-detail-tabs.tsx` — `EmptyTabContent` kaldırılıp Yargılama Süreci gerçek içerikle doldurulur
- `lib/trpc/routers/_app.ts` — `surec` router eklenir (aşama ilerletme + veri güncelleme + duruşma CRUD)
- `lib/schema.ts` — `surec_detay` JSON kolonu `dosya` tablosuna eklenir; `durusma` yeni tablo olarak eklenir
- `app/(dashboard)/dosyalar/[id]/page.tsx` — mevcut detay sayfası; sekme bileşeni burada render ediliyor

</code_context>

<specifics>
## Specific Ideas

- STK dosyası hem STK hem mahkeme sürecini aynı ekranda takip edebilmeli — avukat itiraz davası açtığında yeni dosya açmak zorunda kalmamalı
- Stepper görsel: ● tamamlandı, ◎ mevcut aşama, ○ gelecek aşama — basit ve anlaşılır
- "İleri Al →" butonu mevcut aşamanın hemen yanında — liste görünümünde değil stepper üzerinde
- Duruşma listesi kronolojik sıralı (en yakın tarih üstte veya en son eklenen üstte — Claude karar verir)

</specifics>

<deferred>
## Deferred Ideas

- Aşama geri alma (önceki aşamaya dönüş) — kasıtlı olarak reddedildi; D-04
- Aşama dropdown ile doğrudan seçim (atlama) — kasıtlı olarak reddedildi; D-03
- İstinaf / Temyiz modülü — REQUIREMENTS.md Out of Scope; v2'ye bırakıldı

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-stk-mahkeme-process-tracking*
*Context gathered: 2026-04-12*
