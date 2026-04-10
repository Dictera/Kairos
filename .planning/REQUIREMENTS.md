# Requirements: Sigorta Uyuşmazlık Takip

**Defined:** 2026-04-10
**Core Value:** Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.

---

## v1 Requirements

### Foundation (Altyapı)

- [x] **FOUND-01**: Next.js 15 App Router projesi oluşturulur; `serverExternalPackages: ['better-sqlite3']` yapılandırılır
- [x] **FOUND-02**: SQLite bağlantı singleton'ı WAL modu, busy_timeout ve foreign_keys pragma'ları ile kurulur
- [x] **FOUND-03**: Drizzle ORM şeması tanımlanır; `generate`+`migrate` iş akışı kurulur
- [x] **FOUND-04**: tRPC v11 `fetchRequestHandler` route handler kurulur; superjson transformer eklenir
- [x] **FOUND-05**: Env tabanlı tek kullanıcı girişi: `.env` şifresi → signed HttpOnly cookie → middleware koruması
- [ ] **FOUND-06**: shadcn/ui + Tailwind CSS v3 kurulumu ve temel layout (sidebar + header)

### Müvekkil Yönetimi

- [ ] **MUVEK-01**: Müvekkil oluşturma (ad, iletişim, TC/Vergi No, sigorta şirketi)
- [ ] **MUVEK-02**: Müvekkil listesi — arama ve filtreleme
- [ ] **MUVEK-03**: Müvekkil profil sayfası — bilgiler + bağlı dosyalar listesi
- [ ] **MUVEK-04**: Müvekkil düzenleme ve silme (silinirken ilişkili dosyalar uyarısı)

### Dosya Yönetimi

- [ ] **DOSYA-01**: Yeni dosya oluşturma: müvekkil seçimi, dosya türü (STK / Asliye Ticaret / Asliye Hukuk), sigorta türü, avukat dosya no (kullanıcı girer), talep tutarı
- [ ] **DOSYA-02**: Dosya listesi — 200+ dosyada sayfa yüklemesi < 1 saniye; filtreleme (tür, durum, tarih), arama (dosya no, müvekkil adı)
- [ ] **DOSYA-03**: Dosya detay sayfası: 6 alt sekme (Genel Bilgiler, Yargılama Süreci, Belgeler, Notlar/Zaman Çizelgesi, Karşı Taraflar, Dosya Finansı)
- [ ] **DOSYA-04**: Dosya düzenleme (tüm alanlar) ve arşivleme/silme
- [ ] **DOSYA-05**: Karşı taraf bilgileri: sigorta şirketi adı, karşı vekil, poliçe no

### STK & Mahkeme Süreç Takibi

- [ ] **SUREC-01**: STK Tahkim süreci aşamaları: BAŞVURU → KABUL → RAPORTÖR_ATANDI → RAPORTÖR_İNCELEME → HAKEM_KURULU → HAKEM_KARARI → İTİRAZ_SÜRESİ → İTİRAZ_DAVASI → KARAR_KESİNLEŞTİ
- [ ] **SUREC-02**: STK süreç veri noktaları: STK başvuru no, başvuru tarihi, kabul tarihi, raportör adı, bilirkişi, hakem karar tarihi, tebligat tarihi, karara itiraz tarihi
- [ ] **SUREC-03**: Mahkeme süreci aşamaları: DAVA_AÇILDI → TEBLİGAT → CEVAP_DİLEKÇESİ → TAHKİKAT → BİLİRKİŞİ → KARAR → İSTİNAF → KESİNLEŞTİ
- [ ] **SUREC-04**: Mahkeme süreç veri noktaları: Esas No, Karar No, mahkeme adı, dava tarihi, tebligat tarihleri, karar tarihi
- [ ] **SUREC-05**: Duruşma kaydı: tarih, saat, mahkeme/kurum, duruşma türü, notlar; dosyaya birden fazla duruşma eklenebilir

### Süre (Deadline) Takibi

- [ ] **SURE-01**: STK karara itiraz süresi otomatik hesaplama: tebligat tarihi + 10 takvim günü
- [ ] **SURE-02**: İstinaf başvuru süresi otomatik hesaplama: mahkeme karar tebligatı + 14 takvim günü
- [ ] **SURE-03**: Cevap dilekçesi süresi otomatik hesaplama: dava tebligatı + 14 takvim günü
- [ ] **SURE-04**: Manuel süre girişi: isim, tarih, dosyaya bağlı, notlar
- [ ] **SURE-05**: Adli tatil döneminde (20 Temmuz–31 Ağustos) hesaplanan sürelere uyarı gösterilir (otomatik uzatma yok, manuel kontrol gerekli)

### Dashboard & Takvim

- [ ] **DASH-01**: Ana panel: yaklaşan süreler (7 ve 14 günlük uyarı), bugünkü duruşmalar, özet istatistikler (toplam dosya, aktif dosya, bu ay açılan)
- [ ] **DASH-02**: Yaklaşan duruşma ve sürelerin renk kodlu gösterimi (kırmızı: < 3 gün, sarı: < 7 gün)
- [ ] **TAKVIM-01**: Aylık takvim görünümü — duruşma ve süre tarihleri işaretli
- [ ] **TAKVIM-02**: Takvimden duruşma detayına tıklanabilir bağlantı

### Belge Yönetimi

- [ ] **BELGE-01**: Belge yükleme: dosyaya bağlı, maks. 20 MB, PDF/DOC/DOCX/JPG/PNG desteklenir
- [ ] **BELGE-02**: Belge listesi dosya detay sayfasında; kategori (dilekçe, karar, poliçe, diğer), yükleme tarihi
- [ ] **BELGE-03**: Belgeler `public/uploads/{dosyaId}/` klasörüne kaydedilir; statik URL ile erişim (localhost only)
- [ ] **BELGE-04**: Belge silme

### Finans Takibi

- [ ] **FINANS-01**: Finans kalemi girişi: tür (Gelen/Giden/Masraf), tutar, tarih, açıklama, dosyaya bağlı
- [ ] **FINANS-02**: Gelen ödemeler: müvekkil ödemesi, icra tahsilatı, karşı taraf ödemesi
- [ ] **FINANS-03**: Giden ödemeler: müvekkile ödeme, avans
- [ ] **FINANS-04**: Masraf ve harçlar: yargılama giderleri, bilirkişi ücreti, tebligat harcı
- [ ] **FINANS-05**: Dosya bazlı finansal özet: toplam alınan, toplam ödenen, net bakiye
- [ ] **FINANS-06**: Finans dashboard: aylık/yıllık gelir-gider özeti

### Dilekçe & Şablon Sistemi

- [ ] **DILEKCE-01**: Şablon oluşturma: başlık, içerik editörü (değişken ekleme destekli), şablon türü (STK/Mahkeme)
- [ ] **DILEKCE-02**: Değişken sistemi: `{{müvekkil_adı}}`, `{{dosya_no}}`, `{{dava_no}}`, `{{stk_no}}`, `{{mahkeme}}`, `{{duruşma_tarihi}}`, `{{talep_tutarı}}`, `{{sigorta_şirketi}}` ve diğerleri
- [ ] **DILEKCE-03**: Dilekçe oluşturma akışı: şablon seç → değişkenleri otomatik doldur (dosya verilerinden) → PDF önizle → indir
- [ ] **DILEKCE-04**: Oluşturulan dilekçe dosyaya otomatik belge olarak kaydedilebilir
- [ ] **DILEKCE-05**: PDF çıktısında Türkçe karakterler (ş, ğ, ü, ö, ç, ı, İ) doğru görüntülenir

### Raporlar

- [ ] **RAPOR-01**: Portföy raporu: aktif/pasif dosya sayısı, tür ve mahkeme bazlı dağılım, süreç aşamaları özeti
- [ ] **RAPOR-02**: Finansal rapor: dönemsel (aylık/yıllık) gelir-gider, en yüksek tahsilat, bekleyen ödemeler
- [ ] **RAPOR-03**: Dosya listesi PDF/Excel dışa aktarım (filtrelenmiş görünüm dahil)

### Ayarlar

- [ ] **AYAR-01**: Sigorta şirketi tanımları listesi (ekle, düzenle, sil) — dosya oluştururken seçim için
- [ ] **AYAR-02**: Mahkeme/kurum tanımları — sık kullanılan mahkemeler için kısa liste
- [ ] **AYAR-03**: Env şifresi değiştirme kılavuzu (uygulama içi, `.env` dosyasına yönlendirme)

---

## v2 Requirements

### Bildirimler

- **NOTF-01**: Masaüstü bildirim veya sesli uyarı (yaklaşan süreler için)
- **NOTF-02**: Günlük özet e-posta (lokal SMTP)

### Gelişmiş Süre Hesaplama

- **SURE-V2-01**: Adli tatil otomatik hesaplama (HMK 93 uyarınca)
- **SURE-V2-02**: Resmi tatil hesabı

### İstinaf / Temyiz Modülü

- **ISTINAF-01**: Özel BAM ve Yargıtay aşama takibi

### Excel Import

- **IMPORT-01**: Mevcut Excel dosyalarından toplu veri aktarımı

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Çok kullanıcılı erişim / rol bazlı yetkilendirme | Solo avukat — tek kullanıcı yeterli |
| Bulut senkronizasyonu | Offline-first prensip; lokal SQLite |
| Mobil uygulama | Web-first; masaüstü tarayıcı |
| UYAP otomatik senkronizasyon | Kapalı API; desteklenmiyor |
| OAuth / sosyal giriş | Env şifresi yeterli |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01–06 | Phase 1 | Pending |
| MUVEK-01–04 | Phase 2 | Pending |
| DOSYA-01–05 | Phase 2 | Pending |
| SUREC-01–05 | Phase 3 | Pending |
| SURE-01–05 | Phase 4 | Pending |
| DASH-01–02 | Phase 4 | Pending |
| TAKVIM-01–02 | Phase 5 | Pending |
| BELGE-01–04 | Phase 6 | Pending |
| FINANS-01–06 | Phase 6 | Pending |
| DILEKCE-01–05 | Phase 7 | Pending |
| RAPOR-01–03 | Phase 7 | Pending |
| AYAR-01–03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after initial definition*
