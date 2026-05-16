---
status: complete
phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani
source: 19-01-SUMMARY.md, 19-02-SUMMARY.md, 19-03-SUMMARY.md
started: 2026-04-22T00:15:00Z
updated: 2026-04-22T00:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. "Şablondan Üret" Butonu ve Şablon Seçici
expected: |
  Bir dosya detayı sayfasına gidip "Belgeler" sekmesine tıkladığınızda:
  - "Şablondan Belge Üret" başlıklı bir bölüm görünmeli
  - Kategori filtre sekmeleri olmalı: Tümü, STK, Mahkeme, Genel
  - Arama yapılabilir şablon seçici dropdown olmalı ("Şablon seçin…" placeholder)
  - Turuncu (primary) "Şablondan Üret" butonu olmalı
result: pass

### 2. PDF Üretim Progress Modalı
expected: |
  Bir şablon seçip "Şablondan Üret" butonuna tıkladığınızda:
  - Kapatılamaz (non-dismissible) bir modal açılır
  - Başlık: "PDF Üretiliyor"
  - Dönen turuncu spinner görünür
  - 3 adım listelenir: "1. Şablon dolduruluyor…", "2. PDF oluşturuluyor…", "3. Arşivleniyor…"
  - Aktif adım vurgulanır (font-medium text-foreground)
  - Başarılı olunca modal otomatik kapanır ve "PDF üretildi." toast çıkar
result: pass

### 3. Üretilen PDF'in BelgeList'te Görünümü
expected: |
  PDF üretimi başarılı olduktan sonra Belgeler listesi yenilenir:
  - Yeni PDF satırı en üstte görünür
  - Satırın sol kenarında steel-blue (accent) renkli 4px border olur
  - FileText ikonu görünür (kategori ikonu yerine)
  - Alt başlıkta "Şablon: {şablon_adı} • #{seq}" yazar
result: pass

### 4. Şablon Satırına Tıklama — Değişken Kataloğu
expected: |
  Ayarlar > Şablon Yönetimi sayfasına gittiğinizde:
  - Yüklenmiş şablonlar tablo halinde listelenir
  - Bir şablon satırına tıkladığınızda (yükle/çöp butonları hariç):
    - "{şablon_adı} — Değişkenler" başlıklı bir modal açılır
    - Şablondan çıkarılmış değişkenler alfabetik sırayla listelenir
    - Her değişken `{{ degisken_adi }}` şeklinde monospace görünür
    - Bilinen değişkenlerde yeşil "✓ Bilinen" rozeti, bilinmeyenlerde sarı "⚠ Bilinmeyen" rozeti olur
result: pass

### 5. Aksiyon Butonları Satır Tıklamasını Tetiklememeli
expected: |
  Şablon Yönetimi tablosunda:
  - Bir satırın üzerindeki "Değiştir" (yükle) veya "Sil" (çöp) butonuna tıkladığınızda
  - Değişken kataloğu modalı AÇILMAMALI
  - Bunun yerine ilgili aksiyon (upload dialog veya silme onay modalı) çalışmalı
result: pass

### 6. Ayarlar Sayfasında Değişken Listesi Özet Kartı
expected: |
  Ayarlar ana sayfasına gittiğinizde:
  - "Değişken Listesi" başlıklı bir kart görünür
  - Kartta kısa açıklama metni vardır
  - "Tüm değişkenleri gör" butonu/linki vardır
result: pass

### 7. Değişken Listesi Tam Sayfa (/ayarlar/degiskenler)
expected: |
  "Tüm değişkenleri gör" butonuna veya doğrudan /ayarlar/degiskenler adresine gittiğinizde:
  - Sayfa başlığı: "Değişken Listesi"
  - Alt başlık: "Şablonlarda kullanılabilen tüm değişkenler ve açıklamaları."
  - Değişkenler sekme/tab bazında gruplandırılmıştır (örn. Genel, Müvekkil, Taraflar, vb.)
  - Her değişken `{{ path }}` şeklinde monospace kod bloğu olarak gösterilir
  - Her değişkenin Türkçe açıklaması (label) altında yazar
  - Sayfa alt kısmında "Jinja2 Filtreler" bölümü vardır (tr_currency, tarih, upper_tr, lower_tr)
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
