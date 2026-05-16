# Testing

<!-- GSD:generated -->

## Test Runner

Proje **Vitest** kullanır. Node ortamında çalışır; tarayıcı simülasyonu yoktur.

```bash
pnpm test         # Tüm testleri bir kez çalıştır
pnpm run test:watch # İzleme modu — dosya değişikliğinde yeniden çalışır
```

## Test Structure

```
tests/
  setup.ts                    — Vitest global setup
  fixtures/
    test-template.docx         — Şablon testleri için fixture
  *.test.ts                   — Entegrasyon ve bileşen testleri

lib/
  docx/__tests__/
    archive.test.ts            — Arşiv transactional lojik
    variable-registry.test.ts  — Değişken kayıt defteri
```

### Test File Naming

Test dosyaları faz numarasıyla öneklidir (ör. `16-sablon-router.test.ts`) — hangi geliştirme fazında eklendiğini gösterir. Bu kural bilgilendiricidir; test koşma sırası üzerinde etkisi yoktur.

## Test Categories

### Unit Tests (lib/)

`lib/docx/__tests__/` altındaki testler saf birim testleridir. Veritabanı ve dosya sistemi gerektirmeyen deadline hesaplama, arşiv path lojik ve değişken registry testleri burada yer alır.

### Router Integration Tests (tests/)

tRPC router'ları `createCallerFactory` ile doğrudan çağrılır; HTTP katmanı bypass edilir. Veritabanı erişimi gerçek `db.sqlite` üzerinden gerçekleşir — mock kullanılmaz.

Test bazlı DB izolasyonu için her test kendi fixture verilerini oluşturur ve `afterAll` / `afterEach` hook'larında temizler.

### Structural / Snapshot Tests

Bazı testler kaynak dosyayı `readFileSync` ile okuyup belirli pattern'ların varlığını doğrular (ör. `'use client'` direktifi, belirli import'lar, bileşen başlıkları). Bu testler component sözleşmelerini korumaya yarar.

### Python Sidecar Tests

```bash
cd scripts/docx-pipeline
python -m pytest                     # Tüm sidecar testleri
python test_filters.py               # Jinja2 filter testleri
python test_integration.py           # Entegrasyon senaryoları
```

Sidecar testleri Node.js test koşusundan bağımsızdır.

## Vitest Configuration

`vitest.config.ts`:

```typescript
{
  test: {
    globals: true,           // describe/it/expect global scope'ta
    environment: 'node',     // Tarayıcı simülasyonu yok
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',              // Ana test dizini
      'lib/**/__tests__/**/*.test.ts',   // lib altındaki co-located testler
    ],
  }
}
```

## Writing New Tests

### Router test örneği

```typescript
import { describe, it, expect } from 'vitest'
import { dosyaRouter } from '@/lib/trpc/routers/dosya'

// Mock auth context
const ctx = { session: { isLoggedIn: true } } as any
const caller = dosyaRouter.createCaller(ctx)

describe('dosyaRouter', () => {
  it('lists dosyalar', async () => {
    const result = await caller.list({ q: '' })
    expect(Array.isArray(result)).toBe(true)
  })
})
```

### Test Isolation

Entegrasyon testlerinde veritabanına veri yazan testler mutlaka `afterAll` içinde temizleme yapmalıdır:

```typescript
afterAll(async () => {
  await db.delete(dosya).where(eq(dosya.dosya_no, 'TEST-001'))
})
```

## Coverage

```bash
pnpm exec vitest run --coverage
```

Coverage raporu `coverage/` dizinine yazılır (git dışı).

## What Is Not Tested

- UI bileşen render (DOM simülasyonu yok)
- E2E akışlar (Playwright kurulumu opsiyonel)
- Performans altı yük koşulları

Playwright projede bağımlılık olarak mevcuttur (`@playwright/test`) fakat aktif E2E test suit'i yoktur.
