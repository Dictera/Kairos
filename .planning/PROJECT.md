# Sigorta Uyuşmazlık Takip

## What This Is

Solo avukat için yerel çalışan (offline-first), STK Tahkim Komisyonu ve mahkemeler (Asliye Ticaret / Asliye Hukuk) nezdindeki sigorta uyuşmazlık dosyalarını merkezi olarak takip eden web uygulaması. Dağınık Excel, kağıt ve farklı klasörlerdeki iş akışının yerini alır; 200+ aktif dosyayı tek bir yerden yönetmeyi sağlar.

## Core Value

Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.

## Requirements

### Validated

- [x] **Phase 04 (2026-04-13)**: Deadline engine + dashboard: Pure deadline calculation service (lib/deadline-service.ts), sure table with auto-calc triggers, tRPC routers (sure + dashboard), full dashboard UI with urgency badges and adli tatil indicators

### Active

- [ ] Dosya yönetimi: oluşturma, listeleme, filtreleme, hızlı arama ve detay görünümü (200+ dosya)
- [ ] STK Tahkim süreci takibi: başvuru/kabul, raportör süreci, hakem kararı, itiraz/iptal davası
- [ ] Mahkeme süreci takibi: Asliye Ticaret ve Asliye Hukuk aşamaları
- [x] ~~Takvim: duruşma tarihleri ve yaklaşan süre uyarıları~~ → Validated (Phase 04)
- [ ] Müvekkil yönetimi: profil, iletişim bilgileri, dosya geçmişi
- [ ] Finans takibi: gelen ödemeler, giden ödemeler, masraf ve harçlar, fatura/makbuz
- [ ] Dilekçe şablon sistemi: şablon seç → değişkenleri doldur → PDF önizle → indir
- [ ] Raporlar: portföy özeti, finansal rapor, PDF/Excel dışa aktarım
- [ ] Env tabanlı tek kullanıcı girişi (şifre .env içinde)
- [ ] Ayarlar: hesap, bildirimler, tanımlar (sigorta şirketi listesi vb.)

### Out of Scope

- Çok kullanıcılı / rol bazlı yetkilendirme — solo avukat, tek kullanıcı yeterli
- Bulut senkronizasyonu / uzaktan erişim — tam offline/lokal çalışma hedefi
- İstinaf / Temyiz özel modülü — v1'de yok, ileride eklenebilir
- Mobil uygulama — web-first, masaüstü tarayıcı
- Geçmiş dosya aktarımı (Excel import) — sıfırdan veri girişi yeterli

## Context

- Kullanıcı solo avukat; ağırlıklı dosya türleri Kasko/Trafik ve Sağlık/Hayat sigortaları
- Sigorta türü dosya bazında kaydedilecek (sabit liste değil, genişletilebilir tanımlar)
- Mevcut iş akışı: Excel, kağıt klasörler, dağınık belgeler — tümü bu uygulamaya taşınacak
- Veri girişi sıfırdan yapılacak, herhangi bir import aracı gerekmez
- Site haritası v2 hazır: sitemap.html referans alınacak
- Dosya detay ekranında alt sekmeler: Genel Bilgiler, Yargılama Süreci, Belgeler/Dilekçeler, Notlar/Zaman Çizelgesi, Karşı Taraflar, Dosya Finansı

## Constraints

- **Tech Stack**: Next.js 15, SQLite, Drizzle ORM, tRPC, TypeScript strict, shadcn/ui, Tailwind CSS, React Query, Zod
- **Auth**: `.env` tabanlı şifre — kullanıcı oluşturma ekranı yok
- **Deployment**: Lokal only — `next dev` → `localhost:3000`, internet bağlantısı gerekmez
- **Performance**: 200+ dosyada liste sayfası yüklenme süresi < 1 saniye
- **Storage**: SQLite dosyası `./data/db.sqlite`, yüklemeler `./public/uploads`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite + Drizzle ORM | Offline çalışma, sıfır sunucu bağımlılığı, kolay yedekleme | — Pending |
| tRPC | TypeScript end-to-end tip güvenliği, Next.js App Router ile uyum | — Pending |
| Env tabanlı auth | Solo avukat — session/JWT karmaşıklığı gerekmez | — Pending |
| shadcn/ui + Tailwind | Hazır bileşenler, hızlı UI geliştirme | — Pending |

## Evolution

Bu belge faz geçişlerinde ve milestone sınırlarında güncellenir.

**Her faz geçişinde** (`/gsd-transition` ile):
1. Geçersizleşen gereksinimler? → Out of Scope'a taşı
2. Doğrulanan gereksinimler? → Validated'a taşı
3. Yeni gereksinimler ortaya çıktı mı? → Active'e ekle
4. Kaydedilecek kararlar? → Key Decisions'a ekle
5. "What This Is" hâlâ doğru mu? → Güncel tut

**Her milestone sonunda** (`/gsd-complete-milestone` ile):
1. Tüm bölümlerin tam incelemesi
2. Core Value kontrolü — hâlâ doğru öncelik mi?
3. Out of Scope denetimi — gerekçeler hâlâ geçerli mi?
4. Context güncelleme

---
*Last updated: 2026-04-13 after Phase 04 completion*
