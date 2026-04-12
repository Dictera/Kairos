# Phase 4: Deadline Engine + Dashboard - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Otomatik süre hesaplama engine'i (STK 10 günlük itiraz süresi, 14 günlük istinaf başvurusu ve cevap dilekçesi) + adli tatil çakışma tespiti ve inline uyarı + manuel süre girişi (dosya bazlı) + dashboard ana paneli (özet istatistikler, yaklaşan süreler, bugünkü duruşmalar). Takvim görünümü Phase 5'e aittir.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **D-01:** Dashboard 3 bölüm dikey yapıda: (1) üstte 3 özet stat kartı (Toplam Dosya, Aktif Dosya, Bu Ay Açılan), (2) ortada Yaklaşan Süreler listesi, (3) altta Bugünkü Duruşmalar listesi. Temiz, gözetleme odaklı düzen.
- **D-02:** Dashboard sadece görüntüleme yapar — içinden veri girişi yapılmaz. Deadline ve duruşma satırları ilgili dosya detay sayfasına link içerir.

### Süre Listesi Görünümü
- **D-03:** Yaklaşan Süreler widget'ı **0–14 gün** aralığındaki tüm süreleri tek listede gösterir. Renk kodu: 🔴 < 3 gün (kırmızı), 🟡 < 7 gün (sarı), ⚪ 7–14 gün (nötr/gri). Ayrı "bu hafta / yakında" bölümü yok.
- **D-04:** Her süre öğesi: süre adı + müvekkil adı + dosya no (link) + kaç gün kaldığı. Bu format hem otomatik hesaplanan hem manuel eklenen süreler için geçerli.

### Adli Tatil Uyarısı
- **D-05:** Adli tatile (20 Temmuz–31 Ağustos) denk düşen süre öğelerinin yanında inline badge: `⚠ Adli Tatil — manuel kontrol`. Akışı bozmayan, göze çarpan etiket. Otomatik tarih uzatması yapılmaz.

### Manuel Süre Girişi
- **D-06:** Manuel süre (özel isim, tarih, notlar) **yalnızca dosya detay sayfasından** eklenir — Yargılama Süreci sekmesinde veya ayrı bir "Süreler" alt bölümünde "Manuel Süre Ekle" butonu. Dashboard sadece mevcut süreleri listeler, ekleme yapmaz.

### Otomatik Hesaplama Tetikleyicisi
- **D-07:** Yargılama Süreci sekmesinde tebligat/karar tarihi kaydedildiğinde deadline sessizce hesaplanıp `sure` tablosuna yazılır. Ayrıca "hesaplandı" bildirimi gösterilmez — zaten form kaydetme toast'ı çıkıyor. Fazla gürültü olmaz.

### Otomatik Hesap Kuralları (Gereksinimlerden)
- **D-08:** STK karara itiraz süresi: `stk_tebligat_tarihi + 10 takvim günü`
- **D-09:** İstinaf başvurusu: `mahkeme_karar_tebligat_tarihi + 14 takvim günü`
- **D-10:** Cevap dilekçesi: `dava_tebligat_tarihi + 14 takvim günü`

### Claude'un Takdirine Bırakılanlar
- `sure` tablosunun tam schema yapısı (id, dosya_id, ad, son_tarih, tur: 'otomatik'|'manuel', notlar, created_at)
- Özet stat kartlarının tam görsel tasarımı (shadcn Card bileşeni önerilen)
- Duruşmalar listesinde saat + mahkeme bilgisinin nasıl kısaltılacağı
- Bugün duruşması yoksa empty state metni

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 4 Requirements
- `.planning/REQUIREMENTS.md` §Süre (Deadline) Takibi — SURE-01 through SURE-05 (hesaplama kuralları, adli tatil, manuel süre)
- `.planning/REQUIREMENTS.md` §Dashboard & Takvim — DASH-01, DASH-02 (dashboard içeriği ve renk kodlaması)

### Project Constraints
- `.planning/PROJECT.md` §Constraints — tech stack (Next.js 15, SQLite, Drizzle ORM, tRPC, shadcn/ui, Tailwind)

### Prior Phase Decisions (directly relevant)
- `.planning/phases/03-stk-mahkeme-process-tracking/03-CONTEXT.md` §D-02 — `surec_detay` JSON yapısı; `stk.tebligat_tarihi`, `mahkeme.karar_tebligat_tarihi`, `mahkeme.dava_tebligat_tarihi` burada tutuluyor — deadline auto-calc bu alanlardan tetiklenir
- `.planning/phases/03-stk-mahkeme-process-tracking/03-CONTEXT.md` §Code Context — `durusma` tablosu (tarih, saat, mahkeme_kurum alanları dashboard için)

[No external specs or ADRs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/card.tsx` — özet stat kartları ve widget container'lar için
- `components/ui/badge.tsx` — renk kodlu süre badge'leri (kırmızı/sarı/gri) ve adli tatil etiketi
- `components/ui/progress.tsx` — isteğe bağlı görsel gösterge
- `lib/trpc/init.ts` — `protectedProcedure`, `createTRPCRouter` hazır
- `lib/db.ts` — SQLite singleton
- `lib/schema.ts` — `dosya`, `durusma` tabloları mevcut; Phase 4, `sure` yeni tablosu ekler

### Established Patterns
- tRPC routers: `protectedProcedure` tüm entity CRUD için (login cookie zorunlu)
- Schema: `drizzle-kit generate` + `drizzle-kit migrate` iş akışı (asla `push`)
- Toast (sonner) başarı/hata bildirimleri için kullanılıyor — auto-calc sessiz, toast çakıştırılmaz
- Dashboard page stub mevcut: `app/(dashboard)/page.tsx` — sadece `<h1>Dashboard</h1>`

### Integration Points
- `app/(dashboard)/page.tsx` — stub'dan tam dashboard sayfasına dönüştürülecek
- `lib/trpc/routers/_app.ts` — `sure` router eklenir
- `lib/schema.ts` — `sure` yeni tablo olarak eklenir
- `lib/trpc/routers/surec.ts` — tebligat tarihi kaydetme işlemi tetikleyici noktası (auto-calc burada)

</code_context>

<specifics>
## Specific Ideas

- Dashboard layout mockup (kullanıcı onayladı):
  ```
  ┌──────────────────────────────────────────┐
  │  Toplam: 47  Aktif: 32  Bu ay açılan: 5  │
  ├──────────────────────────────────────────┤
  │  ⏰ Yaklaşan Süreler                      │
  │   🔴 İtiraz süresi     Ahmet Yılmaz — #42   2 gün
  │   🟡 İstinaf           Fatma Demir  — #18   5 gün
  │   ⚪ Cevap dilekçesi   Mehmet Can   — #7   10 gün ⚠ Adli Tatil
  ├──────────────────────────────────────────┤
  │  📅 Bugünkü Duruşmalar                   │
  │   09:00 — İstanbul 4. ATM — Dosya #31   │
  │   14:30 — İstanbul 8. ATM — Dosya #19   │
  └──────────────────────────────────────────┘
  ```
- Adli tatil badge: `⚠ Adli Tatil — manuel kontrol` inline, süre satırının yanında

</specifics>

<deferred>
## Deferred Ideas

- Adli tatil otomatik tarih uzatması (HMK 93) — v2 gereksinimi (SURE-V2-01)
- Resmi tatil hesabı — v2 gereksinimi (SURE-V2-02)
- Dashboard'dan doğrudan süre ekleme — kasıtlı olarak reddedildi (D-06)

</deferred>

---

*Phase: 04-deadline-engine-dashboard*
*Context gathered: 2026-04-12*
