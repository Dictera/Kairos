# Phase 5: Calendar View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 05-calendar-view
**Areas discussed:** Layout style, Navigation, Event popover, Multi-event handling, Empty day, Data query, Empty month

---

## Layout Style

| Option | Description | Selected |
|--------|-------------|----------|
| Küçük dot/badge | Her gün hücresinin altında renkli noktalar (🔴 süre, 🔵 duruşma) | |
| Inline badge sayısı | Her gün hücresinde "3 süre, 2 duruşma" gibi sayı badge'i | ✓ |
| Highlight + tooltip | Event'li günler turuncu/renkli arka plan, hover'da tooltip | |

**User's choice:** Inline badge sayısı
**Notes:** Temiz, bilgi yoğun görünüm tercih edildi

---

## Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Buton ile | Calendar'ın kendi nav butonları (ChevronLeft/Right) | |
| Ay seçici dropdown | Üstte ay+yll dropdown ile direkt jump | |
| Her ikisi | Hem nav butonları hem dropdown — en esnek | ✓ |

**User's choice:** Her ikisi
**Notes:** Kullanıcı hem incremental navigation hem direct jump yapabilmeli

---

## Event Popover Content

| Option | Description | Selected |
|--------|-------------|----------|
| Sadece case link | Event listesi değil, sadece 'Dosya #42 - Ahmet Yılmaz' link | |
| Event özeti | Her event için: tür badge'i + dosya no + müvekkil adı + (duruşma ise saat) — tüm liste tıklanabilir | ✓ |
| Sadece kritik süre | Süre öncelikli göster, duruşma sadece dot olarak kalsın | |

**User's choice:** Event özeti
**Notes:** Tüm event'ler tıklanabilir olmalı

---

## Multi-Event Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Önce süre, sonra duruşma | Süre öncelikli — yargılama süresi kritik. Sonra duruşmalar chronologically. | ✓ |
| Tür badge'ine göre ayır | Ayrı section'lar: 'Süreler' ve 'Duruşmalar' | |
| Hepsi karışık chronological | Sıralama yok, hepsi bir listede | |

**User's choice:** Önce süre, sonra duruşma
**Notes:** Süre öncelikli — yargılama süresi kritik

---

## Empty Day Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Sessiz / hiçbir şey | Popover açılmaz — boş günlere tıklamak yaygın davranış | ✓ |
| 'Bu gün için event yok' mesajı | Tıklandığında kısa tooltip mesajı | |
| Dosya oluşturma shortcut | Boş güne tıklayınca o gün için yeni dosya/durusma ekleme shortcut'ı | |

**User's choice:** Sessiz / hiçbir şey
**Notes:** Boş günlere tıklamek yaygın davranış, her seferinde uyarı rahatsız edici

---

## Data Query Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Sadece görünen ay | Sadece o ayın verisini çek — basit, performanslı. Next/prev ay için yeni query. | ✓ |
| Görünen + bir sonraki ay | O ay + next ay'ı birden çek | |
| Tüm aktif dosyalar | Tüm dosyaların süre/durusma verisini çek, client-side filter | |

**User's choice:** Sadece görünen ay
**Notes:** Basit ve performanslı

---

## Empty Month Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Boş calendar | Sıradan calendar grid, hiç event yok | ✓ |
| İnfo message | Ayın altında 'Bu ay için duruşma veya süre bulunamadı' mesajı | |
| Quick filter links | 'Bugün', 'Bu hafta', 'Yaklaşan 30 gün' için hızlı filter linkleri | |

**User's choice:** Boş calendar
**Notes:** Özel empty state yerine normal calendar gösterilsin

---

*Discussion completed: 2026-04-13*
