# Phase 14: Ayarlar Sigorta Şirketi Ek Alanlar ve Avukat Yönetimi - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
**Areas discussed:** Sigorta Şirketi Ek Alanlar, Avukat Varlık Tasarımı, Avukat Dropdown Entegrasyonu

---

## Sigorta Şirketi Ek Alanlar

| Option | Description | Selected |
|--------|-------------|----------|
| Tümü | Tüm 5 alan eklensin: mersis no, vergi no, bağlı olduğu vergi dairesi, ihtar mail, kep mail | ✓ |
| Öncelikli 3 alan | Sadece en kritik 3 alan: vergi no, ihtar mail, kep mail | |
| Sadece e-postalar | Sadece 2 alan: ihtar mail ve kep mail | |

**User's choice:** Tümü — all 5 fields added

| Option | Description | Selected |
|--------|-------------|----------|
| Tablo + dialog | Mevcut basit tablo + dialog yapısını genişlet | ✓ |
| Tablo + inline detay paneli | Liste tablosu korunur ama detay için genişletilebilir panel | |
| Tamamen yeni bileşen | AyarlarCrudSection'u bırak, yeni bileşen yaz | |

**User's choice:** Tablo + dialog

| Option | Description | Selected |
|--------|-------------|----------|
| Zorunlu vergi no + e-posta doğrulama | vergi no zorunlu, TCKN/VKN format, e-posta format kontrolü | ✓ |
| Tümü opsiyonel, serbest metin | Hiçbir format zorlaması yok | |
| Sadece e-posta doğrulama | E-posta format kontrolü, diğerleri serbest | |

**User's choice:** Zorunlu vergi no + e-posta doğrulama

---

## Avukat Varlık Tasarımı

| Option | Description | Selected |
|--------|-------------|----------|
| Ayrı tablo + ilişki | Avukat bağımsız tablo, many-to-many ilişki | ✓ |
| Sigorta şirketinin altında (1:N) | Avukat tablosu sigorta şirketinin altında | |
| Ayrı tablo ama şirketsiz | Avukat tablosu ilişkisiz, şirketle bağlantı yok | |

**User's choice:** Ayrı tablo + ilişki (many-to-many)

| Option | Description | Selected |
|--------|-------------|----------|
| 5 alan | ad, TBB Sicil No, IBAN, e-posta, telefon | ✓ |
| Azami 3 alan | ad, TBB Sicil No, telefon | |
| Sadece ad + telefon | En minimal set | |

**User's choice:** 5 alan

| Option | Description | Selected |
|--------|-------------|----------|
| Ad zorunlu + format kontrolü | ad zorunlu, TBB 6 hane, IBAN TR, e-posta, telefon format | |
| Sadece ad zorunlu | Diğerlerinin hepsi opsiyonel ve serbest metin | |
| Ad + TBB zorunlu | Ad + TBB zorunlu, diğerleri opsiyonel ama format kontrolü | ✓ |

**User's choice:** Ad + TBB zorunlu, diğerleri opsiyonel ama format kontrolü

---

## Avukat Dropdown Entegrasyonu

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown ile değiştir | Serbest metin kaldırılır, avukat dropdown eklenir | ✓ |
| Dropdown + serbest metin birlikte | Dropdown varsa seçilir, yoksa serbest metin | |
| Sadece ayarlarda yönetim | Dropdown ileride, şimdilik sadece ayarlar CRUD | |

**User's choice:** Dropdown ile değiştir

| Option | Description | Selected |
|--------|-------------|----------|
| Şirkete göre filtrele | Sigorta şirketi seçildiğinde avukat listesi güncellenir | ✓ |
| Bağımsız dropdownlar | Avukat tüm avukatları gösterir | |
| Filtreli ama tümünü göster | Şirket filtresi + tümünü göster seçeneği | |

**User's choice:** Şirkete göre filtrele

| Option | Description | Selected |
|--------|-------------|----------|
| Sil ve FK ile değiştir | karsitaraf_vekil kaldırılır, avukat_id FK eklenir | ✓ |
| İkisini birden tut | Dropdown + serbest metin fallback | |
| FK ekle, vekil nullable koru | Geçiş dönemi, ikisi yan yana | |

**User's choice:** Sil ve FK ile değiştir (temiz geçiş)

---

## the agent's Discretion

- Tablo/migration isimlendirmeleri
- Ayarlar sayfasında sigorta şirketi tablosu sütun seçimi
- Avukat ilişki tablosu detayları
- Dialog form alan düzeni ve gruplandırma
- IBAN format doğrulama detayları

## Deferred Ideas

None — discussion stayed within phase scope.