# Phase 3: STK & Mahkeme Process Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-12
**Phase:** 03-stk-mahkeme-process-tracking
**Mode:** discuss
**Areas analyzed:** Çift süreç takibi, Aşama ilerletme UX, Veri noktaları formu, Duruşma kaydı UX

## Gray Areas Presented

| Area | Description |
|------|-------------|
| Çift süreç takibi | STK dosyası mahkemeye taşındığında aynı dosyada iki süreç mi, yoksa yeni dosya mı? |
| Aşama ilerletme UX | İleri Al butonu, dropdown, yoksa stepper tıklama mı? |
| Veri noktaları formu | Tüm alanlar tek formda mı, aşamaya göre koşullu mu? |
| Duruşma kaydı UX | Dialog (modal) mi, inline accordion mu? |

## Decisions Made

### Çift Süreç Takibi
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Aynı dosyada hem STK hem mahkeme süreci | User confirmed | dosya.tur = 'STK' kalsın, surec_detay JSON her ikisini taşır |

- **User decision:** Aynı dosyada her ikisi — STK dosyası itiraz davası açılınca aynı dosya altında mahkeme süreci de başlatılabilir.

### Aşama İlerletme UX
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Sıralı "İleri Al" butonu | User confirmed | — |

- **User decision:** "İleri Al →" butonu, sıralı ilerleme, atlama yok.

### Veri Noktaları Formu
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Stepper altında tek form, tüm alanlar görünür | User confirmed | — |

- **User decision:** Stepper altında tek form; tüm STK/mahkeme veri alanları her zaman görünür; kaydet ayrı aksiyon.

### Duruşma Kaydı UX
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| shadcn Dialog (modal) | User confirmed | Dialog bileşeni Phase 2'de kurulu |

- **User decision:** Dialog (modal) — "Duruşma Ekle" butonu dialog açar, düzenle de aynı dialog.

## Corrections Made

No corrections — all recommended options confirmed by user.

## Deferred Ideas

- Aşama geri alma → reddedildi
- Dropdown aşama seçimi → reddedildi
- İstinaf/Temyiz modülü → v2 Out of Scope
