# FEATURES.md — Sigorta Uyuşmazlık Takip

**Domain:** Legal case management / insurance dispute tracking (Turkish law)
**Researched:** 2026-04-10
**Confidence note:** Web search tools unavailable. Findings based on domain knowledge of Turkish legal procedure (HMK, Sigorta Tahkim Yönetmeliği, UYAP), STK process rules, and general legal CRM patterns. Confidence level noted per section.

---

## Table Stakes (must-have in v1)

These are features a solo lawyer expects on day one. Missing any of these means the app fails its core promise of replacing Excel + paper.

### 1. Dosya (Case File) Yönetimi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Yeni dosya oluşturma (manuel veri girişi) | Primary intake flow for all 200+ files | Low |
| Dosya listesi — arama, filtre, sıralama | Daily navigation with 200+ files; < 1s load is mandatory | Medium |
| Dosya detay görünümü (sekmeli) | Single-screen overview per file | Low |
| Dosya arşivleme / pasifleştirme | Closed cases must not pollute active list | Low |
| Dosya türü etiketi (STK / Asliye Ticaret / Asliye Hukuk) | Determines which process stages are shown | Low |
| Sigorta türü kaydı (Kasko, Trafik, Sağlık, Hayat, diğer) | Extensible enum, not hardcoded | Low |

### 2. Taraf (Party) Yönetimi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Müvekkil profili (ad, iletişim, TC/VKN) | Every file needs a client record | Low |
| Karşı taraf kaydı (sigorta şirketi + muhatabı) | Opposing party is always an insurance company | Low |
| Sigorta şirketi yönetilebilir listesi | Predefined list editable in settings; avoids typos | Low |

### 3. STK Süreç Takibi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Başvuru aşaması kaydı (tarih, no, tutar) | Start of every STK file | Low |
| Raportör atama ve inceleme tarihleri | The raportör drives the timeline | Low |
| Bilirkişi kaydı (atanma tarihi, rapor tarihi) | Expert appointment is a tracked milestone | Low |
| Hakem atama ve karar tarihi | Final outcome depends on this | Low |
| Kararın tebliğ tarihi | Starts the itiraz süresi clock | Medium |
| İtiraz / iptal davası bağlantısı | STK → court escalation is common | Medium |

### 4. Mahkeme Süreci Takibi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Dava açılış tarihi ve dava no | Core identifier for court file | Low |
| Duruşma listesi (tarih + karar özeti) | Multiple hearings per case | Low |
| Tanık / bilirkişi kaydı | Expert and witness appointments tracked | Low |
| Karar aşaması (tarih, karar özeti) | Final outcome | Low |
| Tebligat tarihi | Starts temyiz/istinaf süresi | Medium |

### 5. Süre (Deadline) Takibi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Manuel süre girişi (tarih + etiket) | Lawyer knows which deadlines matter most | Low |
| Otomatik süre hesaplama — STK itiraz (tebliğden 10 gün) | HMK + STK Yönetmeliği based rule | Medium |
| Duruşma tarihinden önce uyarı (X gün öncesi) | Prevents missed hearings | Medium |
| Dashboard'da "yaklaşan süre" listesi | Top-of-mind for daily use | Medium |

### 6. Takvim Görünümü

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Aylık takvim — duruşma ve süre görünümü | Lawyers think in calendar terms | Medium |
| Tıklanabilir etkinlik → dosya detayına git | Navigation shortcut | Low |

### 7. Not ve Zaman Çizelgesi

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Dosya bazında serbest not alanı | Replaces handwritten notes | Low |
| Zaman çizelgesi (olaylar, tarih sıralı) | Audit trail for case history | Medium |

### 8. Belge Yönetimi (Temel)

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Belge yükleme (PDF, DOCX, görseller) | Consolidates paper + digital files | Medium |
| Belge listesi per dosya | Browse uploaded docs | Low |
| Belge silme / yeniden adlandırma | Basic file management | Low |

### 9. Finans Takibi (Temel)

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Gelen / giden ödeme kaydı per dosya | Replaces finance Excel sheet | Low |
| Harç ve masraf kaydı (dava harcı, bilirkişi ücreti vb.) | Court costs must be tracked | Low |
| Dosya bazında bakiye özeti | Simple debit/credit summary | Low |

### 10. Dilekçe Şablonu (Temel)

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| Şablon listesi (kasko, trafik, sağlık türüne göre) | Template selection is the starting point | Low |
| Değişken doldurma formu (dosyadan otomatik çekme) | Reduces data re-entry | Medium |
| DOCX/PDF çıktı | Lawyer needs a printable document | High |

### 11. Tek Kullanıcı Auth

| Feature | Why Required | Complexity |
|---------|--------------|------------|
| .env tabanlı şifre doğrulama + session cookie | Security without multi-user complexity | Low |

---

## Differentiating Features (nice-to-have, v2+)

Features that lift this above an Excel spreadsheet into a proper tool. None are required for v1, but they are high-value for continued use.

| Feature | Value | Complexity | Notes |
|---------|-------|------------|-------|
| STK online başvuru takibi (manuel veri eşleştirme) | Sync with sigortatahkim.org manually | Medium | UYAP-like pattern without API |
| İstinaf / Temyiz aşaması modülü | Full lifecycle for appealed cases | High | Out of scope v1 |
| Karşı taraf vekili / avukat kaydı | Useful for cross-case patterns | Low | Easy add-on |
| Dosya bazında e-posta / SMS taslakları | Client communication drafts | High | Needs SMTP or Twilio |
| Bildirim sistemi (tarayıcı push / e-posta) | Proactive deadline alerts | High | Needs service worker or SMTP |
| Raporlar: portföy, finansal, tahsilat | Management reporting | Medium | v1 basic, v2 full |
| Excel dışa aktarım | Exit strategy / backup | Low | Low dev cost |
| Toplu dosya aktarımı (Excel import) | Onboard existing files | High | Out of scope v1 |
| UYAP dava sorgulama ekran çekimi kaydı | Screenshot + note attachment | Medium | Manual workaround for no API |
| Hakem kararı özetleme (AI assist) | Fast review of arbitration decisions | Very High | Future only |
| Karşı taraf davranış analizi (sigorta şirketi istatistikleri) | Which insurer wins most? | High | Needs sufficient data volume |
| Tekrarlayan duruşma hatırlatıcısı | Weekly digest e-mail | Medium | Needs SMTP |

---

## Anti-Features (explicitly do not build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| UYAP API entegrasyonu | No public API exists; scraping is legally grey | Manual entry with structured fields that mirror UYAP format |
| Çok kullanıcılı rol sistemi | Solo lawyer; complexity far exceeds need | Single .env password |
| Mobil uygulama (native) | Desktop browser is the working context | Responsive but not mobile-first |
| Gerçek zamanlı bildirim servisi (v1) | Requires background process; offline-first conflicts | Dashboard "yaklaşan süreler" widget is enough |
| Fatura kesme / muhasebe entegrasyonu | Scope creep; e-fatura requires different system | Log payments; export for accountant |
| Otomatik belge OCR | High complexity, unreliable on Turkish PDFs | Manual naming + tagging |
| Blockchain / NFT dosya imzalama | No legal validity in Turkish courts; gimmick | Standard file checksums if tampering is a concern |

---

## Case File Data Model (suggested fields)

Grouped by the sekmeli (tabbed) UI described in PROJECT.md.

### A. Genel Bilgiler (Core Identity)

```
dosya_id          UUID, primary key
dosya_ref         String — internal reference (e.g. "2024-K-0042")
dosya_turu        Enum: STK | AsliyeTicaret | AsliyeHukuk
sigorta_turu      String (extensible): Kasko | Trafik | Saglik | Hayat | Diger
sigorta_sirketi   FK → sigorta_sirketi tablosu
porice_no         String — insurance policy number
hasar_no          String — claim number (hasar dosya no)
hasar_tarihi      Date
talepte_bulunan   String or FK → müvekkil
talepte_bulunan_tc_vkn  String
vekalet_tarihi    Date
acilis_tarihi     Date — when the file was opened in this system
durum             Enum: Aktif | Beklemede | Kazanildi | Kaybedildi | Arşiv
aciklama_notlar   Text (free field, supplement to timeline)
```

### B. Müvekkil / Taraflar (Karşı Taraflar sekmesi)

```
muvekkil_id       UUID, FK → muvekkillar
muvekkil_adi      String (denormalized for display)
muvekkil_tel      String
muvekkil_email    String
muvekkil_adres    Text

karsi_taraf_adi   String (sigorta şirketi adı or individual)
karsi_taraf_vekili String — opposing counsel name (optional)
karsi_taraf_tel   String (optional)
```

### C. STK Tahkim Verileri (Yargılama Süreci sekmesi — STK)

```
stk_basvuru_no       String — STK-assigned reference number
stk_basvuru_tarihi   Date
stk_kabul_tarihi     Date
stk_talep_tutari     Decimal — amount claimed in TRY
stk_raportör_adi     String
stk_raportör_atanma  Date
stk_bilirkisi_adi    String (optional)
stk_bilirkisi_atanma Date (optional)
stk_bilirkisi_rapor  Date (optional)
stk_hakem_adi        String
stk_hakem_atanma     Date
stk_karar_tarihi     Date
stk_karar_turu       Enum: Kabul | RedEksik | RedTamamen | KaynaklaştırmaKabul | KaynaklaştırmaRed
stk_karar_tutari     Decimal — awarded amount
stk_tebligat_tarihi  Date — starts 10-day itiraz clock
stk_itiraz_tarihi    Date (optional)
stk_itiraz_sonucu    String (optional)
stk_bagli_dava_id    FK → dava (for escalation to court)
```

### D. Mahkeme Verileri (Yargılama Süreci sekmesi — Mahkeme)

```
mahkeme_turu         Enum: AsliyeTicaret | AsliyeHukuk
mahkeme_adi          String — e.g. "İstanbul 3. Asliye Ticaret Mahkemesi"
mahkeme_sehir        String
esas_no              String — YYYY/NNNN format (e.g. "2024/1234")
karar_no             String — YYYY/NNNN format
dava_acilis_tarihi   Date
dava_degeri          Decimal — claim value for court
dava_turu            Enum: AlacakDavasi | TazminatDavasi | ItirazDavasi | IptalDavasi | Diger
davaci               String (usually müvekkil)
davali               String (usually sigorta şirketi)
yargilama_durumu     Enum: Devam | Karar | Temyiz | Kesinlesme | Arşiv
```

### E. Duruşmalar (Yargılama Süreci sekmesi — alt liste)

```
durusma_id      UUID
dosya_id        FK
durusma_tarihi  Date + Time
durusma_no      Integer (1st, 2nd, 3rd hearing...)
sonuc_ozeti     Text — what happened at the hearing
karar_ozeti     Text (only for final hearing)
sonraki_tarih   Date (next hearing date set at this hearing)
```

### F. Süreler / Görevler (Deadline tracking)

```
sure_id         UUID
dosya_id        FK
etiket          String — e.g. "STK itiraz süresi", "Beyan dilekçesi son günü"
son_tarih       Date
kaynak          Enum: Manuel | Otomatik
tetikleyen_alan String (e.g. "stk_tebligat_tarihi") — for auto-calculated
gun_sayisi      Integer — offset days (e.g. 10 for STK itiraz)
tamamlandi      Boolean
hatirlatma_gun  Integer — days before deadline to show alert (default: 3)
notlar          Text
```

### G. Belgeler / Dilekçeler

```
belge_id        UUID
dosya_id        FK
belge_adi       String
belge_turu      Enum: Dilekce | Karar | Bilirkisi | Sozlesme | Makbuz | Diger
dosya_yolu      String — relative path under /uploads
yuklenme_tarihi Datetime
boyut_byte      Integer
not             Text (optional)
```

### H. Dosya Finansı

```
islem_id        UUID
dosya_id        FK
tarih           Date
aciklama        String
tur             Enum: GelenOdeme | GitenOdeme | Harc | Masraf | Avans | Iade
tutar           Decimal
karsidan_mi     Boolean — paid by opposing party (e.g. court costs recovered)
makbuz_belge_id FK → belgeler (optional)
notlar          Text
```

---

## STK Process Stages & Data Points

The Sigorta Tahkim Komisyonu (STK) is an administrative arbitration body operating under the Insurance Supervisory Law (5684 sayılı Kanun). The process is governed by the Sigorta Tahkim Yönetmeliği.

**Confidence: MEDIUM** — Based on training knowledge of STK regulations. The stage names and sequence are accurate; specific day counts reflect the regulation as of training cutoff. Verify against current Yönetmelik (RBSDDK regulation) before hardcoding into süre calculator.

### Aşama 1: Başvuru (Application)

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Başvuru tarihi | stk_basvuru_tarihi | Day 0 for process clock |
| STK başvuru numarası | stk_basvuru_no | Assigned by STK portal |
| Talep tutarı (TL) | stk_talep_tutari | Amount in claim |
| Sigorta poliçe no | porice_no | Must match exactly |
| Hasar dosya no | hasar_no | Insurer's claim reference |
| Başvuru belgesi | — | Upload: başvuru formu + ekler |
| Başvuru harcı ödenip ödenmediği | — | Boolean, amount logged in finans |
| Kabuledilebilirlik kararı tarihi | stk_kabul_tarihi | STK decides within ~15 days |

### Aşama 2: Raportör İncelemesi (Reporter Review)

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Raportör adı | stk_raportör_adi | Assigned by STK |
| Raportör atanma tarihi | stk_raportör_atanma | Starts the examination period |
| Sigorta şirketine tebligat tarihi | — | Insurer gets a response deadline |
| Sigorta şirketi cevap süresi | — | Typically 15 days after notification |
| Raportör ön raporu tarihi | — | Optional milestone to track |
| Bilirkişiye sevk tarihi | stk_bilirkisi_atanma | If expert examination needed |
| Bilirkişi adı / kurumu | stk_bilirkisi_adi | Individual or institution |
| Bilirkişi raporu tarihi | stk_bilirkisi_rapor | Critical milestone |

### Aşama 3: Hakem Ataması ve Karar (Arbitrator & Decision)

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Hakem adı | stk_hakem_adi | Single arbitrator up to threshold; panel above |
| Hakem atanma tarihi | stk_hakem_atanma | |
| Tarafların hakeme beyan tarihleri | — | Log as notes or separate events |
| Karar tarihi | stk_karar_tarihi | |
| Karar türü | stk_karar_turu | Kabul / Kısmen kabul / Red |
| Hükmedilen tutar | stk_karar_tutari | |
| Karar tebliğ tarihi (müvekkile) | stk_tebligat_tarihi | **Starts itiraz süresi clock** |

### Aşama 4: İtiraz / İptal Davası (Challenge)

| Data Point | Field Name | Notes |
|------------|------------|-------|
| İtiraz tarihi | stk_itiraz_tarihi | Must be within 10 days of tebligat |
| İtiraz mahkemesi | — | Asliye Ticaret Mahkemesi |
| İtiraz dava esas no | — | Links to mahkeme record |
| İtiraz sonucu | stk_itiraz_sonucu | Onama / Bozma / Red |
| Kesinleşme tarihi | — | Final and binding date |

### STK Timeline (typical durations)

```
Başvuru → Kabul kararı:           ~15 gün
Kabul → Raportör ataması:         ~1-2 hafta
Raportör süreci:                  1-3 ay (bilirkişisiz)
Bilirkişi dahil ise:              +2-4 ay ek süre
Hakem kararı:                     ~1-2 ay
Toplam ortalama STK süreci:       4-8 ay
```

---

## Mahkeme Process Stages & Data Points

Applies to both Asliye Ticaret Mahkemesi (commercial) and Asliye Hukuk Mahkemesi (civil), which follow HMK (Hukuk Muhakemeleri Kanunu, Law No. 6100).

**Confidence: HIGH** — HMK procedure is well-established.

### Dava Türleri (for insurance disputes)

| Dava Türü | Context |
|-----------|---------|
| Alacak davası (tahsilat) | Primary type — claiming insurance payout |
| Tazminat davası | Damages beyond policy amount |
| STK hakem kararına itiraz | Challenging an STK arbitration award |
| İptal davası | Cancelling an insurance contract |
| Tespit davası | Declaratory judgment on policy interpretation |

### Aşama 1: Dava Açılışı

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Dava açılış tarihi | dava_acilis_tarihi | |
| Mahkeme adı ve şehri | mahkeme_adi, mahkeme_sehir | |
| Esas numarası | esas_no | Format: YYYY/NNNN |
| Dava değeri (tebliğ harcı matrahı) | dava_degeri | In TRY |
| Dava harcı ödeme tarihi | — | Log in finans |
| Tebligat gideri avansı | — | Log in finans |
| Davacı / Davalı | davaci, davali | |
| Dava dilekçesi | — | Upload |

### Aşama 2: Cevap ve Ön İnceleme

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Cevap dilekçesi süresi | — | 2 weeks from service (HMK 127) |
| Ön inceleme duruşma tarihi | durusma (tur: ön inceleme) | First hearing |
| Sulh görüşmesi | — | Required under HMK 137 |

### Aşama 3: Tahkikat Duruşmaları (Hearings)

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Duruşma tarihi | durusma_tarihi | |
| Duruşma konusu | sonuc_ozeti | Brief summary: bilirkişi, tanık, etc. |
| Tanık dinleme tarihi | — | Notes field |
| Bilirkişi ataması | — | Track separately or as a duruşma event |
| Bilirkişi raporu tarihi | — | Critical milestone |
| Ek bilirkişi / itiraz süresi | — | Manual süre entry |
| Yazışma (müzekkere) tarihleri | — | Notes |

### Aşama 4: Karar

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Karar tarihi | — | Date of oral decision at hearing |
| Gerekçeli karar yazım tarihi | — | May come weeks after oral decision |
| Karar türü | — | Kabul / Kısmen kabul / Red |
| Karar no | karar_no | Format: YYYY/NNNN |
| Hükmedilen tutar | — | In finans tablosu |

### Aşama 5: Tebligat ve Kanun Yolu

| Data Point | Field Name | Notes |
|------------|------------|-------|
| Kararın tebliğ tarihi | — | Starts appeal clock |
| İstinaf başvuru süresi | — | 2 hafta (HMK 345) — auto-süre |
| İstinaf başvuru tarihi | — | Out of scope v1, manual note |
| Kesinleşme tarihi | — | When no further appeal |

### Dava No Formatı

```
Esas No:   YYYY/NNNN   (e.g. 2024/1234)
Karar No:  YYYY/NNNN   (e.g. 2025/876)
```

UYAP format has expanded this with court code prefix in some outputs: `2024/Esas-1234` but the canonical lawyer-facing format is `YYYY/NNNN`. Recommend storing as plain string with regex validation `^\d{4}\/\d+$` to allow flexibility.

### UYAP Integration Notes

**Confidence: MEDIUM** — There is no public API for UYAP (Ulusal Yargı Ağı Bilişim Sistemi). Lawyers access it via a smart card (e-imza) portal. No third-party integration is legally permissible without Bar Association mediation.

Recommended pattern: Manual data entry only. The app's field structure should mirror UYAP's terminology exactly so copy-paste from UYAP is frictionless:
- Use "Esas No" and "Karar No" (UYAP terminology)
- Use "Mahkeme" dropdown with Turkish naming conventions
- Consider a "UYAP'tan kopyala" helper note in the UI

---

## Süre (Deadline) Tracking Rules

Turkish procedural deadlines are governed by HMK, the STK Yönetmeliği, and insurance-specific laws. All deadlines below are calendar days unless noted as "iş günü" (working days).

**Confidence: MEDIUM** — These rules reflect the law as of training cutoff (August 2025). Day counts for STK itiraz and HMK deadlines are well-established; always verify against current regulation text before automating.

### STK Deadlines

| Süre | Trigger | Duration | Law Reference | Auto-calculate? |
|------|---------|----------|---------------|-----------------|
| STK başvuru kabulü | Başvuru tarihi | ~15 takvim günü | STK Yönetmeliği | No (STK decides) |
| Sigorta şirketi cevabı | Şirkete tebligat | 15 takvim günü | STK Yönetmeliği | YES |
| **STK karara itiraz** | **Karar tebligat tarihi** | **10 takvim günü** | **Sigorta K. 5684/30** | **YES — critical** |
| İtiraz mahkemesi esasa giriş | İtiraz tarihi | Mahkeme takvimi | — | No |

### HMK Deadlines (Mahkeme)

| Süre | Trigger | Duration | Law Reference | Auto-calculate? |
|------|---------|----------|---------------|-----------------|
| Cevap dilekçesi | Dava tebligati (davalıya) | 2 hafta (14 gün) | HMK 127 | YES |
| Cevaba cevap (replik) | Cevap dilekçesi tebliği | 2 hafta | HMK 136 | YES |
| Repliğe cevap (düplik) | Replik tebliği | 2 hafta | HMK 136 | YES |
| Delil bildirimi | Ön inceleme duruşması | Hakimin verdiği süre | HMK — | Manual |
| Bilirkişi raporu itiraz | Rapora tebligat | 2 hafta | HMK 281 | YES |
| **İstinaf başvurusu** | **Karar tebligat tarihi** | **2 hafta (14 gün)** | **HMK 345** | **YES — critical** |
| Temyiz başvurusu | İstinaf kararı tebligati | 2 hafta | HMK 361 | YES |

### Tatil Günü Kuralı

HMK 93: If a deadline falls on an official holiday (resmi tatil) or weekend, it extends to the next working day. The süre calculator must account for:
- Turkish national holidays (15 dates)
- Weekends (Saturday + Sunday)
- Adli tatil (judicial recess): July 20 — August 31 each year

**Adli tatil rule (HMK 103):** Adli tatil süreyi durdurur (pauses the clock) for most procedural deadlines. This is complex — flag deadlines that fall within adli tatil for manual review rather than auto-adjust in v1.

### Recommended Implementation Approach

```
v1: Manual süre entry + dashboard alert (X days before)
v1: Auto-calculate STK itiraz (10 days from stk_tebligat_tarihi)
v1: Auto-calculate istinaf (14 days from kararın tebligat tarihi)
v1: Auto-calculate cevap dilekçesi (14 days from dava tebligati)
v2: Holiday-aware calculation with adli tatil logic
v2: All HMK deadline automations
```

---

## Petition Template Variables

Turkish insurance dispute petitions follow a standard structure. Below are the variables extracted from the most common petition types.

**Confidence: HIGH** — These are standard Turkish legal document variables, consistent across practice.

### Universal Variables (all petitions)

```
{{MAHKEME_ADI}}           Adresed court name
{{ESAS_NO}}               Existing case number (if filing into pending case)
{{TARIH}}                 Document date
{{DAVACI_ADI_SOYADI}}     Plaintiff full name
{{DAVACI_TC}}             TR identity number
{{DAVACI_ADRES}}          Plaintiff address
{{DAVACI_TEL}}            Plaintiff phone
{{AVUKAT_ADI_SOYADI}}     Attorney full name
{{AVUKAT_BARO_NO}}        Bar registration number
{{AVUKAT_ADRES}}          Attorney address
{{AVUKATLUK_BUROSU}}      Law firm name (if any)
{{DAVALI_ADI}}            Defendant name (insurance company)
{{DAVALI_ADRES}}          Defendant address
{{KONU}}                  Brief subject line
{{ACIKLAMALAR}}           Body text (partially templated)
{{SONUC_VE_ISTEM}}        Prayer for relief
{{HUKUKI_SEBEPLER}}       Legal grounds
{{DELILLER}}              Evidence list
{{EKLER}}                 Attachments list
```

### Insurance-Specific Variables

```
{{PORICE_NO}}             Policy number
{{PORICE_TARIHI}}         Policy date / period
{{HASAR_NO}}              Claim file number
{{HASAR_TARIHI}}          Date of loss event
{{SIGORTA_TURU}}          Type of insurance (Kasko, Trafik, Sağlık, etc.)
{{PLAKA}}                 Vehicle plate (motor only)
{{ARAC_MARKA_MODEL}}      Vehicle make/model (motor only)
{{TALEP_TUTARI}}          Claimed amount in TRY
{{FAIZ_BASLANGIC_TARIHI}} Interest start date
{{FAIZ_TURU}}             Interest type (yasal faiz / reeskont / TCMB)
{{BRANS_HASAR_BILGISI}}   Specific loss description by insurance type
```

### STK-Specific Variables

```
{{STK_BASVURU_NO}}        STK application reference number
{{STK_BASVURU_TARIHI}}    Application date
{{STK_KABUL_TARIHI}}      Acceptance date
{{STK_HAKEM_ADI}}         Arbitrator name
{{STK_KARAR_TARIHI}}      Decision date
{{STK_KARAR_NO}}          Decision reference
{{STK_TEBLIGAT_TARIHI}}   Service date (for itiraz petition)
{{STK_KARAR_OZETI}}       Brief summary of arbitration outcome
```

### Template Types to Prioritize in v1

| Dilekçe Türü | Dosya Türü | Priority |
|--------------|------------|---------|
| STK başvuru dilekçesi | STK | High |
| STK itiraz dilekçesi | STK → Mahkeme | High |
| Alacak davası açılış dilekçesi | Mahkeme | High |
| Cevap dilekçesi | Mahkeme | Medium |
| Bilirkişi raporu itiraz dilekçesi | Mahkeme | Medium |
| Islah dilekçesi | Mahkeme | Low |
| Karar düzeltme talebi | Mahkeme | Low |

---

## What Makes This Better Than Excel

| Capability | Excel | This App | Impact |
|------------|-------|----------|--------|
| Process stage visibility | Hidden in columns | Visual stage tracker per file | Never miss a stage |
| Deadline calculation | Manual formula, breaks with dates | Auto-calc from event dates | Prevents missed süreler |
| Cross-file calendar | Impossible | Single calendar for all files | No hearing conflicts |
| 200-file navigation | Slow, no full-text search | Indexed search + filters | Daily time savings |
| Document linking | File paths only, break on move | DB-linked with upload storage | Docs never lost |
| Petition generation | Copy-paste per file | Template + autofill from DB | Hours saved per petition |
| Financial overview | Separate workbook | Integrated per file + aggregate | Billing accuracy |
| Audit trail | No | Timestamped timeline per file | Dispute protection |

---

## Feature Dependencies

```
Müvekkil profili → Dosya oluşturma
Dosya oluşturma → STK süreci takibi
Dosya oluşturma → Mahkeme süreci takibi
STK kararı tebliğ tarihi → İtiraz süresi otomatik hesaplama
Mahkeme karar tebliğ tarihi → İstinaf süresi otomatik hesaplama
Duruşma kaydı → Takvim görünümü
Dilekçe şablonu → Dosya verileri (auto-fill kaynak)
Belge yükleme → Dilekçeye ek bağlama
Finans kaydı → Rapor modülü
```

---

## MVP Recommendation (v1 Scope)

**Build in v1:**
1. Dosya CRUD + arama/filtre (200+ dosya performansı)
2. STK süreci veri modeli + aşama takibi
3. Mahkeme süreci veri modeli + duruşma listesi
4. Manuel süre girişi + 3 otomatik hesaplama (STK itiraz, istinaf, cevap dilekçesi)
5. Takvim görünümü (ay bazlı, duruşma + süre)
6. Belge yükleme (temel)
7. Finans takibi (temel)
8. Dilekçe şablonu → PDF (en az 3 şablon)
9. Dashboard: yaklaşan süreler + aktif dosya özeti

**Defer to v2:**
- Holiday-aware süre hesaplama (adli tatil)
- İstinaf / Temyiz modülü
- Raporlama (portföy / finansal PDF export)
- E-posta / bildirim sistemi
- Excel dışa aktarım

---

*Confidence: MEDIUM overall. Turkish legal procedure (HMK, STK Yönetmeliği) knowledge is HIGH. Specific day counts for procedural deadlines are MEDIUM — verify against current regulation text. No web sources available; findings based on training data through August 2025.*
