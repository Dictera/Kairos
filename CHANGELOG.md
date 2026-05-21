# Changelog

All notable changes to Sigorta Takip are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.0] - 2026-05

### Added

- Takvim ICS indirme — duruşma takvimini `.ics` dosyası olarak dışa aktarma
- Webcal abonelik butonu — takvim uygulamalarına webcal:// protokolü ile abone olma
- "Uygulama Aç" + "Linki Kopyala" butonları — webcal bağlantısını açma veya panoya kopyalama
- Ayarlar › Sistem'de Takvim Export toggle — export/abonelik butonlarını göster/gizle
- Telegram bildirim kategorileri — her bildirim türü (duruşma, tahsilat, vb.) ayrı ayrı açılıp kapatılabilir
- Haftalık duruşma özeti — cumartesi sabahı Telegram üzerinden önümüzdeki haftanın duruşmalarını gönder

### Changed

- Webcal butonu tek buton yerine iki ayrı butona bölündü (Uygulama Aç + Linki Kopyala)
- Telegram bildirim mesajları gruplandırıldı; isim bilgisi kaldırıldı

## [1.2.0] - 2026-04

### Added

- DOCX şablon desteği — LibreOffice entegrasyonu ile Word belgelerini PDF'e dönüştürme
- Belge yükleme ve yönetimi — müvekkil dosyalarına belge ekleme, listeleme, silme
- Şablon yönetimi — DOCX şablonları yükleme, düzenleme ve dosyalara uygulama
- Belgeler klasör yolu ayarı — yüklenen belgelerin kaydedileceği konumu Sistem sekmesinden seçme
- LibreOffice boru hattı durum görüntüleyici — Pipeline Status kartı Ayarlar'da

### Changed

- Dosya detay sayfasına "Belgeler" sekmesi eklendi

## [1.1.0] - 2026-03

### Added

- Finans takibi — gelir ve gider kayıtları, bakiye özeti
- Raporlar sayfası — tarih aralığına göre finansal özet ve grafik
- Türkçe büyük/küçük harf duyarsız arama — tüm metin arama sorgularında `lower_tr()` özel SQLite fonksiyonu
- Emeklilik dosyaları — emeklilik hakkı hesabı ve dosya takibi

### Changed

- Arama kutusu sütun başlıklarına taşındı, anlık filtreleme aktif

## [1.0.0] - 2026-02

### Added

- Dosya takibi — sigorta dosyası oluşturma, düzenleme, listeleme ve silme
- Duruşma takvimi — dosyalara bağlı duruşma tarihleri ve yaklaşan duruşmalar özeti
- Müvekkil yönetimi — müvekkil kaydı oluşturma ve dosyalarla ilişkilendirme
- Ayarlar — mahkeme/kurum listesi, sigorta türleri, sigorta şirketleri, avukatlar
- iron-session tabanlı oturum kimlik doğrulama — tek şifreli giriş sistemi
- Next.js App Router + tRPC v11 + Drizzle ORM + SQLite altyapısı
- shadcn/ui bileşen kütüphanesi, Navy + Turuncu renk paleti
