---
status: diagnosed
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
source: [14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md, 14-04-SUMMARY.md, 14-05-SUMMARY.md]
started: 2026-04-17T10:45:00Z
updated: 2026-04-17T11:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Sigorta Şirketi Tablosu Görünümü
expected: Ayarlar sayfasına git. Sigorta Şirketleri bölümünü bul. Şirketler 4 sütunlu bir tabloda listelenmiş olmalı. Her satırın solunda genişletme (accordion) ikonu olmalı. Bir satıra tıklayınca o şirkete bağlı avukatların alt listesi açılmalı.
result: issue
reported: "3 sütun var accordion butonu var ve çalışıyor"
severity: minor

### 2. Sigorta Şirketi Oluşturma (6 alan)
expected: "Yeni Ekle" butonuna tıkla. Form diyalogu 6 alan içermeli: Ad, Mersis No, Vergi No, Bağlı Olduğu Vergi Dairesi, İhtar Mail, KEP Mail. Kaydet'e tıklayınca yeni şirket tabloda görünmeli.
result: pass

### 3. Sigorta Şirketi Düzenleme
expected: Mevcut bir şirketi düzenle. Bir alanı değiştir ve kaydet. "database is locked" gibi bir hata çıkmamalı, değişiklik tabloya yansımalı.
result: pass

### 4. Sigorta Şirketi Silme
expected: Mevcut bir sigorta şirketini sil (avukat bağlı olmayan birini dene). Onay diyalogu açılmalı. Onayla'ya tıklayınca şirket listeden kaldırılmalı; "FOREIGN KEY constraint failed" hatası çıkmamalı.
result: pass

### 5. Avukat Ekleme (Şirkete Bağlı)
expected: Bir sigorta şirketi satırını genişlet. "Avukat Ekle" butonu görünmeli. Tıklayınca form diyalogu açılmalı: Ad, TBB Sicil No, IBAN, E-posta, Telefon alanları olmalı. Kaydet'e tıklayınca avukat alt listesinde görünmeli.
result: pass

### 6. Avukat Silme / Bağlantı Kaldırma
expected: Avukat alt listesinde bir avukatın yanındaki silme/kaldır butonuna tıkla. Onay AlertDialog açılmalı. Onayla'ya tıklayınca avukat alt listeden kaldırılmalı.
result: pass

### 7. Karşıtaraflar - Karşı Vekil Alanı Kaldırıldı
expected: Bir dosyada Karşıtaraflar sekmesine git. Taraf düzenleme formunu aç. Formda "Karşı Vekil Adı" veya benzeri bir serbest metin alanı OLMAMALI. Sadece Sigorta Şirketi ve Avukat dropdown'ları bulunmalı.
result: pass

### 8. Karşıtaraflar - Cascading Avukat Dropdown
expected: Taraf düzenleme formunda: Sigorta Şirketi seçilmemişken Avukat dropdown'u devre dışı olmalı ("Önce sigorta şirketi seçin" yazısıyla). Sigorta şirketi seçince avukat dropdown'u o şirkete bağlı avukatları listelemelidir.
result: issue
reported: "devre dışı ama 'önce sigorta seçin' yazısı yok"
severity: minor

### 9. Karşıtaraflar - Taraf Kaydetme (avukat_id ile)
expected: Bir tarafa sigorta şirketi seç, ardından avukat seç. Kaydet'e tıkla. 500 hatası çıkmamalı, taraf başarıyla kaydedilmeli.
result: pass

### 10. Karşıtaraflar - Görüntüleme Modunda Avukat
expected: Avukatlı bir tarafı kaydedip görüntüleme moduna geç. "Karşı Taraf Avukatı" satırı avukatın adını göstermeli.
result: pass

### 11. Karşıtaraflar - Şirket Değişince Avukat Sıfırlama
expected: Taraf formunda sigorta şirketi seç ve bir avukat seç. Ardından sigorta şirketini farklı bir şirketle değiştir. Avukat alanı otomatik boşalmalı (placeholder'a dönmeli).
result: pass

## Summary

total: 11
passed: 9
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Sigorta şirketi tablosu 4 sütunlu olmalı"
  status: failed
  reason: "User reported: 3 sütun var accordion butonu var ve çalışıyor"
  severity: minor
  test: 1
  root_cause: "Tablo gerçekte 4 sütunlu (Ad, Vergi No, İhtar Mail, İşlemler). Accordion chevron İşlemler kolonuna gömülü. Spec karşılanmış — kullanıcı İşlemler kolonunu ayrı saymamış. Kod değişikliği gerekmez."
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Avukat dropdown'u devre dışıyken 'Önce sigorta şirketi seçin' placeholder'ı görünmeli"
  status: fixed
  reason: "User reported: devre dışı ama 'önce sigorta seçin' yazısı yok"
  severity: minor
  test: 8
  root_cause: "Radix Select, value prop verildiğinde placeholder'ı göstermez. value her zaman 'none' veya gerçek ID ile doluydu. Fix: !selectedSirketId iken value='' geçilerek placeholder gösterildi."
  artifacts:
    - path: "components/dosya/karsitaraflar-tab.tsx"
      issue: "value prop always set, preventing placeholder display"
  missing:
    - "Conditionally pass empty string as value when Select is disabled"
  debug_session: ""
