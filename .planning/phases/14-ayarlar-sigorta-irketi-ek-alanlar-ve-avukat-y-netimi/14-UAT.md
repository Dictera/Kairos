---
status: complete
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
source: [14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md, 14-04-SUMMARY.md, 14-05-SUMMARY.md]
started: 2026-04-17T00:00:00Z
updated: 2026-04-17T10:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Ayarlar - Sigorta Şirketi Tablosu Görünümü
expected: Ayarlar sayfasında Sigorta Şirketleri bölümüne git. Şirketler 4 sütunlu bir tabloda listelenmiş olmalı. Her satırın solunda bir genişletme (accordion) ikonu olmalı. Satıra tıklandığında alt kısımda o şirkete bağlı avukatlar alt listesi açılmalı.
result: issue
reported: "3 sütun var, genişletme ikonu var ve çalışıyor. ama avukat ekleme yöntemini discussion'da bu şekilde kararlaştırmamıştık ayrıca mevcut olan sigorta şirketini silmeye çalıştığımda bu hatayı veriyor: FOREIGN KEY constraint failed"
severity: blocker

### 2. Sigorta Şirketi Oluşturma/Düzenleme (6 alan)
expected: Yeni Sigorta Şirketi ekle veya mevcut birini düzenle. Form 6 alan içermeli: Ad, Mersis No, Vergi No, Bağlı Olduğu Vergi Dairesi, İhtar Mail, KEP Mail. Kaydet'e tıklayınca tablo güncellenmeli.
result: issue
reported: "çalışıyor ama düzenleme yapınca bu hata çıkıyor: database is locked"
severity: major

### 3. Avukat Ekleme (Sigorta Şirketine Bağlı)
expected: Ayarlar'da bir sigorta şirketi satırını genişlet. "Avukat Ekle" butonu görünmeli. Tıklayınca form diyalogu açılmalı: Ad, TBB Sicil No, IBAN, E-posta, Telefon alanları olmalı. Kaydet'e tıklayınca avukat alt listesinde görünmeli.
result: pass

### 4. Avukat Silme / Bağlantı Kaldırma
expected: Avukat alt listesinde bir avukatın yanındaki silme/kaldır butonuna tıkla. Bir onay diyalogu (AlertDialog) açılmalı. Onayla'ya tıklayınca avukat listeden kaldırılmalı.
result: pass

### 5. Karsıtaraflar - Cascading Avukat Dropdown
expected: Bir dosyada Karşıtaraflar sekmesine git. Taraf düzenleme formunu aç. Sigorta Şirketi seçilmemişken Avukat dropdown'u devre dışı olmalı ("Önce sigorta şirketi seçin" yazısıyla). Sigorta şirketi seçince avukat dropdown'u o şirkete bağlı avukatları listelemelidir.
result: issue
reported: "çalışıyor ama bu karşı vekil adı neden formdan kaldırılmamış"
severity: major

### 6. Karsıtaraflar - Görüntüleme Modunda Avukat
expected: Bir tarafa avukat seçip kaydet. Görüntüleme modunda (view mode) "Karşı Taraf Avukatı" satırı avukatın adını göstermeli.
result: issue
reported: "avukat eklemeye çalıştığımda POST /api/trpc/dosya.upsertTaraf?batch=1 500 hatası veriyor, upsert çalışmıyor gibi router'da sorun olabilir"
severity: blocker

### 7. Karsıtaraflar - Şirket Değişince Avukat Sıfırlama
expected: Bir taraf formunda sigorta şirketi seçip avukat seç. Ardından sigorta şirketini farklı bir şirkete değiştir. Avukat alanı otomatik olarak boşalmalı (null/placeholder'a dönmeli).
result: issue
reported: "sigorta şirketi seçmeye ve değiştirmeye çalıştığımda POST /api/trpc/dosya.upsertTaraf?batch=1 500 hatası alıyorum"
severity: blocker

## Summary

total: 7
passed: 2
issues: 5
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Sigorta şirketi tablosu accordion açılınca avukat alt listesi görünmeli; silme işlemi hatasız çalışmalı"
  status: failed
  reason: "User reported: 3 sütun var, genişletme ikonu var ve çalışıyor. ama avukat ekleme yöntemini discussion'da bu şekilde kararlaştırmamıştık ayrıca mevcut olan sigorta şirketini silmeye çalıştığımda FOREIGN KEY constraint failed hatası veriyor"
  severity: blocker
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sigorta şirketi düzenleme formu hatasız kaydedilmeli"
  status: failed
  reason: "User reported: çalışıyor ama düzenleme yapınca bu hata çıkıyor: database is locked"
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Karşıtaraflar formunda karsitaraf_vekil (serbest metin) alanı kaldırılmış olmalı, yerine avukat_id dropdown'u gelmeli"
  status: failed
  reason: "User reported: çalışıyor ama bu karşı vekil adı neden formdan kaldırılmamış"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "dosya.upsertTaraf avukat_id içeren tarafı hatasız kaydedebilmeli"
  status: failed
  reason: "User reported: avukat eklemeye çalıştığımda POST /api/trpc/dosya.upsertTaraf?batch=1 500 hatası veriyor, upsert çalışmıyor gibi router'da sorun olabilir"
  severity: blocker
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sigorta şirketi değiştirilince avukat_id sıfırlanmalı, upsert hatasız çalışmalı"
  status: failed
  reason: "User reported: sigorta şirketi seçmeye ve değiştirmeye çalıştığımda POST /api/trpc/dosya.upsertTaraf?batch=1 500 hatası alıyorum"
  severity: blocker
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
