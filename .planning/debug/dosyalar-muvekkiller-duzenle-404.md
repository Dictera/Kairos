---
status: resolved
trigger: "Dosyalar ve müvekkiller sekmesinde düzenle sayfaları 404 hatası veriyor"
created: 2026-04-14T00:00:00.000Z
updated: 2026-04-14T00:00:00.000Z
---

## Root Cause
`dosya-form.tsx` dosyasındaki 2 TypeScript hatası build'i engelliyor, `/duzenle` sayfaları derlenemiyordu → 404.

## Fix
1. `hasar_dosya_no` alanında `{...field}` yerine `value={field.value ?? ''}` — `null` → `string` dönüşümü
2. `kusur_orani_karsi` kontrolünde `!== null` → `!= null` — hem `null` hem `undefined` yakalar