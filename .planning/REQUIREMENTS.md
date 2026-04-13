# Requirements: Sigorta Uyuşmazlık Takip

**Defined:** 2026-04-13
**Core Value:** Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.

## v1.1 Requirements

Requirements for v1.1 milestone. Each maps to roadmap phases.

### Müvekkil Yönetimi

- [ ] **MUVEK-05**: Müvekkil formlarından e-posta alanı kaldırılır — veritabanında email sütunu düşürülür
- [ ] **MUVEK-06**: Müvekkil veritabanı migration'ı (drop column) çalıştırılır — mevcut veri yedeklenir öncesinde

### Dosya Tarafları

- [ ] **TARAF-06**: Sürücü bilgileri için 5 yeni alan eklenir — surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no
- [ ] **TARAF-07**: Taraf formunda "Diğer Sürücü Bilgileri" bölümü oluşturulur — yukarıdaki 5 alan ile
- [ ] **TARAF-08**: Sürücü bilgileri görüntüleme modunda gösterilir — InfoRow bileşeni ile
- [ ] **TARAF-09**: Türkçe telefon formatı doğrulaması eklenir — 05XX XXX XX XX formatı
- [ ] **TARAF-10**: Plaka formatı doğrulaması eklenir — XX XXX XX formatı

### Sekme Düzeni

- [ ] **TAB-01**: Boş "Notlar/Zaman Çizelgesi" sekmesi değerlendirilir — doldurulur veya kaldırılır (URL yönlendirmesi ile)
- [ ] **TAB-02**: Sekme içeriklerinde gerekli bölüm ekleme/çıkarma yapılır — mevcut 6 sekme korunarak

### UI/UX İyileştirmeleri

- [ ] **UIUX-01**: Dosyalar ve Müvekkiller listesi/formlarında genel UI/UX iyileştirmeleri yapılır — agent tespit edecek

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Müvekkil Yönetimi

- **MUVEK-07**: Müvekkil arama sonuçlarında filtreleme seçenekleri genişletilir

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Müvekkil e-postası koruma | Kullanıcı gereksiz olduğunu belirtti — eklenmeyecek |
| Çoklu kullanıcı desteği | Solo avukat — tek kullanıcı yeterli |
| Bulut senkronizasyonu | Offline-first — lokal SQLite |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MUVEK-05 | — | Pending |
| MUVEK-06 | — | Pending |
| TARAF-06 | — | Pending |
| TARAF-07 | — | Pending |
| TARAF-08 | — | Pending |
| TARAF-09 | — | Pending |
| TARAF-10 | — | Pending |
| TAB-01 | — | Pending |
| TAB-02 | — | Pending |
| UIUX-01 | — | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after initial definition*
