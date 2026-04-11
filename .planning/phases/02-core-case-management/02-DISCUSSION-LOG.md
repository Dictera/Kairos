# Phase 2: Core Case Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 02-core-case-management
**Areas discussed:** Dosya Listesi UX, Form Deneyimi, Müvekkil Silme Davranışı, Sigorta Türü Tanımları, Dosya Detay Sekmeleri

---

## Dosya Listesi UX

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Sayfalama | Server-side query, 25-50 satır/sayfa, < 1s garanti | ✓ |
| Sonsuz scroll / virtualizasyon | Tüm kayıtlar tek sayfa, sadece görünen satırlar render | |

**Kullanıcı seçimi:** Sayfalama

### Sütunlar

| Seçenek | Seçildi |
|---------|---------|
| Dosya No | ✓ |
| Müvekkil Adı | ✓ |
| Dosya Türü + Sigorta Türü | ✓ |
| Durum + Tarih | ✓ |
| Karşı Taraf Sigorta Şirketi | ✓ (kullanıcı notu) |
| Poliçe No | ✓ (kullanıcı notu) |
| Müvekkil + Karşı Taraf Plaka | Plaka şemaya ekleniyor ama listede değil, detay sayfasında |

**Notlar:** Kullanıcı karşı taraf ismi/sigortası, plaka ve poliçe numarası istedi. "Temel + bağlam" seçeneği (6 sütun) tercih edildi; plaka detay sayfasına bırakıldı.

---

## Form Deneyimi: Sayfa mı, Modal mı?

### Dosya Formu

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Ayrı sayfa | /dosyalar/yeni ve /dosyalar/[id]/duzenle route'ları | ✓ |
| Dialog / Modal overlay | Liste üzerinde modal, URL değişmez | |

### Müvekkil Formu

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Ayrı sayfa | /muvekkiller/yeni ve /muvekkiller/[id]/duzenle | ✓ |
| Slide-over panel (Sheet) | Sağdan kayar yan panel | |

**Notlar:** Her iki form için tutarlı "ayrı sayfa" pattern'i tercih edildi.

---

## Müvekkil Silme Davranışı

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Bloklansın | Bağlı dosyalar varsa silme engellenir, uyarı mesajı + "Dosyaları Gör" linki | ✓ |
| Uyarı + cascade | Onay dialog'u, tüm dosyalar silinir | |
| Sil + dosyaları koru | Müvekkil silinir, dosyalar yetimleşir | |

**Notlar:** Kullanıcı veri güvenliğini öne çıkardı; cascade seçeneğini reddetti.

---

## Sigorta Türü Tanımları

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Ayarlar'da kullanıcı tanımlı | Sigorta şirketi gibi yönetilen liste, seed değerleri | ✓ |
| Serbest metin | Kullanıcı istediğini yazar | |

**Seed değerleri seçildi:** Kasko, Trafik / ZMSS, Sağlık, Hayat

---

## Dosya Detay Sekmeleri

| Seçenek | Açıklama | Seçildi |
|---------|----------|---------|
| Kilit ikonu + yazı | Boş sekmeler "Bu bölüm henüz yapılandırılmadı." placeholder | ✓ |
| Sekmeler gizlensin | Phase 2'de sadece 2 sekme görünür | |

**Sekme sırası:** Requirement sırası (DOSYA-03): Genel Bilgiler | Yargılama Süreci | Belgeler | Notlar/Zaman Çizelgesi | Karşı Taraflar | Dosya Finansı

---

## Claude'un Takdirine Bırakılanlar

- Filtrelerin tam yerleşimi
- Sayfalama kontrolü stili
- Form validation hata mesajları
- Dosya numarası uniqueness validation
- Müvekkil listesi sütun seçimi

## Deferred Ideas

- Filtre sidebar / collapsible panel — görünür filter bar yeterli bulundu
- Müvekkil silme cascade seçeneği — kasıtlı reddedildi
