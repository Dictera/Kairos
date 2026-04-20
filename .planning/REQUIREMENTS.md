# Requirements: Sigorta Uyuşmazlık Takip — v1.2 Şablon Belgeler

**Defined:** 2026-04-20
**Core Value:** Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.
**Milestone Goal:** Avukatın kendi `.docx` şablonlarını yüklediği, dosya detayındaki tüm verilerle otomatik doldurulan, Python sidecar + LibreOffice headless üzerinden PDF üreten tek doğru belge pipeline'ını kurmak; iki eski sistemi (Tiptap editör + .odt upload) kod ve veriyle birlikte kaldırmak.

## v1.2 Requirements

### Pipeline Temelleri

- [ ] **PIPE-01**: Kullanıcı Python sidecar yolunu `.env` üzerinden `PYTHON_PATH` ile konfigüre edebilir
- [ ] **PIPE-02**: Kullanıcı LibreOffice yolunu `.env` üzerinden `LIBREOFFICE_PATH` ile konfigüre edebilir; aksi takdirde sistem default konumu (`C:\Program Files\LibreOffice\program\soffice.exe`) otomatik algılar
- [ ] **PIPE-03**: Uygulama başlangıcında Python + LibreOffice kurulum sağlık kontrolü yapılır ve eksikse tüm sayfalarda üstte Türkçe uyarı banner'ı görünür
- [ ] **PIPE-04**: Ayarlar sayfasında "Pipeline Durumu" kartı LibreOffice ve Python versiyonlarını + erişilebilirlik durumunu gösterir
- [ ] **PIPE-05**: Python sidecar (`./scripts/docx-pipeline/`) `pydantic v2`, `docxtpl`, `jinja2`, `babel`, `python-slugify`, `structlog`, `tenacity` paketleriyle kurulmuş bir venv içinde çalışır
- [ ] **PIPE-06**: Next.js, Python sidecar'ı `execa` ile spawn eder; JSON stdin → JSON stdout (sonuç) → JSONL stderr (loglar) IPC protokolü kullanılır
- [ ] **PIPE-07**: Pipeline hataları sabit exit kodlarıyla raporlanır (0=başarı, 1=validation, 2=render, 3=convert, 4=archive) ve tRPC Türkçe toast'a çevirir

### Şablon Yönetimi

- [ ] **SABLON-01**: Kullanıcı `.docx` uzantılı şablon yükleyebilir (başka format reddedilir)
- [ ] **SABLON-02**: Şablon yüklerken ad (zorunlu) + kategori (zorunlu: STK / Mahkeme / Genel) girer
- [ ] **SABLON-03**: Yükleme sırasında `{{ degisken }}` ve `{%p paragraf %}` placeholder'ları otomatik çıkarılır ve şablon kaydına JSON olarak işlenir
- [ ] **SABLON-04**: Kullanıcı yüklediği şablonların listesini kategori + ad ile görür (`./sablon-yonetimi` sayfası)
- [ ] **SABLON-05**: Kullanıcı mevcut bir şablonu silebilir (DB kaydı + disk dosyası kaldırılır, üretilmiş PDF'ler etkilenmez, `belge.sablon_id` NULL olur)
- [ ] **SABLON-06**: Kullanıcı şablonu değiştirmek için yeniden yükleyebilir (overwrite); değişkenler yeniden çıkarılır
- [ ] **SABLON-07**: Drizzle `docx_sablon` tablosu eklenir (id, ad, kategori NOT NULL CHECK, dosya_yolu, degiskenler JSON, default_aksiyon nullable, created_at, updated_at)
- [ ] **SABLON-08**: `belge` tablosuna nullable `sablon_id` FK alanı eklenir (şablon silinirse SET NULL)

### PDF Üretim

- [ ] **PDF-01**: Kullanıcı bir dosya detayındayken bir şablon seçip "Üret" butonuyla PDF üretebilir
- [ ] **PDF-02**: Üretim sırasında dosya detayındaki tüm veri (müvekkil, taraflar, sürücü bilgileri, STK süreç, mahkeme süreç, duruşmalar, süre, finans, notlar) Jinja2 context'ine beslenir
- [ ] **PDF-03**: `tr_currency` filtresi Babel ile `tr_TR` locale'de `150.000,00 TL` formatı üretir
- [ ] **PDF-04**: `tarih` filtresi `dd.MM.yyyy` (`14.02.2026`) formatı üretir
- [ ] **PDF-05**: `upper_tr` ve `lower_tr` filtreleri Türkçe karakter (`ı→I`, `İ→i`) duyarlı case dönüşümü yapar
- [ ] **PDF-06**: Jinja2 koşullu bloklar (`{% if %}`, `{% for %}`, `{%p %}`, `{%tr %}`, `{%tc %}`) docxtpl üzerinden desteklenir
- [ ] **PDF-07**: Python sidecar docxtpl ile şablonu doldurur; sonra LibreOffice headless (`soffice --headless --convert-to pdf`) ile PDF'e çevirir
- [ ] **PDF-08**: Her `soffice` çağrısına `-env:UserInstallation=file:///TEMP/lo-{uuid}` argümanı eklenir ve çağrı sonunda temp profil silinir (SingletonLock'u önlemek için)
- [ ] **PDF-09**: LibreOffice `soffice` timeout (varsayılan 120 sn) aşılırsa `tenacity` ile 3 denemeye kadar exponential backoff ile tekrar denenir
- [ ] **PDF-10**: Eksik değişken varsa üretim başlamadan client-side pre-check hata verir ve eksik alanın bulunduğu sekmeye deep-link gösterir (örn. "Mahkeme esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin")

### Arşiv & Belge Entegrasyonu

- [ ] **ARSIV-01**: Üretilen PDF `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` dizinine yazılır (otomatik klasör oluşturma)
- [ ] **ARSIV-02**: Dosya adı `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` formatında üretilir; plaka yoksa segment atlanır (`{müvekkil-slug}-{seq}.pdf`)
- [ ] **ARSIV-03**: Müvekkil ve plaka slug'ları `python-slugify` ile ASCII-safe, Türkçe karakter normalize edilmiş formatta üretilir
- [ ] **ARSIV-04**: `seq` numarası aynı dosyada aynı şablondan daha önce üretilen PDF sayısı +1'dir (DB transaction içinde hesaplanır, race condition engellenir)
- [ ] **ARSIV-05**: Üretim sonunda `belge` tablosuna kayıt eklenir (dosya_id, kategori="Üretilen Belge", file_path, sablon_id); PDF yazımı ve DB insert transactional olarak atomiktir
- [ ] **ARSIV-06**: DB insert başarısız olursa yazılan PDF disk'ten silinir (rollback)

### Belgeler UI

- [ ] **BUI-01**: Dosya detayı Belgeler sekmesinde "Şablondan Üret" butonu + şablon seçici dropdown bulunur
- [ ] **BUI-02**: Dropdown şablonları kategoriye göre gruplar (STK / Mahkeme / Genel)
- [ ] **BUI-03**: Üretim sırasında spinner + Türkçe durum mesajı ("Şablon dolduruluyor…", "PDF oluşturuluyor…") gösterilir
- [ ] **BUI-04**: Üretim başarılı olunca Belgeler listesi yenilenir ve yeni PDF üstte görünür
- [ ] **BUI-05**: Belgeler listesinde üretilmiş PDF satırları şablon adını ve seq numarasını gösterir
- [ ] **BUI-06**: Ayarlar altında "Şablon Yönetimi" ekranı: şablon listesi, yükleme formu, sil/değiştir aksiyonları
- [ ] **BUI-07**: Şablon detayında değişken katalog görünümü: çıkarılan değişkenler + hangisi bilinen sistem alanıyla eşleşiyor (badge: "✓ Bilinen" / "⚠ Bilinmeyen")
- [ ] **BUI-08**: Ayarlar > Yardım altında "Değişken Listesi" cheat-sheet sayfası (variable registry'den auto-generated, TR açıklamalar ve örneklerle)
- [ ] **BUI-09**: Variable registry (`lib/docx/variable-registry.ts`) tüm desteklenen değişkenleri TypeScript const olarak tanımlar (müvekkil.*, dosya.*, taraf[n].*, surucu.*, stk.*, mahkeme.*, durusma[n].*, sure.*, finans.*, notlar.*)

### Temizlik (Retirement)

- [ ] **TEMIZ-01**: `lib/trpc/routers/dilekce.ts` ve `lib/trpc/routers/dilekce-odt.ts` dosyaları silinir, router kayıtlarından çıkarılır
- [ ] **TEMIZ-02**: `app/(dashboard)/dilekce/` tüm route klasörü (yeni + odt-yukle alt yolları dahil) silinir
- [ ] **TEMIZ-03**: `app/api/dilekce/` ve `app/api/dilekce-odt/` API route klasörleri silinir
- [ ] **TEMIZ-04**: `lib/services/odt-to-pdf.ts`, `lib/pdf/pdf-generator.ts` ve `jspdf`, `adm-zip`, `@xmldom/xmldom` bağımlılıkları kaldırılır (başka yerde kullanılmıyorsa)
- [ ] **TEMIZ-05**: Drizzle migration `dilekce_sablonu` ve `dilekce_odt_sablonu` tablolarını DROP eder
- [ ] **TEMIZ-06**: `./uploads/odt-templates/` klasörü silinir
- [ ] **TEMIZ-07**: Navigasyon / sidebar menüsünden "Dilekçeler" linki kaldırılır, yerine "Şablon Yönetimi" eklenir
- [ ] **TEMIZ-08**: Retirement migration uygulanmadan önce kullanıcıya onay modal'ı gösterilir ("Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?")

## v2 Requirements (deferred to v1.3+)

### Quick Actions

- **QUICK-01**: Belgeler sekmesinde named quick-action butonları (örn. "İhtarname Üret", "Cevap Dilekçesi Üret") — `sablon.default_aksiyon` alanı üzerinden
- **QUICK-02**: Dry-run / preview binding — üretimden önce çözümlenen context'i JSON/tablo olarak göster
- **QUICK-03**: Multi-template batch üretim (tek tıkla N şablon)
- **QUICK-04**: Template-to-dosya generation history view
- **QUICK-05**: Fuzzy-match typo uyarısı şablon yüklerken

### Advanced

- **ADV-01**: Deterministic / reproducible PDF rendering (metadata strip)
- **ADV-02**: Şablon versiyonlama / diff / rollback

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app WYSIWYG şablon editörü | v1.2 tam olarak bunu emekliye ayırıyor (Tiptap); Word vastly daha iyi bir authoring surface |
| Live in-browser DOCX preview | DOCX→HTML faithful rendering güvenilmez; PDF üret ve iframe'de göster |
| Cloud template library / shared templates | Offline-first mimariyle çelişir |
| AI / LLM ile dilekçe yazımı | Halüsinasyon + PII + offline-first ihlali |
| E-imza / KEP / UYAP entegrasyonu | Ayrı proje büyüklüğü |
| Koşullu-mantık GUI builder (`{% if %}` yerine tıklama) | HotDocs 20 yıldır çözemedi; Jinja cheat-sheet yeterli |
| Parallel "değişken giriş formu" | Veri dosya sekmelerinde yaşar; iki truth source yaratmaz |
| HMK/içtihat/TCMB auto-insert değişkenler | Legal corpus DB gerektirir |
| Çoklu çıktı formatı (DOCX + PDF + HTML) | PDF canonical; kullanıcı DOCX isterse şablonu düzenler |
| Tiptap / .odt verisi export'u | PROJECT.md'de user-confirmed deletion kararı; export tooling yok |
| Uygulama içinde şablon düzenleme | Avukat Word'de düzenleyip yeniden yükler |

## Traceability

Roadmap tarafından doldurulur.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | — | Pending |
| PIPE-02 | — | Pending |
| PIPE-03 | — | Pending |
| PIPE-04 | — | Pending |
| PIPE-05 | — | Pending |
| PIPE-06 | — | Pending |
| PIPE-07 | — | Pending |
| SABLON-01 | — | Pending |
| SABLON-02 | — | Pending |
| SABLON-03 | — | Pending |
| SABLON-04 | — | Pending |
| SABLON-05 | — | Pending |
| SABLON-06 | — | Pending |
| SABLON-07 | — | Pending |
| SABLON-08 | — | Pending |
| PDF-01 | — | Pending |
| PDF-02 | — | Pending |
| PDF-03 | — | Pending |
| PDF-04 | — | Pending |
| PDF-05 | — | Pending |
| PDF-06 | — | Pending |
| PDF-07 | — | Pending |
| PDF-08 | — | Pending |
| PDF-09 | — | Pending |
| PDF-10 | — | Pending |
| ARSIV-01 | — | Pending |
| ARSIV-02 | — | Pending |
| ARSIV-03 | — | Pending |
| ARSIV-04 | — | Pending |
| ARSIV-05 | — | Pending |
| ARSIV-06 | — | Pending |
| BUI-01 | — | Pending |
| BUI-02 | — | Pending |
| BUI-03 | — | Pending |
| BUI-04 | — | Pending |
| BUI-05 | — | Pending |
| BUI-06 | — | Pending |
| BUI-07 | — | Pending |
| BUI-08 | — | Pending |
| BUI-09 | — | Pending |
| TEMIZ-01 | — | Pending |
| TEMIZ-02 | — | Pending |
| TEMIZ-03 | — | Pending |
| TEMIZ-04 | — | Pending |
| TEMIZ-05 | — | Pending |
| TEMIZ-06 | — | Pending |
| TEMIZ-07 | — | Pending |
| TEMIZ-08 | — | Pending |

**Coverage:**
- v1.2 requirements: 47 total
- Mapped to phases: 0 (roadmap aşamasında doldurulacak)
- Unmapped: 47 ⚠️

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*
