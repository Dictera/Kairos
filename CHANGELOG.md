# Changelog

All notable changes to Kairos are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Takvim ICS indirme — duruşma takvimini `.ics` dosyası olarak dışa aktarma
- Webcal abonelik butonu — takvim uygulamalarına `webcal://` protokolü ile abone olma; "Uygulama Aç" + "Linki Kopyala" butonları
- Ayarlar › Sistem: Takvim Export toggle — export/abonelik butonlarını göster/gizle
- Telegram bildirim kategorileri — her bildirim türünü (duruşma, tahsilat vb.) ayrı ayrı açıp kapatma
- Haftalık duruşma özeti — cumartesi sabahı Telegram üzerinden önümüzdeki haftanın duruşmalarını gönderme
- Ayarlar › Changelog sekmesi — uygulama güncellemelerini doğrudan Ayarlar ekranından görüntüleme

### Changed

- Webcal butonu tek buton yerine "Uygulama Aç" + "Linki Kopyala" olarak ikiye bölündü
- Telegram bildirim mesajları gruplandırıldı; müvekkil adı kaldırıldı

## [0.1.0] - 2026-05-17

İlk genel sürüm. Avukatlar için sigorta uyuşmazlık takip sistemi.

### Özellikler

- **Dosya & Müvekkil Yönetimi** — CRUD, 6 sekme (genel bilgiler, taraflar, süreç, süreler, belgeler, finans, notlar, zaman çizelgesi)
- **Sigorta Tahkim Komisyonu Süreç Takibi** — 9 aşamalı izleme (İhtar → Kesinleşme), otomatik tarih hesaplama
- **Mahkeme Süreç Takibi** — 12 aşamalı mahkeme izleme, birden fazla duruşma kaydı
- **Otomatik Süre Hesaplama** — Tahkim itiraz (10 gün), istinaf (14 gün), cevap dilekçesi (14 gün); adli tatil uyarıları
- **Şablon & PDF Üretimi** — `.docx` şablon yükleme, Jinja2 değişken doldurma, LibreOffice headless PDF dönüşümü
- **Belge Yönetimi** — 20 MB'a kadar yükleme/indirme, kategori etiketleri
- **Finans Takibi** — Gelen/Giden/Masraf girişleri, net bakiye, finans dashboard
- **Raporlar** — Portföy ve finansal raporlar, PDF ve Excel dışa aktarım
- **Dashboard & Takvim** — İstatistik kartları, aciliyet rozetleri, aylık takvim görünümü
- **Telegram Bildirimleri** — Yaklaşan duruşmalar için Telegram bot push bildirimleri
- **Ayarlar** — Mahkeme/kurum listesi, sigorta türleri, sigorta şirketleri, avukatlar, belgeler klasörü
- **Kimlik Doğrulama** — iron-session tabanlı tek şifreli giriş

### Teknoloji

Next.js 15 · SQLite (better-sqlite3 + Drizzle ORM) · tRPC v11 · React Query · shadcn/ui · Tailwind CSS v4 · Vitest · LibreOffice headless · Python Jinja2

[Unreleased]: https://github.com/Dictera/Kairos/compare/v0.1...HEAD
[0.1.0]: https://github.com/Dictera/Kairos/releases/tag/v0.1
