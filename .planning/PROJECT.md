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
- ✓ **Müvekkil E-posta Kaldırma (MUVEK-06)** — v1.1: Müvekkil formlarından e-posta alanı kaldırma
- ✓ **Sürücü Bilgileri (TARAF-06, 09, 10)** — v1.1: Dosya > Taraflar bölümüne sürücü bilgileri ekleme (Ad, Soyad, Plaka, Telefon, Poliçe No) + Turkish phone regex

## Current Milestone: v1.1 Dosyalar ve Müvekkiller Sekmesi İyileştirmeleri

**Goal:** Müvekkil ve dosya yönetiminde temizlik ve iyileştirme — gereksiz alan çıkarma, yeni alan ekleme, sekme düzeni ve UI/UX.

**Target features:**
- Müvekkil formlarından e-posta alanı kaldırma
- Dosya > Taraflar bölümüne diğer sürücü bilgileri ekleme (Ad, Soyad, Plaka, Telefon, Poliçe No)
- Mevcut sekmelerde bölüm ekleme/çıkarma
- Dosyalar ve Müvekkiller genel UI/UX iyileştirmeleri

### Out of Scope

| Feature | Reason |
|---------|--------|
| Çok kullanıcılı / rol bazlı yetkilendirme | Solo avukat — tek kullanıcı yeterli |
| Bulut senkronizasyonu / uzaktan erişim | Offline-first; lokal SQLite |
| İstinaf / Temyiz özel modülü | v1'de yok, ileride eklenebilir |
| Mobil uygulama | Web-first; masaüstü tarayıcı |
| Geçmiş dosya aktarımı (Excel import) | Sıfırdan veri girişi yeterli |

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
| Navy + Turuncu color palette | Brand refresh planned for v1.1 | — Pending (Phase 8) |
| DatePickerField shared component | Standardization needed | — Pending (Phase 9) |

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
*Last updated: 2026-04-13 after v1.0 milestone, updated 2026-04-14 for v1.1 (Phase 10 complete)*
