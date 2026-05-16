<!-- generated-by: gsd-doc-writer -->
# Testing

## Test Framework and Setup

Proje **Vitest** kullanır (v4.1.5). Node ortamında çalışır; tarayıcı simülasyonu yoktur. Coverage için `@vitest/coverage-v8` paketi yüklüdür.

## Running Tests

```bash
pnpm test               # Tüm testleri bir kez çalıştır (vitest run)
pnpm run test:watch     # İzleme modu — dosya değişikliğinde yeniden çalışır
```

## Test Structure

```
tests/
  setup.ts                         — Vitest global setup (minimal, boş hook'lar)
  fixtures/
    test-template.docx             — Şablon testleri için fixture
  *.test.ts                        — Entegrasyon ve router testleri (faz numarası önekli)
  lib/
    trpc.test.ts                   — tRPC şema testleri
    validation.test.ts             — Doğrulama testleri
    schema.test.ts                 — Şema birim testleri
    pipeline/
      health-check.test.ts         — Pipeline sağlık kontrol testleri
      config.test.ts               — Pipeline yapılandırma testleri
      error-codes.test.ts          — Hata kodu testleri
    services/
      docx-pipeline.test.ts        — DOCX pipeline servis testleri
    trpc/
      routers/
        pipeline.test.ts           — Pipeline router testleri

lib/
  docx/__tests__/
    archive.test.ts                — Arşiv transactional lojik
    variable-registry.test.ts      — Değişken kayıt defteri
```

### Test File Naming

Test dosyaları faz numarasıyla öneklidir (ör. `16-sablon-router.test.ts`) — hangi geliştirme fazında eklendiğini gösterir. Bu kural bilgilendiricidir; test koşma sırası üzerinde etkisi yoktur.

## Test Categories

### Unit Tests (lib/)

`lib/docx/__tests__/` altındaki testler saf birim testleridir. Veritabanı ve dosya sistemi gerektirmeyen deadline hesaplama, arşiv path lojik ve değişken registry testleri burada yer alır.

### Router Integration Tests (tests/)

tRPC router'ları `createCaller` metodu ile doğrudan çağrılır; HTTP katmanı bypass edilir. Veritabanı erişimi gerçek `db.sqlite` üzerinden gerçekleşir — mock kullanılmaz.

Test bazlı DB izolasyonu için her test kendi fixture verilerini oluşturur ve `afterAll` / `afterEach` hook'larında temizler.

### Structural / Snapshot Tests

Bazı testler kaynak dosyayı `readFileSync` ile okuyup belirli pattern'ların varlığını doğrular (ör. `'use client'` direktifi, belirli import'lar, bileşen başlıkları). Bu testler component sözleşmelerini korumaya yarar.

### Python Sidecar Tests

```bash
cd scripts/docx-pipeline
python test_filters.py               # Jinja2 filter birim testleri
python test_integration.py           # Entegrasyon senaryoları (docxtpl + LibreOffice)
```

Sidecar testleri Node.js test koşusundan bağımsızdır. `test_filters.py` saf fonksiyon testleri içerir; `test_integration.py` `unittest` ve `if __name__ == '__main__'` kalıbıyla doğrudan çalıştırılır. pytest yapılandırması mevcut değildir.

## Vitest Configuration

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,              // describe/it/expect global scope'ta
    environment: 'node',        // Tarayıcı simülasyonu yok
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',              // Ana test dizini
      'lib/**/__tests__/**/*.test.ts',   // lib altındaki co-located testler
    ],
    fileParallelism: false,     // Testler sıralı çalışır (SQLite paylaşımlı)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),  // @/lib/... import'ları için
    },
  },
})
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

## Coverage Requirements

```bash
pnpm exec vitest run --coverage
```

Coverage raporu `coverage/` dizinine yazılır (git dışı). Vitest konfigürasyonunda herhangi bir coverage eşik değeri (`coverageThreshold`) tanımlanmamıştır.

## CI Integration

GitHub Actions CI (`ci` iş akışı) her `push` (main branch) ve `pull_request` olayında tetiklenir:

- **Job**: `build-and-test` (`ubuntu-latest`)
- **Adımlar**: Checkout → Setup pnpm (v11.1.0) → Setup Node.js (v22) → `pnpm install --frozen-lockfile` → `pnpm run build` → `pnpm test`

Testler build aşamasından sonra `pnpm test` komutuyla çalıştırılır.

## What Is Not Tested

- UI bileşen render (DOM simülasyonu yok)
- E2E akışlar (Playwright kurulumu opsiyonel)
- Performans altı yük koşulları

Playwright projede bağımlılık olarak mevcuttur (`@playwright/test`) fakat aktif E2E test suit'i yoktur.
