# Roadmap: Sigorta Uyuşmazlık Takip

## Milestones

- ✅ **v1.0 MVP** — Phases 1–9 (shipped 2026-04-13)
- ✅ **v1.1 Temizlik ve İyileştirme** — Phases 10–14 (shipped 2026-04-17)
- ✅ **v1.2 Şablon Belgeler** — Phases 15–20 (shipped 2026-04-22)
- 🔄 **v1.3 GitHub Open Source Yol Haritası** — Phases 21–24 (in progress)

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

### v1.3 GitHub Open Source Yol Haritası (Phases 21–24)

- [ ] **Phase 21: Güvenlik & Temizlik** — Repo'yu yayına hazırla: .gitignore tamamla, hassas veri tarama, .env.example
- [ ] **Phase 22: Dokümantasyon** — MIT LICENSE + Türkçe README.md, kurulum talimatları, DB kurulum adımı
- [ ] **Phase 23: GitHub Repo Yayını** — Private repo oluştur, push, public yap, v0.1 tag + release
- [ ] **Phase 24: Kalite & CI** — GitHub Actions CI, Dependabot, Issue templates

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
  5. README'de `npx drizzle-kit migrate` ile sıfır DB'den schema oluşturma adımı açıklanıyor
**Plans**: TBD

### Phase 23: GitHub Repo Yayını
**Goal**: Proje GitHub'da public olarak erişilebilir durumda, v0.1 release tag'i yayında
**Depends on**: Phase 21 (güvenlik temizliği tamamlanmadan publish yapılamaz)
**Requirements**: GITHUB-01, GITHUB-02, GITHUB-03, GITHUB-04, GITHUB-05
**Success Criteria** (what must be TRUE):
  1. GitHub'da private repo oluşturuldu, `git remote add origin` + `git push` başarılı (MANUEL: tarayıcı + terminal)
  2. `npm run build` ve `npm test` lokal ortamda temiz geçiyor (CI simülasyonu doğrulandı)
  3. Repo Settings'ten "Change visibility → Public" yapıldı; URL herkese açık (MANUEL: tarayıcı)
  4. `v0.1` git tag oluşturulup push edildi; GitHub Release sayfasında release notu mevcut (MANUEL: tarayıcı veya `gh` CLI)
  5. Repo topics (`nextjs`, `sqlite`, `trpc`, `sigorta`, `hukuk`, `turkce`) ve description eklendi (MANUEL: tarayıcı)
**Plans**: TBD

### Phase 24: Kalite & CI
**Goal**: Her push'ta otomatik build + test çalışıyor; bağımlılık güncellemeleri otomatik PR açıyor; katkıda bulunanlar için issue şablonları hazır
**Depends on**: Phase 23 (CI workflow'ları GitHub repo mevcut olunca test edilebilir)
**Requirements**: KALITE-01, KALITE-02, KALITE-03
**Success Criteria** (what must be TRUE):
  1. `.github/workflows/ci.yml` mevcut; GitHub Actions'da her push'ta `npm run build` + `npm test` otomatik tetikleniyor
  2. `.github/dependabot.yml` mevcut; npm bağımlılıkları için haftalık otomatik PR açılıyor
  3. `.github/ISSUE_TEMPLATE/` altında bug-report ve feature-request şablonları mevcut; GitHub Issues'da "New issue" açınca şablon seçimi görünüyor
**Plans**: TBD

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
| 21. Güvenlik & Temizlik | v1.3 | 0/TBD | Not started | - |
| 22. Dokümantasyon | v1.3 | 0/TBD | Not started | - |
| 23. GitHub Repo Yayını | v1.3 | 0/TBD | Not started | - |
| 24. Kalite & CI | v1.3 | 0/TBD | Not started | - |

---

*Roadmap created: 2026-04-13*
*Last updated: 2026-05-07 — v1.3 GitHub Open Source Yol Haritası added (4 phases, 18 requirements)*
