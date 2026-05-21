# Roadmap: Sigorta Uyuşmazlık Takip

## Milestones

- ✅ **v1.0 MVP** — Phases 1–9 (shipped 2026-04-13)
- ✅ **v1.1 Temizlik ve İyileştirme** — Phases 10–14 (shipped 2026-04-17)
- ✅ **v1.2 Şablon Belgeler** — Phases 15–20 (shipped 2026-04-22)
- 🔄 **v1.3 GitHub Open Source Yol Haritası** — Phases 21–26 (in progress)

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

<details>
<summary>✅ v1.2 Şablon Belgeler (Phases 15–20) — SHIPPED 2026-04-22</summary>

- [x] Phase 15: Pipeline Temeli (2/2 plans) — Python sidecar, tRPC pipeline router, HealthBanner, PipelineStatus
- [x] Phase 16: Şablon Şeması ve CRUD (5/5 plans) — docx_sablon table, extract-vars, upload route, sablonRouter
- [x] Phase 17: PDF Üretim Motoru (4/4 plans) — Jinja2 TR filters, docxtpl render, LibreOffice convert, variable registry
- [x] Phase 18: Arşiv ve Belge Entegrasyonu (3/3 plans) — belge_turu, slug command, transactional archive
- [x] Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı (3/3 plans) — SablondanUret, VariableCatalogModal, CheatSheetPage
- [x] Phase 20: Eski Sistemler Temizliği (4/4 plans) — Report migration to pdfmake, Tiptap/ODT deletion, retirement modal, DROP legacy tables

</details>

### v1.3 GitHub Open Source Yol Haritası (Phases 21–25)

- [ ] **Phase 21: Güvenlik & Temizlik** — Repo'yu yayına hazırla: .gitignore tamamla, hassas veri tarama, .env.example
  **Plans**: 2 plans
  - [ ] 21-01-PLAN.md — .gitignore update, .env.example verify, .planning/ untrack
  - [ ] 21-02-PLAN.md — git log -S scan, data/.gitkeep verify, personal info review
- [x] **Phase 22: Dokümantasyon** — MIT LICENSE + Türkçe README.md, kurulum talimatları, DB kurulum adımı (2026-05-16)
  **Plans**: 2/2 plans
  - [x] 22-01-PLAN.md — LICENSE oluştur + README.md Türkçe başlıklar ve 9 adımlı kurulum
  - [x] 22-02-PLAN.md — docs/ tutarlılık gözden geçirme (GETTING-STARTED.md, CONFIGURATION.md ve diğerleri)
- [ ] **Phase 23: GitHub Repo Yayını** — Private repo oluştur, push, public yap, v0.1 tag + release
  **Plans**: 2 plans
  - [ ] 23-01-PLAN.md — Phase 21 güvenlik doğrulaması + package.json rename + build/test gate
  - [ ] 23-02-PLAN.md — GitHub repo oluşturma + push + public yap + v0.1 release + topics
- [x] **Phase 24: Kalite & CI** — GitHub Actions CI, Dependabot, Issue templates (completed 2026-05-16)
  **Plans**: 2 plans
  - [x] 24-01-PLAN.md — CI workflow (ci.yml) + Dependabot (dependabot.yml)
  - [x] 24-02-PLAN.md — Issue templates (bug_report.md + feature_request.md)
- [ ] **Phase 25: Telegram Bildirim Servisi** — Bildirimler için tek taraflı Telegram bot entegrasyonu
  **Plans**: 5 plans
  - [ ] 25-00-PLAN.md — Test scaffold (TEL-01..TEL-09 stubs) + pnpm add node-cron
  - [ ] 25-01-PLAN.md — lib/schema.ts bildirim + telegram_sent_at migration + lib/telegram/send.ts
  - [ ] 25-02-PLAN.md — lib/telegram/notify.ts + lib/telegram/cron.ts + instrumentation.ts
  - [ ] 25-03-PLAN.md — lib/trpc/routers/telegram.ts + _app.ts registration
  - [ ] 25-04-PLAN.md — components/telegram-bildirim-section.tsx + ayarlar-page.tsx mount + .env.example
- [ ] **Phase 26: Bildirim Sisteminin İyileştirilmesi** — Mevcut bildirim sisteminin kapsamlı iyileştirilmesi
  **Plans**: 4 plans
  **Wave 0**
  - [x] 26-00-PLAN.md — Test scaffold (BLD-01..BLD-08 stubs)
  **Wave 1** *(blocked on Wave 0 completion)*
  - [ ] 26-01-PLAN.md — settings-helper.ts + notify.ts grouped messages + weekly.ts formalize
  **Wave 2** *(blocked on Wave 1 completion)*
  - [ ] 26-02-PLAN.md — telegram.ts router getToggles + updateToggles procedures
  **Wave 3** *(blocked on Wave 2 completion)*
  - [ ] 26-03-PLAN.md — TelegramBildirimSection 3 Switch toggles + human verify
  **Cross-cutting constraints:**
  - `?? true` defaults required for all 3 toggle keys (never `|| true`)
  - `telegram_sent_at` NOT updated for rows skipped due to disabled toggle
  - No emoji in any Telegram message output

## Phase Details

### Phase 21: Güvenlik & Temizlik
**Goal**: Repo public yayına hazır — hassas veri yok, .gitignore eksiksiz, örnek env dosyası mevcut
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: GUVENLIK-01, GUVENLIK-02, GUVENLIK-03, GUVENLIK-04, GUVENLIK-05, GUVENLIK-06, GUVENLIK-07
**Success Criteria** (what must be TRUE):
  1. `.gitignore` dosyasına `scripts/docx-pipeline/.venv/` ve `.planning/` (tamamı) eklendi; `git status` bu dizinleri untracked göstermiyor
  2. `data/` dizini `.gitkeep` ile git'te izleniyor; `data/*.sqlite` ve `data/*.sqlite-*` dosyaları tracked değil
  3. `git log --all -S "password|secret|token"` komutu sıfır eşleşme döndürüyor
  4. `.env.example` root'ta mevcut; tüm required env key'leri içeriyor, gerçek değer yok
  5. `uploads/` klasörünün `.gitignore`'da zaten mevcut olduğu doğrulandı (onay kaydedildi)
**Plans**: TBD

### Phase 22: Dokümantasyon
**Goal**: Projeyi sıfırdan kurmak isteyen herkes README.md'yi okuyarak kurulumu tamamlayabiliyor
**Depends on**: Phase 21 (paralel çalışabilir — kod değişikliği gerektirmez)
**Requirements**: DOKUM-01, DOKUM-02, DOKUM-03
**Success Criteria** (what must be TRUE):
  1. `LICENSE` dosyası root'ta mevcut; MIT lisansı, yıl 2026, sahip adı doğru
  2. `README.md` mevcut; proje tanımı, özellikler listesi, `.env.example` referanslı kurulum adımları içeriyor
  3. README'de Python `.venv` oluşturma ve `pip install -r requirements.txt` adımları açıkça yazılı
  4. README'de LibreOffice gereksinimi ve kurulum notu mevcut
  5. README'de `pnpm run db:migrate` ile sıfır DB'den schema oluşturma adımı açıklanıyor
**Plans**: 2 plans

### Phase 23: GitHub Repo Yayını
**Goal**: Proje GitHub'da public olarak erişilebilir durumda, v0.1 release tag'i yayında
**Depends on**: Phase 21 (güvenlik temizliği tamamlanmadan publish yapılamaz)
**Requirements**: GITHUB-01, GITHUB-02, GITHUB-03, GITHUB-04, GITHUB-05
**Success Criteria** (what must be TRUE):
  1. GitHub'da private repo oluşturuldu, `git remote add origin` + `git push` başarılı (MANUEL: tarayıcı + terminal)
  2. `pnpm run build` ve `pnpm test` lokal ortamda temiz geçiyor (CI simülasyonu doğrulandı)
  3. Repo Settings'ten "Change visibility → Public" yapıldı; URL herkese açık (MANUEL: tarayıcı)
  4. `v0.1` git tag oluşturulup push edildi; GitHub Release sayfasında release notu mevcut (`gh release create` ile)
  5. Repo topics (`nextjs`, `sqlite`, `trpc`, `sigorta`, `hukuk`, `turkce`) ve description eklendi
**Plans**: 2 plans

### Phase 24: Kalite & CI
**Goal**: Her push'ta otomatik build + test çalışıyor; bağımlılık güncellemeleri otomatik PR açıyor; katkıda bulunanlar için issue şablonları hazır
**Depends on**: Phase 23 (CI workflow'ları GitHub repo mevcut olunca test edilebilir)
**Requirements**: KALITE-01, KALITE-02, KALITE-03
**Success Criteria** (what must be TRUE):
  1. `.github/workflows/ci.yml` mevcut; GitHub Actions'da her push'ta `pnpm run build` + `pnpm test` otomatik tetikleniyor
  2. `.github/dependabot.yml` mevcut; npm + pip + github-actions bağımlılıkları için haftalık otomatik PR açılıyor
  3. `.github/ISSUE_TEMPLATE/` altında bug-report ve feature-request şablonları mevcut; GitHub Issues'da "New issue" açınca şablon seçimi görünüyor
**Plans**: 2 plans

### Phase 25: Telegram Bildirim Servisi
**Goal**: Yaklaşan duruşma ve süre olayları için Telegram bot üzerinden tek taraflı push bildirimleri — startup + günlük cron (09:00, 15:00) ile çalışır, Ayarlar UI'dan yönetilir
**Depends on**: Nothing (bağımsız servis katmanı)
**Requirements**: TEL-01, TEL-02, TEL-03, TEL-04, TEL-05, TEL-06, TEL-07, TEL-08, TEL-09
**Success Criteria** (what must be TRUE):
  1. `bildirim` tablosunda `telegram_sent_at TEXT` nullable kolonu var; migration uygulandı
  2. Node.js server başladığında `instrumentation.ts` → `lib/telegram/cron.ts` yüklenir, startup sync çalışır
  3. Günlük cron 09:00 + 15:00'de (Europe/Istanbul) sadece `telegram_sent_at IS NULL AND tarih IN (today, tomorrow)` olan satırları Telegram'a gönderir
  4. Başarılı gönderim sonrası `telegram_sent_at` güncellenir — aynı bildirim bir daha gönderilmez
  5. Ayarlar > Sistem tab'ında "Telegram Bildirimleri" Card var; saat ekle/kaldır çalışıyor, hot-reload anında devreye giriyor
  6. BOT_TOKEN veya CHAT_ID yoksa uygulama sessizce çalışmaya devam eder (no crash, no error page)
  7. `.env.example`'da `TELEGRAM_BOT_TOKEN=` ve `TELEGRAM_CHAT_ID=` boş placeholder'ları var
**Plans**: 5 plans

### Phase 26: Bildirim Sisteminin İyileştirilmesi
**Goal**: Kategori bazlı toggle, gruplu günlük mesaj ve genişletilmiş haftalık özet ile bildirim sistemi tamamlanır
**Depends on**: Phase 25 (Telegram bildirim servisi üzerine inşa edilir)
**Plans**: 4 plans

## Progress Table

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 5/5 | Complete | 2026-04-13 |
| 2. Core Case Management | v1.0 | 4/4 | Complete | 2026-04-13 |
| 3. STK & Mahkeme Process Tracking | v1.0 | 3/3 | Complete | 2026-04-13 |
| 4. Deadline Engine + Dashboard | v1.0 | 4/4 | Complete | 2026-04-13 |
| 5. Calendar View | v1.0 | 2/2 | Complete | 2026-04-13 |
| 6. Documents + Finance | v1.0 | 4/4 | Complete | 2026-04-13 |
| 7. Petition Templates + PDF + Reports | v1.0 | 4/4 | Complete | 2026-04-13 |
| 8. UI Renewal | v1.0 | 3/3 | Complete | 2026-04-13 |
| 9. Calendar Standardization | v1.0 | 2/2 | Complete | 2026-04-13 |
| 10. Schema & Migration Foundation | v1.1 | 3/3 | Complete | 2026-04-14 |
| 11. Müvekkil Email Removal | v1.1 | 2/2 | Complete | 2026-04-14 |
| 12. Taraf Tab Driver Info UI | v1.1 | 1/1 | Complete | 2026-04-14 |
| 13. Tab Cleanup & UI/UX | v1.1 | 4/4 | Complete | 2026-04-14 |
| 14. Ayarlar Sigorta/Avukat | v1.1 | 5/5 | Complete | 2026-04-17 |
| 15. Pipeline Temeli | v1.2 | 2/2 | Complete | 2026-04-20 |
| 16. Şablon Şeması ve CRUD | v1.2 | 5/5 | Complete | 2026-04-21 |
| 17. PDF Üretim Motoru | v1.2 | 4/4 | Complete | 2026-04-21 |
| 18. Arşiv ve Belge Entegrasyonu | v1.2 | 3/3 | Complete | 2026-04-21 |
| 19. Belgeler UI ve Şablon Yönetimi Ekranı | v1.2 | 3/3 | Complete | 2026-04-22 |
| 20. Eski Sistemler Temizliği | v1.2 | 4/4 | Complete | 2026-04-22 |
| 21. Güvenlik & Temizlik | v1.3 | 0/2 | Not started | - |
| 22. Dokümantasyon | v1.3 | 2/2 | Complete | 2026-05-16 |
| 23. GitHub Repo Yayını | v1.3 | 0/2 | Not started | - |
| 24. Kalite & CI | v1.3 | 2/2 | Complete   | 2026-05-16 |
| 25. Telegram Bildirim Servisi | v1.3 | 0/5 | Not started | - |
| 26. Bildirim Sisteminin İyileştirilmesi | v1.3 | 1/4 | In Progress|  |

---

*Roadmap created: 2026-04-13*
*Last updated: 2026-05-19 — Phase 26 added: bildirim sisteminin iyileştirilmesi*
