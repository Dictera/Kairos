# Requirements: Sigorta Uyuşmazlık Takip

**Defined:** 2026-05-07
**Core Value:** Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.

## v1.3 Requirements

Requirements for GitHub Open Source release.

### Güvenlik & Temizlik

- [ ] **GUVENLIK-01**: `scripts/docx-pipeline/.venv/` üst `.gitignore`'a eklenir
- [ ] **GUVENLIK-02**: `data/.gitkeep` oluşturulur; `data/` dizini git'te izlenir (`.sqlite*` dosyaları hariç)
- [ ] **GUVENLIK-03**: `git log --all -S "password|secret|token"` taraması yapılır ve temiz olduğu doğrulanır
- [ ] **GUVENLIK-04**: `.env.example` oluşturulur — gerçek değerler olmadan tüm env key'leri belgeler
- [ ] **GUVENLIK-05**: `uploads/` klasörünün `.gitignore`'da olduğu doğrulanır (zaten var, onay yeterli)
- [ ] **GUVENLIK-06**: `.planning/` klasörü kişisel bilgi içeriyor mu gözden geçirilir; kişisel detay varsa kaldırılır
- [ ] **GUVENLIK-07**: `.planning/` (debug, intel, research, seeds, phases vb.) `.gitignore`'a eklenir; sadece `quick/` değil tamamı

### Dokümantasyon

- [ ] **DOKUM-01**: MIT `LICENSE` dosyası root'a eklenir (yıl: 2026, sahip: kullanıcı adı)
- [ ] **DOKUM-02**: Türkçe `README.md` yazılır — proje tanımı, özellikler listesi, kurulum adımları (`.env.example` referansı), Python venv + requirements kurulumu, LibreOffice gereksinimi
- [ ] **DOKUM-03**: README'ye yeni DB kurulumu açıklanır — `npx drizzle-kit migrate` ile sıfırdan schema nasıl oluşturulur

### GitHub Repo

- [ ] **GITHUB-01**: GitHub'da private repo oluşturulur, `git remote add origin` + `git push` yapılır
- [ ] **GITHUB-02**: `npm run build` ve `npm test` geçtiği doğrulanır (CI simülasyonu)
- [ ] **GITHUB-03**: Repo public yapılır (Settings → Change visibility → Public)
- [ ] **GITHUB-04**: `v0.1` git tag oluşturulur ve push edilir; GitHub Release notu yazılır
- [ ] **GITHUB-05**: Repo topics (`nextjs`, `sqlite`, `trpc`, `sigorta`, `hukuk`, `turkce`) ve description eklenir

### Kalite

- [ ] **KALITE-01**: `.github/workflows/ci.yml` oluşturulur — `npm run build` + `npm test` her push'ta otomatik çalışır
- [ ] **KALITE-02**: `.github/dependabot.yml` oluşturulur — npm bağımlılık güncellemeleri için haftalık otomatik PR
- [ ] **KALITE-03**: `.github/ISSUE_TEMPLATE/` — bug report + feature request şablonları eklenir

## Future Requirements

### Quick Actions & Template Improvements (v1.4)

- **QUICK-01**: Belge tabında isimli quick-action butonları (ör. "İhtarname Üret")
- **QUICK-02**: Dry-run önizleme — üretmeden önce değişkenleri göster
- **QUICK-03**: Toplu çoklu şablon üretimi
- **QUICK-04**: Fuzzy-match yazım uyarıları
- **QUICK-05**: Üretim geçmişi
- **ADV-01**: Deterministik PDF render (metadata strip)
- **ADV-02**: Şablon sürümleme/diff/rollback

## Out of Scope

| Feature | Reason |
|---------|--------|
| İngilizce README | Hedef kitle Türk hukuk profesyonelleri |
| Docker / containerization | Lokal kurulum yeterli; karmaşıklık artırır |
| Otomatik DB migration CI'da | Test DB setup karmaşıklığı → manuel adım yeterli |
| master → main branch rename | Mevcut workflow'ı bozmamak için |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GUVENLIK-01 | Phase 21 | Pending |
| GUVENLIK-02 | Phase 21 | Pending |
| GUVENLIK-03 | Phase 21 | Pending |
| GUVENLIK-04 | Phase 21 | Pending |
| GUVENLIK-05 | Phase 21 | Pending |
| GUVENLIK-06 | Phase 21 | Pending |
| GUVENLIK-07 | Phase 21 | Pending |
| DOKUM-01 | Phase 22 | Pending |
| DOKUM-02 | Phase 22 | Pending |
| DOKUM-03 | Phase 22 | Pending |
| GITHUB-01 | Phase 23 | Pending |
| GITHUB-02 | Phase 23 | Pending |
| GITHUB-03 | Phase 23 | Pending |
| GITHUB-04 | Phase 23 | Pending |
| GITHUB-05 | Phase 23 | Pending |
| KALITE-01 | Phase 24 | Pending |
| KALITE-02 | Phase 24 | Pending |
| KALITE-03 | Phase 24 | Pending |

**Coverage:**
- v1.3 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-07*
*Last updated: 2026-05-07 after initial definition*
