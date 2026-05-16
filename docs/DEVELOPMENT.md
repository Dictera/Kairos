# Development

<!-- GSD:generated -->

## Dev Server

```bash
pnpm run dev    # Turbopack ile localhost:3000
```

Turbopack, Next.js 15 ile varsayılan olarak etkindir. Dosya değişiklikleri anlık yansır. Hot reload sırasında SQLite bağlantısı `globalThis` singleton ile korunur — her reload'da yeni bağlantı açılmaz.

## Available Scripts

| Komut | Açıklama |
|-------|----------|
| `pnpm run dev` | Geliştirme sunucusu (Turbopack) |
| `pnpm run build` | Production build |
| `pnpm run start` | Production sunucusu |
| `pnpm run lint` | ESLint kontrolü |
| `pnpm test` | Vitest test koşusu |
| `pnpm run test:watch` | Vitest izleme modu |
| `pnpm run db:generate` | `lib/schema.ts`'ten SQL migration üret |
| `pnpm run db:migrate` | Bekleyen migration'ları uygula |
| `pnpm run db:studio` | Drizzle Studio web arayüzü |

## Project Conventions

### File Organization

```
app/(dashboard)/[sayfa]/
  page.tsx          — Sayfa giriş noktası (Server Component)
  layout.tsx        — Opsiyonel layout

components/[alan]/
  [alan]-page.tsx   — Sayfa düzeyi Client Component (veri çekme burada)
  [alan]-form.tsx   — Form bileşeni
  [alan]-list.tsx   — Liste bileşeni

lib/trpc/routers/
  [alan].ts         — tRPC router; her alan için ayrı dosya
```

### tRPC Procedures

Tüm API çağrıları tRPC üzerinden yapılır. İki procedure tipi:

- **`publicProcedure`** — Session kontrolü yok (yalnızca `/login` gibi sayfalar için)
- **`protectedProcedure`** — Session kontrolü yapar; `isLoggedIn: false` ise `UNAUTHORIZED` fırlatır

```typescript
// Yeni bir protected procedure örneği
export const dosyaRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ input }) => {
      // Drizzle sorgusu buraya
    }),
})
```

Router eklendikten sonra `lib/trpc/routers/_app.ts` içindeki `appRouter`'a kaydedin.

### Drizzle ORM

Şema değişikliği iş akışı:

1. `lib/schema.ts` dosyasını düzenleyin
2. `pnpm run db:generate` — `drizzle/` altına SQL migration dosyası oluşturur
3. `pnpm run db:migrate` — Migration'ı uygular

**Önemli:** `db.ts` yalnızca server-side'da import edilebilir (Server Components, Route Handlers, tRPC routers). Client Component'lerden asla doğrudan import etmeyin.

### Turkish Search

Türkçe büyük/küçük harf duyarsız arama için `lower_tr()` SQLite UDF kullanılır:

```typescript
import { sql } from 'drizzle-orm'

// Doğru kullanım — Türkçe karakter duyarsız
.where(sql`lower_tr(${muvekkil.ad}) LIKE lower_tr(${`%${q}%`})`)
```

### Date Handling

- **Görüntüleme:** `dd.MM.yyyy` formatı (Türk standardı), `date-fns` ile
- **Veritabanı depolama:** `YYYY-MM-DD` text olarak
- **Deadline hesaplama:** `lib/deadline-service.ts` — adli tatil farkındalıklı, saf fonksiyonlar (DB import'u yok)

### Component Conventions

- shadcn/ui bileşenlerini `components/ui/` altında bulabilirsiniz
- Yeni shadcn bileşeni eklemek için: `pnpm dlx shadcn@latest add [bileşen]`
- `components.json` shadcn yapılandırmasını içerir

## Adding a New Feature

Tipik bir yeni özellik için şu dosyalar değişir/oluşturulur:

1. **Şema** — `lib/schema.ts`'e yeni tablo/sütun ekle → migration üret/uygula
2. **Router** — `lib/trpc/routers/[yeni].ts` → `_app.ts`'e kaydet
3. **Bileşen** — `components/[alan]/` altında sayfa bileşeni oluştur
4. **Sayfa** — `app/(dashboard)/[sayfa]/page.tsx` oluştur

## PDF Pipeline (Sidecar Development)

Python sidecar `scripts/docx-pipeline/` altındadır. Geliştirme sırasında sidecar'ı doğrudan test etmek için:

```bash
cd scripts/docx-pipeline
python main.py   # stdin'den JSON CommandEnvelope bekler
```

Sidecar komutları: `extract-vars`, `render`, `convert`, `health-check`. IPC protokolü pydantic v2 `CommandEnvelope` kullanır; stdin/stdout üzerinden JSON exchange yapılır.

Node.js tarafında köprü `lib/services/docx-pipeline.ts`'tedir. tRPC router'ları sidecar'ı asla doğrudan spawn etmez; her zaman bu servis üzerinden geçer.

## Architecture Decisions

Önemli teknik kararların gerekçeleri için [ARCHITECTURE.md](ARCHITECTURE.md) ve `.planning/PROJECT.md` dosyalarına bakın.

Kısa özet:
- SQLite + Drizzle: offline-first, sıfır sunucu bağımlılığı
- tRPC: end-to-end tip güvenliği, Next.js App Router uyumu
- iron-session: solo avukat için session/JWT karmaşıklığı gereksiz
- pydantic v2 IPC: cross-platform, named pipe'lardan daha basit
