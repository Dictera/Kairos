---
status: resolved
trigger: "dosyalarda düzenleye bastığımda bazı verileri mevcut olandan otomatik çekmiyor"
created: 2026-04-17T00:00:00.000Z
updated: 2026-04-17T00:00:00.000Z
---

## Symptoms

- page: Karşı Taraflar tab → Düzenle butonu (karsitaraflar-tab.tsx)
- actual_behavior: Avukat seçimi ve diğer alanlar "Düzenle"ye basıldığında boş geliyordu
- affected_fields: avukat_id (dropdown), sigorta_sirketi_id, sürücü metin alanları
- expected_behavior: Tüm alanlar mevcut taraf kaydıyla dolu gelmeli

## Root Cause

`useForm`'un `defaultValues` yalnızca ilk render'da uygulanır. "Düzenle" butonuna basıldığında form eski/boş state'ini gösteriyordu. Ek olarak, `sigorta_sirketi_id` değişimini izleyen `useEffect`, `form.reset()` sırasında tetiklenip `avukat_id`'yi null'a sıfırlıyordu.

## Fix

`karsitaraflar-tab.tsx` — `handleStartEditing` fonksiyonu eklendi:
1. `isMounted.current = false` — reset sırasındaki `selectedSirketId` değişiminin avukat_id'yi silmesini engeller
2. `form.reset(taraf değerleri)` — güncel DB verileriyle tüm alanları yeniden doldurur
3. `setIsEditing(true)` — formu açar

Her iki "Düzenle" butonu `handleStartEditing`'i kullanacak şekilde güncellendi.

## Files Changed

- components/dosya/karsitaraflar-tab.tsx
