# Plan: `better-sqlite3` ERR_DLOPEN_FAILED Hatası Çözümü

## Hedef
`/api/trpc/dashboard.dashboardStats` endpoint'inde 500 hatası alıyoruz — kök neden **native addon uyumsuzluğu** ve **middleware yapılandırması**.

---

## Tespit Edilen Sorunlar

### 1. Ana Sorun: `better-sqlite3` native addon Windows için derlenmemiş

**Bulgu:**
- `node_modules/better-sqlite3/build/Release/better_sqlite3.node` bir **Linux ELF 64-bit** binary'si
- Proje `D:\sigorta-takip` — yani **Windows** ortamında çalışıyor
- Windows, Linux ELF binary'lerini çalıştıramaz → `ERROR_INVALID_DLL` (kod 193)

**Hata mesajı:**
```
error: 193\\?\D:\sigorta-takip\node_modules\better-sqlite3\build\Release\better_sqlite3.node
code: 'ERR_DLOPEN_FAILED'
```
`\\?\` prefix'i Windows'ta uzun yol formatı — bu Windows'un Linux binary'sini yüklemeye çalıştığını doğruluyor.

**Çözüm:** Windows için yeniden derlemek gerekiyor (steps below).

---

### 2. Yan Sorun: `proxy.ts` — Middleware Dosya Adı ve Export Formatı

**Bulgu:**
- `proxy.ts` dosyası `export async function proxy` — Next.js 16'da middleware olabilmesi için dosya adı `middleware.ts` olmalı ve `export default function middleware` pattern'i kullanılmalı
- Mevcut `config.matcher` sadece bir named export — bu dosya **middleware olarak kayıtlı değil**
- Ancak kullanıcı `.next` dosyasının güncel olduğunu söylüyor, yani belki middleware çalışıyor, belki çalışmıyor — kesin bilgi için test gerekir

**Olası sorun:** Eğer proxy gerçekten middleware olarak çalışmıyorsa, tüm route'lar açık kalıyor ve auth koruması atlanıyor.

**Çözüm:** `proxy.ts` → `middleware.ts` olarak yeniden adlandırmak ve export formatını düzeltmek.

---

## Adım Adım Çözüm Planı

### 1. `better-sqlite3`'ü Windows için yeniden derle

**WSL içinde değil, Windows CMD/PowerShell'de çalıştırılacak:**

```cmd
cd D:\sigorta-takip
npm rebuild better-sqlite3
```

Eğer `node-gyp` hatası alırsanız:

```cmd
npm install --global windows-build-tools
npm rebuild better-sqlite3
```

**Test:**
```cmd
node -e "const Database = require('better-sqlite3'); console.log('OK:', new Database('./data/db.sqlite').pragma('journal_mode'))"
```

---

### 2. `proxy.ts`'yi `middleware.ts`'ye dönüştür

**Yeni dosya:** `middleware.ts` (app/ dizini altına veya proje köküne — Next.js 16 app router middleware konumu)

**İçerik değişikliği:**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/trpc', '/api/auth']

// ❌ ESKİ (proxy.ts) — named export, çalışmaz
// export async function proxy(request: NextRequest) { ... }
// export const config = { matcher: [...] }

// ✅ YENİ — default export, doğru middleware pattern'i
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Eski `proxy.ts` dosyası silinecek.**

---

### 3. Doğrulama

Dev server yeniden başlatıldıktan sonra:

```bash
# API test
curl http://localhost:3000/api/trpc/dashboard.dashboardStats
# 401 → middleware çalışıyor (doğru)
# 200 + veri → db çalışıyor (doğru)
# 500 → hâlâ sorun var
```

---

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `proxy.ts` | **Silinecek** veya `middleware.ts` ile değiştirilecek |
| `middleware.ts` | **Oluşturulacak** — doğru `export default` pattern'i ile |
| `node_modules/better-sqlite3/build/Release/better_sqlite3.node` | **Yeniden derlenecek** (Windows için) |

---

## Riskler ve Dikkat Edilecekler

- **`npm rebuild`** Windows ortamında çalıştırılmalı — WSL içinde değil
- Eğer `windows-build-tools` yüklemesi başarısız olursa, Python 3.x ve Visual Studio Build Tools gerekebilir
- `better-sqlite3` native binding'i başarıyla derlendikten sonra `.next` cache'inin temizlenmesi gerekebilir: `rmdir /s /q .next` (Windows) veya `rm -rf .next`
- Kullanıcı `.next` dosyasının güncel olduğunu söyledi — `.next` silinmeden önce kullanıcıya sorulmalı

---

## Açık Sorular

1. **Windows'ta `npm rebuild` çalıştırılabilir mi?** — Kullanıcı bu komutu çalıştırıp sonucu bildirecek
2. **`proxy.ts`'nin orijinal konumu** — `app/` altında mı yoksa proje kökünde mi? (şu an proje kökünde görünüyor)
3. **Middleware gerçekten çalışmıyor mu?** — Sadece dosya adı/export formatı yanlış olabilir, ya da başka bir sorun var. Kullanıcı test sonucunu bildirmeli
