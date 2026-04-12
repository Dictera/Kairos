---
status: complete
phase: 02-core-case-management
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server boots without errors, database migration completes, and the dashboard loads at http://localhost:3000 without a crash or blank screen.
result: pass

### 2. Müvekkil Listesi
expected: Navigate to /muvekkiller. A paginated table appears with columns for client name, TC/Vergi No, phone, email. Typing in the search box filters results in real time (Turkish-aware, e.g. "şahin" finds "Şahin").
result: pass

### 3. Yeni Müvekkil Oluştur
expected: Click the add button. A form appears with fields: Ad, Soyad, Telefon, E-posta, TC/Vergi No, Adres, Notlar — all with Turkish validation messages. Fill required fields and submit. A success toast appears and you are redirected to the new client's detail page.
result: pass

### 4. Müvekkil Detay
expected: On the detail page, client info is shown in a card. Below it, a linked dosyalar table lists any case files for this client. If no dosyalar exist, an empty state message is shown.
result: pass

### 5. Müvekkil Düzenle
expected: Click the edit action from the detail page or list menu. The edit form pre-fills with existing data. Changing a field and saving shows a success toast and redirects back to the detail page with updated info.
result: issue
reported: "success tost çıkmadı ama bilgileri güncelledi"
severity: minor

### 6. Müvekkil Silme — Bağlı Dosyası Olan
expected: Try to delete a müvekkil who has linked dosyalar. An inline error banner appears explaining the client cannot be deleted while case files exist (no confirmation dialog shown).
result: issue
reported: "müvekkil detayda çıkıyor ama direkt müvekkiller sayfasından silmeye çalıştığımda silmiyor ama herhangi bir uyarı tostu da çıkmıyor"
severity: minor

### 7. Müvekkil Silme — Bağlı Dosyası Olmayan
expected: Try to delete a müvekkil with no dosyalar. An AlertDialog appears asking for confirmation. Confirming removes the client and returns you to the list.
result: pass

### 8. Dosya Listesi ve Filtreler
expected: Navigate to /dosyalar. A paginated table appears with 7 columns. The toolbar shows a search box plus 3 filter dropdowns (Tur, Durum, Sigorta Türü) and a tarih range picker. Applying a filter narrows the results.
result: pass

### 9. Yeni Dosya Oluştur
expected: Click the add button. A form appears with 8 fields including müvekkil select, dosya_no, tur, sigorta türü. Submitting a duplicate dosya_no shows an inline field error. Submitting valid data creates the dosya and navigates to its detail page.
result: issue
reported: "duplicate dosya no yu eklemiyor ama herhangi bir uyarı tostu çıkmıyor"
severity: minor

### 10. Dosya Detay — 6 Tab Shell
expected: The detail page shows 6 tabs in the correct order. The first two tabs (Genel Bilgiler, Karşı Taraflar) show real content. The remaining 4 tabs show a lock icon and "Bu bölüm henüz yapılandırılmadı." message. Switching tabs updates the URL hash.
result: pass

### 11. Genel Bilgiler Tab
expected: The Genel Bilgiler tab shows all dosya fields including muvekkil_plaka. Fields are formatted in Turkish (e.g. currency, date). A link to the linked müvekkil detail page is present.
result: issue
reported: "tüm dosya alanları görünüyor ama genel bilgiler tabında poliçe numarası varken dosya ekleme formunda herhangi bir poliçe ekleme alanı bulunmuyor"
severity: minor

### 12. Karşı Taraflar Tab
expected: The Karşı Taraflar tab shows counter-party data in read mode. An edit button switches to edit mode with a form. Saving updates the data and returns to read mode. karsitaraf_plaka field is present.
result: pass

### 13. Dosya Düzenle + Arşivle
expected: From the edit page, the form pre-fills with existing data including select fields (müvekkil, sigorta türü, karşı sigorta şirketi). Changing a field and saving shows a success toast and redirects. The edit page also has an Arşivle action.
result: issue
reported: "dosya düzenleme bölümüne gittiğimde müvekkil, sigorta türü karşı sigorta şirketi otomatik olarak gelmiyor"
severity: major

### 14. Ayarlar — Sigorta Şirketleri CRUD
expected: Navigate to /ayarlar. The Sigorta Şirketleri section shows a table. Click "Ekle" — a dialog opens with an Ad field. Submitting adds the entry and shows "Kaydedildi." toast. Edit and delete also work with confirmation dialog for delete.
result: issue
reported: "çalışıyor ama kaydedildi tostu çıkmıyor"
severity: minor

### 15. Ayarlar — Mahkemeler CRUD
expected: The Mahkemeler / Kurumlar section shows a table with Ad and Şehir columns. Adding a new entry shows both Ad and Şehir fields in the dialog. Editing pre-fills both fields.
result: issue
reported: "evet çalışıyor ama bundada herhangi bir kaydedildi tostu gelmiyor"
severity: minor

### 16. Ayarlar — Sigorta Türleri
expected: The Sigorta Türleri section shows 4 pre-seeded entries: Kasko, Trafik/ZMSS, Sağlık, Hayat. New entries can be added. Existing ones can be edited or deleted.
result: issue
reported: "evet çalışıyor ancak bunda da kaydedildi tostu yok"
severity: minor

### 17. Ayarlar — Şifre Değiştirme Kılavuzu
expected: A static card titled "Şifre Değiştirme" is visible in the Ayarlar page. It shows a step-by-step guide for updating the APP_PASSWORD in the .env file. No form or tRPC call — purely informational.
result: pass

## Summary

total: 17
passed: 9
issues: 8
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Success toast appears after saving edited müvekkil"
  status: failed
  reason: "User reported: success tost çıkmadı ama bilgileri güncelledi"
  severity: minor
  test: 5
  root_cause: "<Toaster> from sonner missing from app/layout.tsx — toast() calls are no-ops without it"
  artifacts:
    - path: "app/layout.tsx"
      issue: "No <Toaster> component rendered"
  missing:
    - "Add <Toaster richColors /> to layout — fixed"
  debug_session: ""

- truth: "Submitting a duplicate dosya_no shows an inline field error or toast"
  status: failed
  reason: "User reported: duplicate dosya no yu eklemiyor ama herhangi bir uyarı tostu çıkmıyor"
  severity: minor
  test: 9
  root_cause: "onError checked err.message for 'conflict' but router throws Turkish message; err.data.code === 'CONFLICT' is the correct check"
  artifacts:
    - path: "components/dosya/dosya-form.tsx"
      issue: "onError used message string matching instead of error code"
  missing:
    - "Check err.data?.code === 'CONFLICT' — fixed"
  debug_session: ""

- truth: "Dosya edit form pre-fills select fields (müvekkil, sigorta türü, karşı sigorta şirketi) with existing values"
  status: failed
  reason: "User reported: dosya düzenleme bölümüne gittiğimde müvekkil, sigorta türü karşı sigorta şirketi otomatik olarak gelmiyor"
  severity: major
  test: 13
  root_cause: "Form rendered before lookup lists (muvekkilData, sigortaTuruList, sigortaSirketiList) loaded; Radix Select shows placeholder when value has no matching item at mount time"
  artifacts:
    - path: "components/dosya/dosya-form.tsx"
      issue: "Skeleton only waited for dosyaData, not lookup lists"
  missing:
    - "Extend loading check to include lookupsReady — fixed"
  debug_session: ""

- truth: "Success toast appears after add/edit in Ayarlar CRUD sections"
  status: failed
  reason: "User reported: çalışıyor ama kaydedildi tostu çıkmıyor"
  severity: minor
  test: 14
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Police_no is settable during dosya creation, not only via Karşı Taraflar tab after creation"
  status: failed
  reason: "User reported: genel bilgiler tabında poliçe numarası varken dosya ekleme formunda herhangi bir poliçe ekleme alanı bulunmuyor"
  severity: minor
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Deleting a müvekkil with linked dosyalar from the list page shows an error toast"
  status: failed
  reason: "User reported: müvekkil detayda çıkıyor ama direkt müvekkiller sayfasından silmeye çalıştığımda silmiyor ama herhangi bir uyarı tostu da çıkmıyor"
  severity: minor
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
