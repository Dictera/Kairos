# Roadmap: Sigorta Uyuşmazlık Takip

## Milestones

- ✅ **v1.0 MVP** — Phases 1–9 (shipped 2026-04-13)
- ✅ **v1.1 Temizlik ve İyileştirme** — Phases 10–14 (shipped 2026-04-17)
- 🚧 **v1.2 Şablon Belgeler** — Phases 15–20 (started 2026-04-20)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–9) — SHIPPED 2026-04-13</summary>

- [x] Phase 1: Foundation (5/5 plans) — Next.js, SQLite, tRPC, auth, shadcn scaffold
- [x] Phase 2: Core Case Management (4/4 plans) — Müvekkil + Dosya CRUD, 6-tab shell
- [x] Phase 3: STK & Mahkeme Process Tracking (3/3 plans) — SurecStepper, data forms, duruşma CRUD
- [x] Phase 4: Deadline Engine + Dashboard (4/4 plans) — Pure deadline calc, sure CRUD, dashboard widgets
- [x] Phase 5: Calendar View (2/2 plans) — Monthly grid, event badges, popover links
- [x] Phase 6: Documents + Finance (4/4 plans) — Belge upload/download, finans CRUD, net balance
- [x] Phase 7: Petition Templates + PDF + Reports (4/4 plans) — Tiptap editor, variable substitution, Arial TTF PDF, Excel/PDF reports
- [x] Phase 8: UI Renewal (3/3 plans) — Navy + Turuncu palette, sidebar, component refresh
- [x] Phase 9: Calendar Standardization (2/2 plans) — Shared DatePickerField, Turkish locale

</details>

<details>
<summary>✅ v1.1 Temizlik ve İyileştirme (Phases 10–14) — SHIPPED 2026-04-17</summary>

- [x] Phase 10: Schema & Migration Foundation (3/3 plans) — 5 driver cols on taraf, email drop, phone regex
- [x] Phase 11: Müvekkil Email Removal (2/2 plans) — Drizzle meta regenerated, schema test added
- [x] Phase 12: Taraf Tab Driver Info UI (1/1 plan) — "Diğer Sürücü Bilgileri" Card, form + view mode
- [x] Phase 13: Tab Cleanup & UI/UX (4/4 plans) — Notes CRUD, Activity Timeline, new dosya/muvekkil fields, IBAN, expanded belge categories
- [x] Phase 14: Ayarlar Sigorta/Avukat (5/5 plans) — Avukat entity, sigorta şirketi extended fields, cascading avukat select on taraf

</details>

### 🚧 v1.2 Şablon Belgeler (Phases 15–20)

- [ ] **Phase 15: Pipeline Temeli** — Python sidecar kurulumu, execa IPC, LibreOffice path detect, sağlık kontrolü banner
- [x] **Phase 16: Şablon Şeması ve CRUD** — `docx_sablon` tablosu, `.docx` upload, değişken otomatik çıkarım, şablon listesi
- [x] **Phase 17: PDF Üretim Motoru** — docxtpl render, TR filtreler, LibreOffice headless convert, tenacity retry, missing-var pre-check
- [x] **Phase 18: Arşiv ve Belge Entegrasyonu** — Slug+seq dosya adı, yıl/ay/kategori klasörü, `belge` transactional insert, rollback
- [x] **Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı** — Belgeler tab "Şablondan Üret" butonu, şablon yönetimi sayfası, değişken cheat-sheet, variable registry
- [ ] **Phase 20: Eski Sistemler Temizliği** — Tiptap `dilekce` + `.odt` routers/routes/tablolar/dosyalar/bağımlılıklar silinir

## Phase Details

### Phase 15: Pipeline Temeli
**Goal**: Python sidecar + LibreOffice headless binaries uygulamadan güvenilir şekilde çağrılabilir hale gelir; yapılandırma eksikse kullanıcı anında görür.
**Depends on**: Nothing (v1.2 foundation — builds on existing v1.1 Next.js/Drizzle app)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07
**Success Criteria** (what must be TRUE):
  1. Kullanıcı `.env` içinde `PYTHON_PATH` ve `LIBREOFFICE_PATH` ayarlayabilir; `LIBREOFFICE_PATH` boşken sistem default konumu otomatik algılanır
  2. Uygulama her sayfada, Python ya da LibreOffice erişilemezse Türkçe uyarı banner'ı gösterir
  3. Kullanıcı Ayarlar > Pipeline Durumu kartında LibreOffice ve Python sürüm bilgisi ile erişilebilirlik durumunu görür
  4. Node, Python sidecar'ını (`./scripts/docx-pipeline/` venv) `execa` üzerinden çağırır; JSON stdin / JSON stdout / JSONL stderr protokolü çalışır
  5. Sidecar sabit exit kodlarıyla (0=başarı, 1=validation, 2=render, 3=convert, 4=archive) döner ve tRPC bunları Türkçe hata mesajlarına çevirir
**Plans**: 2 plans
- [x] 15-01-PLAN.md — Python sidecar + TypeScript infrastructure (config, protocol, error codes, health check, execa bridge, tRPC router)
- [ ] 15-02-PLAN.md — Pipeline UI (health banner, status card, layout and settings integration)

### Phase 16: Şablon Şeması ve CRUD
**Goal**: Kullanıcı `.docx` şablonlarını kategori ile yükleyebilir, listeler, siler ve değiştirebilir; değişkenler otomatik çıkarılıp şablon kaydında saklanır.
**Depends on**: Phase 15 (sidecar'ın extract-vars modu gerekir)
**Requirements**: SABLON-01, SABLON-02, SABLON-03, SABLON-04, SABLON-05, SABLON-06, SABLON-07, SABLON-08
**Success Criteria** (what must be TRUE):
  1. Kullanıcı ad + zorunlu kategori (STK / Mahkeme / Genel) girip `.docx` yükleyebilir; başka formatlar reddedilir
  2. Yükleme sırasında `{{ degisken }}` ve `{%p paragraf %}` placeholder'ları otomatik çıkarılıp şablon kaydına JSON olarak işlenir
  3. Kullanıcı yüklediği şablonların listesini kategori + ad ile görür; mevcut şablonu silebilir veya yeniden yükleyerek (overwrite) güncelleyebilir
  4. `docx_sablon` tablosu Drizzle schema'ya eklenir (id, ad, kategori NOT NULL CHECK, dosya_yolu, degiskenler JSON, default_aksiyon nullable, timestamps)
  5. `belge` tablosuna nullable `sablon_id` FK alanı eklenir (şablon silindiğinde SET NULL) ve üretilmiş PDF'ler etkilenmez
**Plans**: 5 plans
- [ ] 16-01-PLAN.md — Schema + migration + Zod validators (docx_sablon table, belge.sablon_id FK)
- [ ] 16-02-PLAN.md — Python sidecar handle_extract_vars implementation + test fixture
- [ ] 16-03-PLAN.md — /api/templates/upload multipart route (.docx-only, 10 MB cap, path-traversal guard)
- [ ] 16-04-PLAN.md — sablonRouter (list/create/delete/update) + appRouter registration
- [ ] 16-05-PLAN.md — Şablon Yönetimi UI section + Ayarlar page mount + checkpoint
**UI hint**: yes

### Phase 17: PDF Üretim Motoru
**Goal**: Kullanıcı bir dosya + şablon seçtiğinde, dosya detayındaki tüm veri ile Türkçe-doğru doldurulmuş bir PDF üretilir; hatalar erkenden ve anlaşılır şekilde raporlanır.
**Depends on**: Phase 15 (sidecar) + Phase 16 (şablon + değişken listesi)
**Requirements**: PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, PDF-07, PDF-08, PDF-09, PDF-10
**Success Criteria** (what must be TRUE):
  1. Kullanıcı dosya detayındayken bir şablon seçip "Üret" butonuyla PDF üretebilir; dosyanın tüm verisi (müvekkil, taraflar, sürücü, STK/mahkeme süreç, duruşmalar, süre, finans, notlar) Jinja2 context'ine beslenir
  2. `tr_currency`, `tarih`, `upper_tr`, `lower_tr` filtreleri Türkçe karakter + Babel `tr_TR` locale ile doğru sonuç üretir; Jinja2 koşullu bloklar (`{% if %}`, `{% for %}`, `{%p %}`, `{%tr %}`, `{%tc %}`) docxtpl üzerinden çalışır
  3. Python sidecar docxtpl ile şablonu doldurur; LibreOffice headless (`soffice --headless --convert-to pdf`) ile PDF üretir; her çağrıya `-env:UserInstallation=file:///TEMP/lo-{uuid}` eklenir ve çağrı sonunda temp profil silinir
  4. LibreOffice timeout (varsayılan 120 sn) aşılırsa `tenacity` ile 3 denemeye kadar exponential backoff ile yeniden denenir; deterministic hatalarda (missing binary, docxtpl render) retry yapılmaz
  5. Eksik değişken varsa üretim başlamadan client-side pre-check hata verir ve eksik alanın bulunduğu sekmeye deep-link gösterir (örn. "Mahkeme esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin")
**Plans**: 4 plans
- [x] 17-01-PLAN.md — Python sidecar render & convert (filters.py, convert.py, handle_render/handle_convert)
- [x] 17-02-PLAN.md — TypeScript protocol extension + variable registry with tab mapping
- [x] 17-03-PLAN.md — pdfRouter + Jinja2 context builder + missing-variable pre-check
- [ ] 17-04-PLAN.md — Integration test: canary template with Turkish chars end-to-end

### Phase 18: Arşiv ve Belge Entegrasyonu
**Goal**: Üretilen her PDF kalıcı ve tahmin edilebilir bir yola yazılır ve aynı anda `belge` tablosuna işlenir; iki yazım işlemi atomic olur.
**Depends on**: Phase 17 (PDF üretimi olmadan arşive girdi yok)
**Requirements**: ARSIV-01, ARSIV-02, ARSIV-03, ARSIV-04, ARSIV-05, ARSIV-06
**Success Criteria** (what must be TRUE):
  1. Üretilen PDF `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` dizinine yazılır (gerekli klasörler otomatik oluşur)
  2. Dosya adı `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` formatında üretilir; plaka yoksa segment atlanır; slug'lar `python-slugify` ile ASCII-safe ve Türkçe karakter normalize edilmiş olur
  3. `seq` numarası aynı dosyada aynı şablondan daha önce üretilen PDF sayısı +1 olacak şekilde DB transaction içinde hesaplanır; çift tıklamada race condition oluşmaz
  4. Üretim sonunda `belge` tablosuna kayıt eklenir (dosya_id, kategori="Üretilen Belge", file_path, sablon_id) ve olay_gunlugu satırı yazılır; PDF yazımı ve DB insert atomik çalışır
  5. DB insert başarısız olursa yazılmış PDF diskten silinir (rollback); DB'de dangling bir `belge` satırı kalmaz
**Plans**: 3 plans
- [x] 18-01-PLAN.md — Schema migration, sidecar slug command, and sablon router belge_turu support
- [ ] 18-02-PLAN.md — Archive module with compensating transaction and unit tests
- [ ] 18-03-PLAN.md — pdfRouter archive integration and template UI belge_turu dropdown

### Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı
**Goal**: Avukat tek tıkla dosya detayından şablondan PDF üretebilir; şablonlarını ayrı bir yönetim ekranında yönetir; hangi değişkenlerin var olduğunu cheat-sheet ile öğrenir.
**Depends on**: Phase 18 (üretim + arşiv çalışıyor olmalı ki UI anlamlı olsun)
**Requirements**: BUI-01, BUI-02, BUI-03, BUI-04, BUI-05, BUI-06, BUI-07, BUI-08, BUI-09
**Success Criteria** (what must be TRUE):
  1. Dosya detayı Belgeler sekmesinde kategori bazlı gruplanmış şablon seçici dropdown + "Şablondan Üret" butonu vardır; üretim sırasında Türkçe durum mesajlı spinner gösterilir ("Şablon dolduruluyor…", "PDF oluşturuluyor…")
  2. Üretim başarılı olunca Belgeler listesi yenilenir; üretilmiş PDF satırları şablon adını ve seq numarasını göstererek üstte görünür
  3. Ayarlar > Şablon Yönetimi ekranı şablon listesini, yükleme formunu ve sil/değiştir aksiyonlarını barındırır
  4. Şablon detayı, çıkarılmış değişkenleri bilinen sistem alanlarıyla eşleştirir; her değişkenin "✓ Bilinen" veya "⚠ Bilinmeyen" rozeti vardır
  5. Variable registry (`lib/docx/variable-registry.ts`) tüm desteklenen değişkenleri TypeScript const olarak tanımlar ve Ayarlar > Yardım > "Değişken Listesi" sayfası bu registry'den otomatik üretilen TR açıklamalı cheat-sheet'i gösterir
**Plans**: 3 plans
- [ ] 19-01-PLAN.md — Belgeler tab SablondanUret flow + progress modal + BelgeList generated-PDF styling (BUI-01..BUI-05)
- [ ] 19-02-PLAN.md — VariableCatalogModal + SablonYonetimiSection row click (BUI-06, BUI-07, BUI-09)
- [ ] 19-03-PLAN.md — Cheat-sheet page + summary card + Ayarlar mount (BUI-08, BUI-09)
**UI hint**: yes

### Phase 20: Eski Sistemler Temizliği
**Goal**: Tiptap tabanlı `dilekce` ve `.odt` tabanlı `dilekce-odt` pipeline'ları — router, route, API, servis, tablo, yüklenmiş dosyalar, navigasyon ve artık kullanılmayan npm bağımlılıkları dahil — sistemden kalıcı olarak kaldırılır.
**Depends on**: Phase 19 (yeni pipeline UI dahil uçtan uca doğrulanmadan eski sistemler silinmez — rollback yolu açık kalsın)
**Requirements**: TEMIZ-01, TEMIZ-02, TEMIZ-03, TEMIZ-04, TEMIZ-05, TEMIZ-06, TEMIZ-07, TEMIZ-08
**Success Criteria** (what must be TRUE):
  1. Kullanıcı retirement migration uygulanmadan önce "Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?" onay modal'ını görür ve onaylamadıkça işlem başlamaz
  2. `lib/trpc/routers/dilekce.ts` ve `dilekce-odt.ts` dosyaları silinir, router kayıtlarından çıkarılır; `app/(dashboard)/dilekce/` tüm route klasörü ile `app/api/dilekce/` ve `app/api/dilekce-odt/` API klasörleri silinir
  3. `lib/services/odt-to-pdf.ts`, `lib/pdf/pdf-generator.ts` ve `jspdf` + `adm-zip` + `@xmldom/xmldom` bağımlılıkları kaldırılır; `next build` stale import uyarısı olmadan yeşil geçer
  4. Drizzle migration `dilekce_sablonu` ve `dilekce_odt_sablonu` tablolarını DROP eder; `./uploads/odt-templates/` klasörü silinir
  5. Navigasyon/sidebar menüsünden "Dilekçeler" linki kaldırılmıştır; yerine "Şablon Yönetimi" linki eklenmiştir
**Plans**: 4 plans
- [ ] 20-01-PLAN.md — Report PDF migration to pdfmake + Next.js redirects + sidebar nav update
- [ ] 20-02-PLAN.md — Legacy code deletion (routers, routes, components, services, schema)
- [ ] 20-03-PLAN.md — Retirement modal + tRPC API for DB/file cleanup
- [ ] 20-04-PLAN.md — Drizzle migration + npm uninstall + final build validation
**UI hint**: yes

## Progress Table

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation | v1.0 | 5/5 | ✅ Complete | 2026-04-13 |
| 2. Core Case Management | v1.0 | 4/4 | ✅ Complete | 2026-04-13 |
| 3. STK & Mahkeme Process Tracking | v1.0 | 3/3 | ✅ Complete | 2026-04-13 |
| 4. Deadline Engine + Dashboard | v1.0 | 4/4 | ✅ Complete | 2026-04-13 |
| 5. Calendar View | v1.0 | 2/2 | ✅ Complete | 2026-04-13 |
| 6. Documents + Finance | v1.0 | 4/4 | ✅ Complete | 2026-04-13 |
| 7. Petition Templates + PDF + Reports | v1.0 | 4/4 | ✅ Complete | 2026-04-13 |
| 8. UI Renewal | v1.0 | 3/3 | ✅ Complete | 2026-04-13 |
| 9. Calendar Standardization | v1.0 | 2/2 | ✅ Complete | 2026-04-13 |
| 10. Schema & Migration Foundation | v1.1 | 3/3 | ✅ Complete | 2026-04-14 |
| 11. Müvekkil Email Removal | v1.1 | 2/2 | ✅ Complete | 2026-04-14 |
| 12. Taraf Tab Driver Info UI | v1.1 | 1/1 | ✅ Complete | 2026-04-14 |
| 13. Tab Cleanup & UI/UX | v1.1 | 4/4 | ✅ Complete | 2026-04-14 |
| 14. Ayarlar Sigorta/Avukat | v1.1 | 5/5 | ✅ Complete | 2026-04-17 |
| 15. Pipeline Temeli | v1.2 | 2/2 | ✅ Complete | 2026-04-20 |
| 16. Şablon Şeması ve CRUD | v1.2 | 5/5 | ✅ Complete | 2026-04-21 |
| 17. PDF Üretim Motoru | v1.2 | 4/4 | ✅ Complete | 2026-04-21 |
| 18. Arşiv ve Belge Entegrasyonu | v1.2 | 3/3 | ✅ Complete | 2026-04-21 |
| 19. Belgeler UI ve Şablon Yönetimi Ekranı | v1.2 | 3/3 | ✅ Complete | 2026-04-22 |
| 20. Eski Sistemler Temizliği | v1.2 | 0/4 | 📋 Planned | - |

---

*Roadmap created: 2026-04-13*
*Last updated: 2026-04-22 — Phase 19 complete (3/3 plans), Phase 20 planned (4/4 plans)*
