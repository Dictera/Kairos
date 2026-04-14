# Phase 13: Tab Cleanup & UI/UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 13-tab-cleanup-ui-ux
**Areas discussed:** Boş Sekme Kararı, Sekme Bölüm Ayarlamaları, Müvekkil UI/UX, Dosya Listesi/UI/UX

---

## Boş Sekme Kararı

| Option | Description | Selected |
|--------|-------------|----------|
| Not içeriğiyle doldur | Basit not alanı ekle | |
| Sekmeyi kaldır ve yönlendir | URL redirect ile kaldır | |
| Zaman çizelgesi olarak doldur | Sadece otomatik log | |

**User's choice:** Notlar + Zaman Çizelgesi birlikte — üstte çoklu not alanı, altta otomatik kapsamlı olay günlüğü

**Follow-up — Not kaydetme:**

| Option | Description | Selected |
|--------|-------------|----------|
| Ayrı not varlığı (birden fazla not) | Yeni DB tablosu, CRUD | ✓ |
| Mevcut aciklama alanını kullan | Tek metin, no DB change | |

**Follow-up — Zaman çizelgesi çalışma şekli:**

| Option | Description | Selected |
|--------|-------------|----------|
| Otomatik olay günlüğü | Kim, ne zaman, ne yaptı otomatik log | ✓ |
| Manuel zaman çizelgesi girişleri | Kullanıcı manuel giriş | |

**Follow-up — Log kapsamı:**

| Option | Description | Selected |
|--------|-------------|----------|
| Temel log olayları | Oluşturma, durum, süreç geçişleri | |
| Kapsamlı log — tüm değişiklikler | Tüm alan güncellemeleri, finans, belge vb. | ✓ |

**Notes:** User wants the tab to include both free-form notes (multiple, separate entities) and an automatic comprehensive activity timeline that logs all changes to the file. Timeline should be like a "log of the file" — automatic, comprehensive.

---

## Sekme Bölüm Ayarlamaları

### Genel Bilgiler Sekmesi

| Option | Description | Selected |
|--------|-------------|----------|
| Aynen kalsın | Mevcut alanlar yeterli | |
| Değişiklik yap | Yeni alanlar eklensin | ✓ |

**User's detailed requirements for Genel Bilgiler:**
- "Poliçe No" → "Müvekkil Poliçe No" olarak değiştirilecek
- Hasar Dosya Numarası alanı eklenecek (format: "Sigorta Şirketi - 111", manuel giriş)
- Kaza Tarihi eklenecek (DatePicker, Phase 9 kriterleri)
- Müvekkil Sigorta/Kasko Şirketi dropdown ile seçilebilir (mevcut sigorta şirketi listesinden)
- Kusur oranları: iki ayrı alan — Karşı Taraf Kusur Oranı (manuel %), Müvekkil Kusur Oranı (otomatik 100% - karşı taraf)
- Kusur gösterimi: %0 olan gösterilmez — sadece %0 olmayanlar görünür

**Follow-up — Hasar No DB:**

| Option | Description | Selected |
|--------|-------------|----------|
| Yeni DB alanı | hasar_dosya_no kolonu ekle | ✓ |
| Mevcut dosya_no kullan | Birleştir | |

**Follow-up — Kusur Alanı Lokasyon:**

| Option | Description | Selected |
|--------|-------------|----------|
| Taraf tablosuna ekle | Karsi taraf ile ilişkili | |
| Dosya tablosuna ekle | Dosya seviyesinde | |

**User correction:** Dosya detayı Genel Bilgiler kısmına eklensin. %0 olan kusur gösterilmesin.

**Follow-up — Kusur gösterimi:**

| Option | Description | Selected |
|--------|-------------|----------|
| Sadece %0 olmayanları göster | Karşı %100 → sadece karşı görünür | ✓ |
| Her zaman göster | 0 dahil | |

### Yargılama Süreci Sekmesi

User provided detailed restructuring requirements:

**STK Aşamaları:** İhtar → Arabuluculuk → Başvuru → Ön İnceleme → Bilirkişi → Islah → Karar → İtiraz → Kesinleşme

**STK Veri Noktaları:** STK Esas No, STK Karar No, STK İtiraz Esas No, STK İtiraz Karar No, İhtar Tarihi, Arabuluculuk Son Tutanak Tarihi, Başvuru Tarihi, Bilirkişi Ücreti Talep Tarihi, Bilirkişi Raporu Tebliğ Tarihi, Islah Tarihi, Karar Tarihi, Kesinleşme Tarihi

**Mahkeme Aşamaları:** Dava Dilekçesi Tebliğ → Cevap Dilekçesi Tebliğ → Replik Dilekçesi Tebliğ → Duplik Dilekçesi Tebliğ → Ön İnceleme → Bilirkişi → Duruşmalar → Karar → Karar Tebliğ → İstinaf → Temyiz → Kesinleşme

**Mahkeme Veri Noktaları:** İlk Derece Esas No, İlk Derece Karar No, İlk Derece Mahkemesi Adı, İstinaf Esas No, İstinaf Karar No, İstinaf Mahkemesi Adı, Temyiz Esas No, Temyiz Karar No, Temyiz Mahkemesi Adı, plus all relevant dates

### Belgeler Sekmesi

- Kategorilerin genişletilmesi
- Yüklenen belgenin isminin kategori adıyla otomatik eşleşmesi/önerilmesi (örn: "İhtarname" kategorisi → "İhtarname" dosya adı)

### Diğer Sekmeler

- Karşı Taraflar: Phase 12'de güncellendi, değişiklik yok (ancak ayarlar sayfası için scope creep ertelendi)
- Dosya Finansı: Değişiklik yok

---

## Müvekkil UI/UX

| Option | Description | Selected |
|--------|-------------|----------|
| Liste iyileştirmeleri | Sütunlar, arama, filtreleme | |
| Form iyileştirmeleri | Alan düzeni, doğrulama, UX | |
| Detay iyileştirmeleri | Düzen, okunaklık | |
| Tümünü iyileştir | Liste + form + detay | ✓ |

**Liste iyileştirmeleri:**
- Sütun düzeni ve kompakt görünüm iyileştirmesi
- Genel görünüm ve his iyileştirmesi (modern, better empty states, better skeleton loading)

**Form iyileştirmeleri:**
- Alan gruplandırması ve düzen iyileştirmesi
- Daha iyi boş durumlar, hata gösterimi, otomatik focus, modern giriş hissi

**Detay iyileştirmeleri:**
- Bilgi düzeni ve okunaklık iyileştirmesi

**Ek alan:**
- IBAN alanı müvekkil veritabanına eklenecek — form, liste ve detayda gösterilecek

---

## Dosya Listesi/UI/UX

| Option | Description | Selected |
|--------|-------------|----------|
| Liste iyileştirmeleri | Sütun düzeni, filtreler | |
| Form iyileştirmeleri | Yeni alanlar, UX | |
| Detay iyileştirmeleri | Sekme görünümü | |
| Tümünü iyileştir | Liste + form + detay | ✓ |

**Liste:** Sütun düzeni + modern görünüm iyileştirmeleri
**Form:** Yeni alanlar (hasar no, kaza tarihi, müvekkil sigorta, kusur) dahil düzen ve UX iyileştirmesi
**Detay:** 6 sekme düzen ve okunaklık iyileştirmeleri

---

## the agent's Discretion

- Not varlığı şema tasarımı detayları
- Zaman çizelgesi olay günlüğü şema ve UI tasarımı
- Kusur oranı hesaplama UI detayları
- UI/UX iyileştirmelerinin görsel detayları
- Belge kategori genişletme listesi
- STK/Mahkeme stage/data migration stratejisi

## Deferred Ideas

- Ayarlar sayfasında sigorta şirketlerine ek alanlar (mersis no, vergi no, bağlı olduğu vergi dairesi, ihtar mail, kep mail) — yeni faz
- Ayarlar sayfasında sigorta şirketlerine avukat bölümü (ad, TBB Sicil No, IBAN, mail, telefon) — yeni faz
- Karşı taraf seçiminde avukat dropdown — yeni faz