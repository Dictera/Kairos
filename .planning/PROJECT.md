# Sigorta Uyuşmazlık Takip

## What This Is

Solo avukat için yerel çalışan (offline-first), STK Tahkim Komisyonu ve mahkemeler (Asliye Ticaret / Asliye Hukuk) nezdindeki sigorta uyuşmazlık dosyalarını merkezi olarak takip eden web uygulaması. Dağınık Excel, kağıt ve farklı klasörlerdeki iş akışının yerini alır; 200+ aktif dosyayı tek bir yerden yönetmeyi sağlar.

## Core Value

Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.

## Requirements

### Validated

- ✓ **Foundation (FOUND-01–06)** — v1.0: Next.js 15, SQLite/Drizzle ORM, tRPC v11, iron-session auth, shadcn/ui
- ✓ **Müvekkil Yönetimi (MUVEK-01–04)** — v1.0: Full CRUD with Turkish search, linked dosya count, delete guards
- ✓ **Dosya Yönetimi (DOSYA-01–05)** — v1.0: Case CRUD, 6-tab detail shell, counter-party fields, archive
- ✓ **Ayarlar (AYAR-01–03)** — v1.0: Sigorta şirketi, mahkeme, sigorta türü CRUD + şifre kılavuzu
- ✓ **STK Süreç Takibi (SUREC-01–05)** — v1.0: 9-stage STK tracker with all data points
- ✓ **Mahkeme Süreç Takibi (SUREC-01–05)** — v1.0: 8-stage Mahkeme tracker, multiple hearings
- ✓ **Süre Otomatik Hesaplama (SURE-01–05)** — v1.0: STK 10d, istinaf 14d, cevap 14d + adli tatil warnings
- ✓ **Dashboard (DASH-01–02)** — v1.0: Stats cards, urgency badges, today's hearings
- ✓ **Takvim (TAKVIM-01–02)** — v1.0: Monthly calendar grid, clickable event links
- ✓ **Belge Yönetimi (BELGE-01–04)** — v1.0: Upload/download 20MB, category badges, delete
- ✓ **Finans Takibi (FINANS-01–06)** — v1.0: Gelen/Giden/Masraf entries, net balance, finance dashboard
- ✓ **Dilekçe Şablon Sistemi (DILEKCE-01–05)** — v1.0: Tiptap editor, variable substitution, Arial TTF Turkish PDF
- ✓ **Raporlar (RAPOR-01–03)** — v1.0: Portfolio + financial reports, PDF + Excel export
- ~~**Dilekçe Şablon Sistemi (DILEKCE-01–05)**~~ — v1.0 shipped, v1.2'de **emekliye ayrıldı** (yeni .docx + LibreOffice pipeline ile değiştirildi)
- ✓ **Müvekkil E-posta Kaldırma (MUVEK-06)** — v1.1: Müvekkil formlarından e-posta alanı kaldırma
- ✓ **Sürücü Bilgileri (TARAF-06, 07, 08, 09, 10)** — v1.1: Dosya > Taraflar bölümüne sürücü bilgileri ekleme (Ad, Soyad, Plaka, Telefon, Poliçe No) + Turkish phone regex + UI Card
- ✓ **Sekme Temizliği ve UI/UX (TAB-01, TAB-02, UIUX-01)** — v1.1: Notlar/Zaman Çizelgesi tab replacement with Notes CRUD + Activity Timeline; Genel Bilgiler new fields; Müvekkil IBAN + form grouping
- ✓ **Avukat Yönetimi (Phase 14)** — v1.1: Avukat tablosu, sigorta şirketi ilişkisi (avukat_sigorta_sirketi join), karşıtaraf vekil alanı avukat seçimine dönüştürüldü; Ayarlar ekranından CRUD yönetimi

## Current Milestone: v1.2 Şablon Belgeler

**Goal:** Avukatın kendi `.docx` şablonlarını yüklediği, dosya detayındaki tüm verilerle otomatik doldurulan, Python sidecar + LibreOffice headless üzerinden PDF üreten tek doğru belge pipeline'ını kurmak; iki eski sistemi (Tiptap editör + .odt upload) kod ve veriyle birlikte kaldırmak.

**Target features:**
- `.docx` şablon yükleme (ad + zorunlu kategori: STK / Mahkeme / Genel), otomatik `{{ degisken }}` çıkarımı
- Python sidecar pipeline: `pydantic v2` + `docxtpl` + `jinja2` + `babel` + `python-slugify` + `structlog` + `tenacity`
- Dosya detayındaki tüm veri şablona aktarılır (müvekkil, taraflar, sürücü, STK/mahkeme süreç, duruşma, süre, finans, notlar); ileride genişletilebilir
- TR formatlama filtreleri (`tr_currency`, tarih) + Jinja2 koşullu bloklar / döngüler
- LibreOffice headless ile PDF (`LIBREOFFICE_PATH` + `PYTHON_PATH` `.env`), kurulum kontrol + banner uyarı
- Otomatik arşiv: `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` **+** `belge` tablosuna otomatik kayıt
- Dosya adı: `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` (plaka yoksa atla, seq otomatik artar)
- **Belgeler sekmesinde tek tuşla şablon → PDF üretimi** (ör. "İhtarname Üret" butonu → ihtarname.docx → PDF → dosyaya iliştir)
- Eski sistemler temizliği: `dilekce` (Tiptap) + `dilekce-odt` routerları, UI, tablolar, dosya sistemindeki içerik silinir (export yok)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Çok kullanıcılı / rol bazlı yetkilendirme | Solo avukat — tek kullanıcı yeterli |
| Bulut senkronizasyonu / uzaktan erişim | Offline-first; lokal SQLite |
| İstinaf / Temyiz özel modülü | v1'de yok, ileride eklenebilir |
| Mobil uygulama | Web-first; masaüstü tarayıcı |
| Geçmiş dosya aktarımı (Excel import) | Sıfırdan veri girişi yeterli |
| Tiptap tabanlı dilekçe editörü (DILEKCE-01–05) | v1.2 .docx + LibreOffice pipeline ile değiştirildi |
| .odt şablon yükleme (dilekce-odt) | v1.2 .docx + docxtpl akışına birleştirildi |
| Uygulama içinde şablon düzenleme | Avukat Word'de düzenleyip yeniden yükler |
| Mevcut Tiptap/ODT verisinin export'u | Kullanıcı onayı ile silinecek, tutulmayacak |

## Context

- **Tech stack:** Next.js 15.5.15, SQLite (better-sqlite3), Drizzle ORM, tRPC v11, shadcn/ui, Tailwind CSS v3, TypeScript strict
- **Auth:** `.env` tabanlı tek kullanıcı — session yok, HttpOnly cookie
- **Deployment:** Lokal only — `next dev` → `localhost:3000`
- **Storage:** `./data/db.sqlite`, `./public/uploads`
- **User:** Solo avukat; ağırlıklı Kasko/Trafik ve Sağlık/Hayat sigortaları
- **User feedback themes:** Demand for shape tools in reports; Turkish character rendering critical; calendar integration with case detail is primary workflow

## Constraints

- **Tech Stack**: Next.js 15, SQLite, Drizzle ORM, tRPC, TypeScript strict, shadcn/ui, Tailwind CSS, React Query, Zod
- **Auth**: `.env` tabanlı şifre — kullanıcı oluşturma ekranı yok
- **Deployment**: Lokal only — `next dev` → `localhost:3000`, internet bağlantısı gerekmez
- **Performance**: 200+ dosyada liste sayfası yüklenme süresi < 1 saniye
- **Storage**: SQLite dosyası `./data/db.sqlite`, yüklemeler `./public/uploads`

## Key Decisions

| Decision | Rationale | Outcome |
|---------|-----------|---------|
| SQLite + Drizzle ORM | Offline çalışma, sıfır sunucu bağımlılığı, kolay yedekleme | ✓ Confirmed — works well |
| tRPC | TypeScript end-to-end tip güvenliği, Next.js App Router ile uyum | ✓ Confirmed — excellent DX |
| Env tabanlı auth | Solo avukat — session/JWT karmaşıklığı gerekmez | ✓ Confirmed — simple and sufficient |
| shadcn/ui + Tailwind CSS v3 | Hazır bileşenler, hızlı UI geliştirme | ✓ Confirmed — v1 shipped |
| 6-tab dosya detail shell | One-stop case management | ✓ Confirmed — core workflow |
| Pure deadline functions (no DB imports) | Testability, timezone safety | ✓ Confirmed — 13 unit tests pass |
| Turkish locale (dd.MM.yyyy, Pazartesi hafta başı) | Turkish legal context | ✓ Confirmed |
| Arial TTF for PDF (instead of Roboto) | Google Fonts blocked by network | ✓ Confirmed — all Turkish chars render |
| Navy + Turuncu color palette | Brand refresh planned for v1.1 | ✓ Confirmed — shipped Phase 8 |
| DatePickerField shared component | Standardization needed | ✓ Confirmed — shipped Phase 9 |
| karsitaraf_vekil → avukat_id FK | Free-text vekil replaced with structured avukat entity for better data integrity | ✓ Confirmed — Phase 14; stale template variable remains as tech debt |
| logOlay activity log | All dosya/not/belge mutations hook into olay_gunlugu for Timeline | ✓ Confirmed — Phase 13; finans/sure mutations not yet hooked |
| Drizzle relations graph | query.with() enables eager loading of avukat on taraf | ✓ Confirmed — Phase 14 |

## Evolution

Bu belge faz geçişlerinde ve milestone sınırlarında güncellenir.

**Her faz geçişinde** (`/gsd-transition` ile):
1. Geçersizleşen gereksinimler? → Out of Scope'a taşı
2. Doğrulanan gereksinimler? → Validated'a taşı
3. Yeni gereksinimler ortaya çıktı mı? → Active'e ekle
4. Kaydedilecek kararlar? → Key Decisions'a ekle
5. "What This Is" hâlâ doğru mu? → Güncel tut

**Her milestone sonunda** (`/gsd-complete-milestone` ile):
1. Tüm bölümlerin tam incelemesi
2. Core Value kontrolü — hâlâ doğru öncelik mi?
3. Out of Scope denetimi — gerekçeler hâlâ geçerli mi?
4. Context güncelleme

---
*Last updated: 2026-04-20 after v1.2 milestone started — Şablon Belgeler Pipeline*
