<!-- generated-by: gsd-doc-writer -->

# API Reference

Bu uygulama iki tür API sunar: **tRPC** (iş mantığı için) ve **REST Route Handlers** (dosya transfer, binary çıktılar ve oturum açma için).

## Authentication

Kimlik doğrulama **iron-session** tabanlı cookie-session mekanizması ile sağlanır. Oturum `POST /api/auth/login` endpoint'inden `password` alanı ile başlatılır — şifre `APP_PASSWORD` ortam değişkeniyle eşleşmelidir.

**Session cookie özellikleri:**
- **Cookie adı:** `sigorta-session` (varsayılan, `SESSION_COOKIE_NAME` ortam değişkeniyle değiştirilebilir)
- **TTL:** 7 gün
- **HttpOnly:** `true`
- **Secure:** yalnızca production'da `true`
- **SameSite:** `lax`
- **Path:** `/`

Tüm tRPC procedure'ları (`health`, `pipeline.healthCheck`, ve `pipeline.status` hariç) `protectedProcedure` ile korunur — geçerli oturum olmadan `UNAUTHORIZED` (401) hatası döner. REST file-serving endpoint'leri de session kontrolü yapar.

### Oturum Açma

```http
POST /api/auth/login
Content-Type: application/json

{ "password": "your-app-password" }
```

**Başarılı yanıt:** `{ "ok": true }`  
**Hatalı yanıt:** `{ "error": "Şifre hatalı. Lütfen tekrar deneyin." }` (401)

---

## Request/Response Formats

### tRPC

**Request:** `POST /api/trpc/[procedure]`  
Tüm tRPC istekleri JSON body ile yapılır. `superjson` transformer sayesinde `Date`, `Map`, `Set` gibi JavaScript native tipleri wire üzerinde korunur.

**Response:** Başarılı yanıtlarda doğrudan procedure'ın döndürdüğü veri JSON olarak döner. Hatalar standart `TRPCError` formatında döner (bkz. [Error Handling](#error-handling)).

**Input validation:** Tüm procedure'lar Zod schema ile doğrulanır. Geçersiz input `BAD_REQUEST` (400) hatası döner.

### REST

**Request/Response formatı:** REST endpoint'leri standart JSON (`Content-Type: application/json`) veya `multipart/form-data` (dosya yükleme) kullanır.

---

## tRPC API

**Endpoint:** `POST /api/trpc/[procedure]`

tRPC, Next.js App Router üzerinde çalışır. Tüm procedure'lar `protectedProcedure` tanımlıdır — oturum açık olmadan erişim `UNAUTHORIZED` döner. Yalnızca `health` ve `pipeline` (`healthCheck`, `status`) prosedürleri `publicProcedure`'dür.

### Client-Side Kullanım

```typescript
import { trpc } from '@/lib/trpc/client'

// Query örneği
const { data } = trpc.dosya.list.useQuery({ search: 'arama', durum: 'aktif' })

// Mutation örneği
const mutation = trpc.dosya.create.useMutation()
await mutation.mutateAsync({ muvekkil_id: 1, tur: 'STK', ... })
```

---

## tRPC Routers

### `health`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `health` | query (public) | Sunucu durumu: `{ ok: true, timestamp: Date }` |

---

### `muvekkil`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ search?: string, page?: number, pageSize?: number }` | Sayfalı müvekkil listesi, Türkçe arama (`lower_tr`). Varsayılan: `page=1`, `pageSize=25` |
| `getById` | query | `{ id: number }` | Tek müvekkil + bağlı dosyalar (id, dosya_no, tur, durum, talep_tutari) |
| `create` | mutation | MuvekkilSchema | Yeni müvekkil oluştur |
| `update` | mutation | `{ id } & MuvekkilSchema` | Müvekkil güncelle |
| `delete` | mutation | `{ id: number }` | Müvekkil sil (bağlı dosya varsa `PRECONDITION_FAILED` hatası) |

**Response (list):** `{ rows: Muvekkil[], total: number, page: number, pageSize: number, totalPages: number }` — her satırda `dosya_count` alanı bulunur.

---

### `dosya`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ search?, tur?, durum?, tarih_baslangic?, tarih_bitis?, page?, pageSize? }` | Sayfalı dosya listesi. `tur`: `STK`/`AT`/`AH`, `durum`: `aktif`/`arsiv`, varsayılan `page=1`, `pageSize=25` |
| `getById` | query | `{ id: number }` | Tek dosya + muvekkil, sigorta türü, taraflar (sigorta şirketi + avukat bilgileriyle) |
| `create` | mutation | DosyaCreateSchema | Yeni dosya; `dosya_no` otomatik atanır (`YYYY/N`), çakışma durumunda `CONFLICT` hatası |
| `update` | mutation | `{ id } & DosyaSchema` | Dosya güncelle (dosya_no tekillik kontrolü yapılır) |
| `delete` | mutation | `{ id: number }` | Dosya sil (ilişkili `taraf` kayıtları FK cascade ile otomatik silinir) |
| `archive` | mutation | `{ id: number }` | Dosyayı arşive taşı (`durum: 'arsiv'`) |
| `unarchive` | mutation | `{ id: number }` | Dosyayı aktif hale getir (`durum: 'aktif'`) |
| `upsertTaraf` | mutation | TarafSchema | Karşı taraf bilgilerini ekle/güncelle (upsert — `dosya_id` unique) |

**Dosya türleri:** `STK` (Sigorta Tahkim Komisyonu), `AT` (Asliye Ticaret), `AH` (Asliye Hukuk)

---

### `surec`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `updateStkData` | mutation | `{ dosya_id, data: StkSurecData }` | STK veri alanlarını güncelle (asama ilerlemez) |
| `stkIleriAl` | mutation | `{ dosya_id }` | STK aşamasını sıralı ilerlet (son aşamada `BAD_REQUEST`) |
| `stkGeriAl` | mutation | `{ dosya_id }` | STK aşamasını geri al (ilk aşamada `BAD_REQUEST`) |
| `updateMahkemeData` | mutation | `{ dosya_id, data: MahkemeSurecData }` | Mahkeme veri alanlarını güncelle |
| `mahkemeIleriAl` | mutation | `{ dosya_id }` | Mahkeme aşamasını sıralı ilerlet |
| `mahkemeGeriAl` | mutation | `{ dosya_id }` | Mahkeme aşamasını geri al |
| `initMahkemeSurec` | mutation | `{ dosya_id }` | STK dosyası için mahkeme sürecini başlat |
| `durusmaList` | query | `{ dosya_id }` | Dosyaya ait duruşmalar (tarih sıralı) |
| `durusmaCreate` | mutation | DurusmaCreateSchema | Duruşma ekle |
| `durusmaUpdate` | mutation | DurusmaUpdateSchema | Duruşma güncelle |
| `durusmaDelete` | mutation | `{ id }` | Duruşma sil |

STK aşamaları: `İHTAR → ARABULUCULUK → BAŞVURU → ÖN_İNCELEME → BİLİRKİŞİ → ISLAH → KARAR → İTİRAZ → KESİNLEŞME`

Mahkeme aşamaları: `DAVA_DİLEKÇESİ_TEBLİĞ → ... → KESİNLEŞME` (12 aşama)

---

### `sure`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ dosya_id: number }` | Dosyaya ait süreler (son_tarih artan) |
| `createManuel` | mutation | `{ dosya_id, ad, son_tarih, notlar? }` | Manuel süre oluştur (`tur: 'manuel'`) |
| `updateManuel` | mutation | `{ id, ad, son_tarih, notlar? }` | Manuel süre güncelle |
| `deleteSure` | mutation | `{ id: number }` | Süre sil |

Süre türleri: `stk_itiraz` (10 gün), `istinaf` (14 gün), `cevap_dilekce` (14 gün), `manuel`  
Tarih formatı: `YYYY-MM-DD`

---

### `belge`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ dosya_id: number }` | Dosyaya ait belgeler |
| `treeList` | query | — | Tüm belgeler + dosya/müvekkil/sigorta türü bilgisi (ağaç görünüm için) |
| `create` | mutation | `{ dosya_id, dosya_no, kategori, dosya_adi, dosya_yolu, dosya_boyutu, mime_tur }` | Belge kaydı oluştur (upload sonrası çağrılır) |
| `delete` | mutation | `{ id: number }` | Belge kaydı + disk dosyası sil |

Dosya yüklemesi `POST /api/upload` REST endpoint'i üzerinden yapılır.

---

### `finans`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ dosya_id: number }` | Dosyaya ait finans kalemleri (tarih azalan) |
| `create` | mutation | `{ dosya_id, tur, tutar, tarih, aciklama?, odeme_asamasi? }` | Finans kalemi ekle |
| `update` | mutation | `{ id, tur?, tutar?, tarih?, aciklama?, odeme_asamasi? }` | Finans kalemi güncelle |
| `delete` | mutation | `{ id: number }` | Finans kalemi sil |
| `getSummary` | query | `{ dosya_id: number }` | Dosya finans özeti: `{ gelen, giden, masraf, net }` |
| `byAsama` | query | — | Ödeme aşaması bazında gelen/giden/masraf dağılımı |
| `dashboard` | query | `{ yil?: number }` | Aylık ve yıllık finans özeti |
| `sirket` | query | — | Sigorta şirketi bazlı talep/tahsilat/dosya analizi |
| `tur` | query | — | Sigorta türü bazlı gelen analizi (pasta grafik) |
| `dosyaTur` | query | — | Dosya türü (STK/AT/AH) bazlı gelen/giden/masraf analizi |

Finans türleri: `Gelen`, `Giden`, `Masraf`  
Ödeme aşamaları: `İhtar`, `Arabulucu`, `Bilirkişi`, `İcra`  
Tarih formatı: `YYYY-MM-DD`

---

### `notlar`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ dosya_id: number }` | Dosyaya ait notlar (yeniden eskiye) |
| `create` | mutation | `{ dosya_id, icerik }` | Not ekle (min 1, max 5000 karakter) |
| `update` | mutation | `{ id, icerik }` | Not güncelle |
| `delete` | mutation | `{ id: number }` | Not sil |

Not işlemleri otomatik olarak `olay` günlüğüne kaydedilir.

---

### `olay`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | `{ dosya_id: number }` | Dosyaya ait olay günlüğü (yeniden eskiye) |

Olay günlüğü (`olay_gunlugu`), dosya oluşturma, güncelleme, silme, belge ekleme/silme, aşama ilerletme gibi işlemleri otomatik kaydeder.

---

### `sablon`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | — | Tüm şablonlar (güncelleme tarihine göre azalan) |
| `create` | mutation | SablonCreateSchema | Şablon kaydı oluştur — sidecar ile `.docx` değişkenlerini otomatik çıkarır |
| `update` | mutation | SablonUpdateSchema | Şablon güncelle — eski dosyayı diskten siler, yeni dosyayı işler |
| `delete` | mutation | `{ id: number }` | Şablon kaydı + disk dosyası sil |

---

### `pdf`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `generate` | mutation | `{ sablonId: number, dosyaId: number }` | Şablonu dosya verisiyle işle, DOCX render et, PDF'e çevir, arşive ekle |

PDF üretimi Python sidecar (`docxtpl` + LibreOffice headless) aracılığıyla üç aşamada gerçekleşir:
1. **Context oluşturma:** Dosya verisinden Jinja2 context üretilir
2. **Render:** `docxtpl` ile DOCX şablona veri doldurulur
3. **Convert:** LibreOffice headless ile DOCX → PDF dönüşümü
4. **Archive:** PDF, hiyerarşik belgeler dizinine arşivlenir ve `belge` kaydı oluşturulur

Eksik değişken kontrolü: Şablondaki tüm `{{ degisken }}` alanları doldurulabilir olmalıdır — eksik değişken `BAD_REQUEST` hatası döner.

---

### `pipeline`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `healthCheck` | query (public) | Python sidecar + LibreOffice durum kontrolü |
| `status` | query (public) | Python ve LibreOffice yolları |

---

### `dashboard`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `dashboardStats` | query | Toplam/aktif dosya sayısı, bu ay açılan, yaklaşan süreler (14 gün), bugünün duruşmaları |
| `stats` | query | `{ totalDosya, aktivDosya, buAyAcilan, totalDelta, aktivDelta, buAyDelta }` |
| `todaysHearings` | query | Bugünün duruşmaları (dosya_no ile birlikte) |
| `upcomingDeadlines` | query | 14 gün içinde dolacak süreler (müvekkil adı ile birlikte) |

---

### `calendar`
| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `getMonthEvents` | query | `{ year: number, month: number }` | Aya ait süreler + duruşmalar (`type: 'süre'|'duruşma'`) |

---

### `search` — ⚠ Henüz kayıtlı değil

> **Not:** `searchRouter` `lib/trpc/routers/search.ts` içinde tanımlıdır ancak `lib/trpc/routers/_app.ts` içinde **import edilmemiş ve kaydedilmemiştir**. Şu anda çalışma anında erişilemez.

| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `global` | query | `{ query: string, limit?: number }` | Dosya + müvekkil arasında global Türkçe arama. Varsayılan `limit=10`. Response: `{ dosyalar: DosyaArama[], muvekkiller: MuvekkilArama[] }` |

Arama alanları: dosya_no, müvekkil ad/soyad, hasar dosya no, plaka, TC/Vergi no, telefon.

---

### `bildirim` — ⚠ Henüz kayıtlı değil

> **Not:** `bildirimRouter` `lib/trpc/routers/bildirim.ts` içinde tanımlıdır ancak `lib/trpc/routers/_app.ts` içinde **import edilmemiş ve kaydedilmemiştir**. Şu anda çalışma anında erişilemez.

| Procedure | Tip | Input | Açıklama |
|-----------|-----|-------|----------|
| `sync` | mutation | — | Duruşma ve süre sonlarını bildirim tablosuna senkronize et (dün/bugün/yarın). Eski bildirimleri temizler |
| `list` | query | — | Tüm bildirimler (tarih artan, oluşturma azalan) |
| `markAsRead` | mutation | `{ id: number }` | Bildirimi sil (okundu işaretle) |
| `markAllAsRead` | mutation | — | Tüm bildirimleri temizle |
| `unreadCount` | query | — | Okunmamış bildirim sayısı |

---

### `rapor`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `yonetimOzeti` | query | Yönetim özeti: dosya sayıları, finans özeti, başarı oranı, zamanaşımı riskleri, şirket/tür analizi |
| `genelBakis` | query | Aylık finans ve dosya trendi (gelen/giden/masraf/net + yeni dosya) |
| `tahsilat` | query | Sigorta şirketi bazlı tahsilat analizi (talep/karar/tahsilat oranları, ödeme aşaması dağılımı) |
| `sonucBasari` | query | Başarı oranı analizi: kazanılan/uzlaşma/kaybedilen/devam eden, tür ve şirket bazlı |
| `arabuluculuk` | query | STK arabuluculuk analizi: arabuluculukta kalan vs davaya giden, çözülme oranları, ortalama süreler |
| `zamanasimi` | query | Zamanaşımı risk raporu: tüm dosyaların kalan gün ve risk seviyesi (Acil ≤60, Kritik ≤180, Dikkat ≤365) |
| `dosyaRaporu` | query | Dosya dağılım raporu: durum, tür ve alt tür (sigorta türü) bazlı sayılar ve tahsilat |
| `muvekkilRaporu` | query | Müvekkil bazlı rapor: dosya sayısı, tahsilat/gider/masraf/net, tahsilat oranı, son aktivite |
| `davaSureci` | query | Dava süreç analizi: aşama bazlı ortalama/min/max süreler, en uzun süren aktif dosyalar |
| `sirketAnalizi` | query | Sigorta şirketi karşılaştırmalı analizi: talep/karar/tahsilat oranları, kümülatif trend verisi |

---

### `ayarlar`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `sigortaSirketi.list` | query | Sigorta şirketi listesi |
| `sigortaSirketi.listWithAvukatlar` | query | Sigorta şirketleri + bağlı avukatlar |
| `sigortaSirketi.create` | mutation | Sigorta şirketi ekle |
| `sigortaSirketi.update` | mutation | Sigorta şirketi güncelle |
| `sigortaSirketi.delete` | mutation | Sigorta şirketi sil (bağlı dosya ve taraflardan referans temizlenir) |
| `sigortaTuru.list/create/update/delete` | — | Sigorta türü CRUD |
| `mahkeme.list/create/update/delete` | — | Mahkeme CRUD |
| `avukat.list` | query | Avukat listesi |
| `avukat.bySirket` | query | `{ sigorta_sirketi_id }` — Sigorta şirketine bağlı avukatlar |
| `avukat.create/update/delete` | mutation | Avukat CRUD |
| `avukat.addSirket` | mutation | `{ avukat_id, sigorta_sirketi_id }` — Avukata sigorta şirketi ata |
| `avukat.removeSirket` | mutation | `{ avukat_id, sigorta_sirketi_id }` — Avukattan sigorta şirketini kaldır |

---

### `retirement`
| Procedure | Tip | Açıklama |
|-----------|-----|----------|
| `checkLegacyTables` | query | Eski tabloların (`dilekce_sablonu`, `dilekce_odt_sablonu`) varlığını kontrol eder |
| `executeRetirement` | mutation | v1.2 emeklilik işlemini çalıştırır: ODT şablon klasörünü siler, eski tabloları drop eder, `app_settings`'e flag yazar |

---

## REST Route Handlers

### `POST /api/auth/login`

Oturum açar. Şifre `APP_PASSWORD` ortam değişkeniyle eşleşmelidir.

**Request:** `application/json`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `password` | string | Uygulama şifresi |

**Response (başarılı):** `{ "ok": true }`  
**Response (hatalı):** `{ "error": "Şifre hatalı. Lütfen tekrar deneyin." }` (401)

---

### `POST /api/upload`

Dosyayı belirli bir dava dosyasına yükler. Session korumalı değildir — form-data üzerinden token/oturum beklenmez.

**Request:** `multipart/form-data`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `file` | File | Yüklenecek dosya |
| `dosyaId` | string | Hedef dosya ID'si |
| `dosyaNo` | string | Dosya numarası (klasör adı için) |
| `kategori` | string | Belge kategorisi (opsiyonel; dosya adına eklenir) |

**İzin verilen MIME tipleri:** `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`  
**Maksimum boyut:** 20 MB

**Response:** `{ filename, dosya_yolu, dosya_boyutu, mime_tur, dosya_adi }`

---

### `GET /api/files/[dosyaId]/[filename]`

Yüklenmiş dosyayı indir / görüntüle. Hiyerarşik belge dizininde arar (dosya türü, sigorta türü, müvekkil adı/soyadı kullanılarak yol oluşturulur). Bulunamazsa düz dosya yoluna fallback yapar.

**Path traversal koruması:** Dosya adında `..`, `/`, `\` karakterleri reddedilir.

---

### `POST /api/templates/upload`

`.docx` şablon dosyası yükle. Session korumalı.

**Request:** `multipart/form-data` — `file` alanı

**İzin verilen tipler:** Yalnızca `.docx` (MIME: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)  
**Maksimum boyut:** 10 MB

**Response:** `{ filename, filePath, fileSize, fileName }`

**Güvenlik:** Dosya adı sanitize edilir (`[^a-zA-Z0-9._-]` karakterler `_` ile değiştirilir), path traversal koruması uygulanır.

---

### `GET /api/raporlar/portfy/pdf`

Portföy raporunu PDF olarak indir (`Content-Disposition: attachment`).

### `GET /api/raporlar/finans/pdf`

Finansal raporu PDF olarak indir.

### `GET /api/raporlar/finans/excel`

Finansal raporu Excel olarak indir.

### `GET /api/raporlar/dosya-listesi/excel`

Dosya listesini Excel olarak indir. Query parametreleri: `?tur=STK|Mahkeme&durum=AKTIF|PASIF` (opsiyonel filtre).

---

## Rate Limits

Bu projede rate limiting **uygulanmamıştır**. `express-rate-limit` bağımlılığı `pnpm-lock.yaml`'da görünse de kaynak kodda import edilmemektedir (transitive dependency). İhtiyaç halinde `@upstash/ratelimit` veya `express-rate-limit` ile eklenebilir.

---

## Error Handling

tRPC hataları standart `TRPCError` kodu döner:

| Kod | HTTP Durum | Açıklama |
|-----|-------|----------|
| `UNAUTHORIZED` | 401 | Oturum açık değil |
| `NOT_FOUND` | 404 | Kayıt bulunamadı |
| `BAD_REQUEST` | 400 | Zod validation hatası veya iş kurallı ihlali |
| `CONFLICT` | 409 | Kaynak çakışması (örn. dosya_no tekrarı) |
| `PRECONDITION_FAILED` | 412 | Ön koşul sağlanmadı (örn. bağlı dosyaları olan müvekkil silinemez) |
| `INTERNAL_SERVER_ERROR` | 500 | Beklenmeyen hata |

PDF pipeline hataları için exit kodları: `1=validation`, `2=render`, `3=convert`, `4=archive`, `99=internal` — Türkçe hata mesajlarına `getTurkishErrorMessage()` ile çevrilir.

REST endpoint hataları standart JSON formatında döner: `{ "error": "Hata mesajı" }` + uygun HTTP durum kodu.
