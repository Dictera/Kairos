# API Reference

<!-- GSD:generated -->

Bu uygulama iki tür API sunar: **tRPC** (iş mantığı için) ve **REST Route Handlers** (dosya transfer ve binary çıktılar için).

## tRPC API

**Endpoint:** `POST /api/trpc/[procedure]`

tRPC, Next.js App Router üzerinde çalışır. Tüm procedure'lar `protectedProcedure` tanımlıdır — oturum açık olmadan erişim `UNAUTHORIZED` döner. Yalnızca `health` prosedürü `publicProcedure`'dür.

### Client-Side Kullanım

```typescript
import { trpc } from '@/lib/trpc/client'

// Query örneği
const { data } = trpc.dosya.list.useQuery({ q: 'arama', durum: 'aktif' })

// Mutation örneği
const mutation = trpc.dosya.create.useMutation()
await mutation.mutateAsync({ muvekkil_id: 1, tur: 'STK', ... })
```

---

## tRPC Routers

### `health`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `health` | query | Sunucu durumu: `{ ok: true, timestamp: Date }` |

---

### `muvekkil`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ q?: string }` | Müvekkil listesi, Türkçe arama |
| `get` | query | `{ id: number }` | Tek müvekkil + bağlı dosya sayısı |
| `create` | mutation | MuvekkilSchema | Yeni müvekkil oluştur |
| `update` | mutation | `{ id } & MuvekkilSchema` | Müvekkil güncelle |
| `delete` | mutation | `{ id: number }` | Müvekkil sil (bağlı dosya varsa hata) |

---

### `dosya`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ q?: string, durum?: 'aktif'\|'arsiv' }` | Dosya listesi |
| `get` | query | `{ id: number }` | Tek dosya + ilişkili veriler |
| `create` | mutation | DosyaCreateSchema | Yeni dosya; `dosya_no` otomatik atanır (`YYYY/N`) |
| `update` | mutation | `{ id } & DosyaSchema` | Dosya güncelle |
| `delete` | mutation | `{ id: number }` | Dosya sil |
| `archive` | mutation | `{ id: number }` | Dosyayı arşive taşı |
| `getWithTaraf` | query | `{ id: number }` | Dosya + taraf bilgisi |
| `updateTaraf` | mutation | TarafSchema | Karşı taraf bilgilerini güncelle |

**Dosya türleri:** `STK` (Sigorta Tahkim Komisyonu), `AT` (Asliye Ticaret), `AH` (Asliye Hukuk)

---

### `surec`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `get` | query | `{ dosya_id: number }` | STK + mahkeme süreç detayı |
| `updateStk` | mutation | `{ dosya_id, stk: StkSurecData }` | STK sürecini güncelle |
| `updateMahkeme` | mutation | `{ dosya_id, mahkeme: MahkemeSurecData }` | Mahkeme sürecini güncelle |

STK aşamaları: `İHTAR → ARABULUCULUK → BAŞVURU → ÖN_İNCELEME → BİLİRKİŞİ → ISLAH → KARAR → İTİRAZ → KESİNLEŞME`

Mahkeme aşamaları: `DAVA_DİLEKÇESİ_TEBLİĞ → ... → KESİNLEŞME` (12 aşama)

---

### `sure`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `listByDosya` | query | `{ dosya_id: number }` | Dosyaya ait süreler |
| `create` | mutation | SureSchema | Süre oluştur (otomatik veya manuel) |
| `delete` | mutation | `{ id: number }` | Süre sil |

Süre türleri: `stk_itiraz` (10 gün), `istinaf` (14 gün), `cevap_dilekce` (14 gün), `manuel`

---

### `belge`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `listByDosya` | query | `{ dosya_id: number }` | Dosyaya ait belgeler |
| `delete` | mutation | `{ id: number }` | Belge kaydı + disk dosyası sil |

Dosya yüklemesi `POST /api/upload` REST endpoint'i üzerinden yapılır.

---

### `finans`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `listByDosya` | query | `{ dosya_id: number }` | Dosyaya ait finans kalemleri |
| `create` | mutation | FinansSchema | Finans kalemi ekle |
| `update` | mutation | `{ id } & FinansSchema` | Finans kalemi güncelle |
| `delete` | mutation | `{ id: number }` | Finans kalemi sil |
| `summary` | query | — | Genel finans özeti (toplam gelen/giden/masraf) |

Finans türleri: `Gelen`, `Giden`, `Masraf`

---

### `sablon`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | — | Tüm şablonlar |
| `get` | query | `{ id: number }` | Tek şablon |
| `create` | mutation | SablonSchema | Şablon kaydı oluştur |
| `update` | mutation | `{ id } & SablonSchema` | Şablon güncelle |
| `delete` | mutation | `{ id: number }` | Şablon kaydı + disk dosyası sil |

---

### `pdf`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `generate` | mutation | `{ sablon_id, dosya_id }` | Şablonu dosya verisiyle işle, PDF üret, arşive ekle |
| `preview` | mutation | `{ sablon_id, dosya_id }` | Değişkenleri doldur, PDF önizleme (arşivlemez) |

PDF üretimi Python sidecar aracılığıyla gerçekleşir (docxtpl + LibreOffice headless).

---

### `pipeline`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `health` | query | Python sidecar durum kontrolü (5 dakika TTL cache) |

---

### `dashboard`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `stats` | query | Toplam dosya, aktif/arşiv sayısı, bugünün duruşmaları |
| `recentDosyalar` | query | Son değiştirilen 10 dosya |
| `urgentSureler` | query | 7 gün içinde dolacak süreler |

---

### `calendar`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `byMonth` | query | `{ year: number, month: number }` | Aya ait duruşmalar |

---

### `rapor`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `portfoy` | query | Tüm aktif dosyalar + süreç durumu |
| `finansOzet` | query | Finans özet raporu |

---

### `ayarlar`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `sigortaSirketleri.list/create/update/delete` | — | Sigorta şirketi CRUD |
| `mahkemeler.list/create/update/delete` | — | Mahkeme CRUD |
| `sigortaTurleri.list/create/update/delete` | — | Sigorta türü CRUD |
| `avukatlar.list/create/update/delete` | — | Avukat CRUD |

---

### `search`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `global` | query | `{ q: string }` | Dosya + müvekkil arasında global arama |

---

### `bildirim`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `list` | query | Bildirimler listesi |
| `markRead` | mutation | Bildirimi okundu işaretle |

---

## REST Route Handlers

### `POST /api/upload`

Dosyayı belirli bir dava dosyasına yükler.

**Request:** `multipart/form-data`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `file` | File | Yüklenecek dosya |
| `dosyaId` | string | Hedef dosya ID'si |
| `dosyaNo` | string | Dosya numarası (klasör adı için) |
| `kategori` | string | Belge kategorisi (opsiyonel) |

**İzin verilen tipler:** PDF, DOC, DOCX, JPEG, PNG  
**Maksimum boyut:** 20 MB

**Response:** `{ id, ad, dosya_yolu, kategori, created_at }`

---

### `GET /api/files/[dosyaId]/[...path]`

Yüklenmiş dosyayı indir / görüntüle. Session korumalı.

---

### `POST /api/templates/upload`

`.docx` şablon dosyası yükle.

**Request:** `multipart/form-data` — `file` alanı

**Response:** `{ filePath, originalName, size }`

---

### `GET /api/templates/[filename]`

Şablon dosyasını indir.

---

### `GET /api/raporlar/portfy/pdf`

Portföy raporunu PDF olarak indir (`Content-Disposition: attachment`).

### `GET /api/raporlar/finans/pdf`

Finansal raporu PDF olarak indir.

### `GET /api/raporlar/portfy/excel`

Portföy raporunu Excel (`.xlsx`) olarak indir.

### `GET /api/raporlar/finans/excel`

Finansal raporu Excel olarak indir.

---

## Error Handling

tRPC hataları standart `TRPCError` kodu döner:

| Kod | Durum | Açıklama |
|-----|-------|----------|
| `UNAUTHORIZED` | 401 | Oturum açık değil |
| `NOT_FOUND` | 404 | Kayıt bulunamadı |
| `BAD_REQUEST` | 400 | Zod validation hatası |
| `INTERNAL_SERVER_ERROR` | 500 | Beklenmeyen hata |

PDF pipeline hataları için exit kodları: `1=validation`, `2=render`, `3=convert`, `4=arşiv`, `99=internal` — Türkçe hata mesajlarına `getTurkishErrorMessage()` ile çevrilir.
