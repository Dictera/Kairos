# Phase 8: UI Yenileme — Renk Paleti ve shadcn/ui Bileşenleri - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Teal renk paletini yeni Navy + Turuncu paletiyle değiştir; CSS değişkenlerini güncelle; mevcut sidebar ve login sayfası kodunu yeni palete geçir; Phase 2-7'nin ihtiyaç duyacağı tüm shadcn/ui bileşenlerini önceden kur. Feature sayfalarına (dashboard, dosyalar, vb.) dokunulmaz — içerikleri ilgili fazlar yazacak.

</domain>

<decisions>
## Implementation Decisions

### Renk Paleti

- **D-01:** Yeni palet: **Navy + Turuncu** (Palette 1)
  - Sidebar arka planı: `#032539` (koyu lacivert)
  - Ana vurgu / aktif nav / primary buton: `#FA991C` (turuncu)
  - İkincil ton / linkler / pasif ikonlar: `#1C768F` (çelik mavi)
  - Ana içerik arka planı: `#FBF3F2` (ılık beyaz)
- **D-02:** `--primary` CSS değişkeni `#FA991C` (turuncu) — kaydet/gönder butonları ve tüm primary aksiyonlar bu rengi taşır
- **D-03:** Sidebar aktif item: turuncu sol kenarlık (`#FA991C`) + düşük opaklıklı turuncu arka plan; pasif ikonlar: `#1C768F` veya ılık açık ton

### Güncellenen Dosyalar

- **D-04:** `app/globals.css` — shadcn CSS token'ları yeni palete göre güncellenir:
  - `--background` → `#FBF3F2`
  - `--primary` → `#FA991C`'nin oklch karşılığı
  - `--primary-foreground` → koyu (okunabilirlik için)
  - `--accent` → `#1C768F`'in oklch karşılığı
  - `--sidebar` → `#032539`
  - `--sidebar-foreground` → `#FBF3F2`
  - `--sidebar-accent` → `rgba(250, 153, 28, 0.15)` (turuncu hover)
  - `--sidebar-accent-foreground` → `#FBF3F2`
- **D-05:** `components/app-sidebar.tsx` — hardcode teal değerleri (`#134e4a`, `#14b8a6`, `#99f6e4`) yeni palet renkleriyle değiştirilir; inline `style` bloklarında güncelleme yapılır
- **D-06:** `app/(auth)/login/page.tsx` — raw HTML + inline stil kaldırılır; shadcn `Card`, `Button`, `Input`, `Label` bileşenlerine geçilir; yeni palet uygulanır

### Placeholder Sayfalar

- **D-07:** Mevcut boş placeholder sayfalar (dashboard, dosyalar, müvekkiller, takvim, belgeler, finans, dilekçe, raporlar, ayarlar) **dokunulmaz** — içerikleri ilgili fazlar yazacak. Bu fazın işi sadece theme + bileşen altyapısı kurmak.

### shadcn/ui Bileşen Seti

- **D-08:** Tam bileşen seti kurulur. Kurulu olanlar korunur; eksikler eklenir:

  **Mevcut (değişmez):** button, input, label, separator, sheet, sidebar, skeleton, tooltip

  **Form grubu (Phase 2-3 CRUD formları):**
  form, select, textarea, checkbox, radio-group, switch

  **Layout & veri gösterimi (liste ve detay sayfaları):**
  card, table, badge, tabs, pagination, scroll-area, avatar

  **Modaller & bildirimler (silme onayı, uyarı, toast):**
  dialog, alert-dialog, popover, sonner, dropdown-menu

  **Gelişmiş (Phase 4-7):**
  calendar, command, progress, breadcrumb, collapsible

### Claude'un Takdirine Bırakılanlar

- oklch değerlerinin hex karşılıklarına tam dönüşümü (`--ring`, `--border`, `--muted`, vb. token'ların yeni palet tonuyla uyumlu ayarlanması)
- Sidebar pasif item metin rengi (ılık açık ton — `#FBF3F2`'nin %70 opaklığı veya benzer)
- `--card`, `--card-foreground` token'larının `#FBF3F2` arka planına uygun ayarlanması

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mevcut Tema ve Kod (Güncellenecek Dosyalar)
- `app/globals.css` — mevcut CSS token yapısı; `--sidebar` değişkenleri bu dosyadadır
- `components/app-sidebar.tsx` — hardcode renk bloklarının tam listesi (aktif/pasif inline stil)
- `app/(auth)/login/page.tsx` — raw HTML + inline stiller; shadcn geçişinde silinecek

### Phase 1 Kararları (Referans)
- `.planning/phases/01-foundation/01-CONTEXT.md` §D-04, D-05 — orijinal teal palet kararı ve light-mode tercihi (bu fazda palet değişiyor, D-05 light-mode korunuyor)

### Gereksinimler
- `.planning/REQUIREMENTS.md` — Phase 8 için bağımsız bir requirement yok; bu faz altyapı güncelleme

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/sidebar.tsx` — shadcn sidebar bileşeni; `--sidebar-*` CSS token'larını okur; doğrudan değiştirilmez, globals.css'deki token'lar güncellenerek etkilenir
- `components/app-sidebar.tsx` — inline stil bloklarında `#134e4a`, `#14b8a6`, `#99f6e4` hardcode; D-05 kapsamında güncellenir
- `app/(dashboard)/layout.tsx` — `main` elemanı `bg-white` sınıfıyla; yeni arka planla (`#FBF3F2`) uyumlu hale getirilmeli

### Established Patterns
- shadcn/ui bileşen token sistemi: `globals.css`'deki oklch CSS değişkenleri tüm bileşenleri etkiler — her token'ı oklch formatında yazılmasına dikkat edilmeli
- Mevcut 8 bileşen `components/ui/` altında — yeni bileşenler aynı dizine kurulur (`npx shadcn@latest add <component>`)

### Integration Points
- `app/globals.css` → tüm shadcn bileşenlerini etkiler (tek değişiklik noktası)
- `components/app-sidebar.tsx` → sidebar renklerini kontrol eder; `SidebarProvider` context ile sarılı
- Login sayfası `app/(auth)/login/page.tsx` → ayrı auth layout içinde; diğer sayfa layoutlarından bağımsız

</code_context>

<specifics>
## Specific Ideas

- Kullanıcı 3 hazır palet arasından **Palette 1 (Navy + Turuncu)**'yu seçti; seçim kriteri: uzun ekran sürelerine uygunluk, göz yormama, ve deadline uyarı renkleriyle (kırmızı/sarı) çakışmama
- Kırmızı palet elendi — `--destructive` / deadline uyarı renkleriyle (< 3 gün = kırmızı) çakışırdı
- Yeşil palet elendi — `#E6E5A3` sarımsı arka plan veri-yoğun kullanımda göz yorar
- `#FA991C` turuncu: sidebar aktif nav ve primary butonların aynı vurgu rengini paylaşması bilinçli karar — görsel tutarlılık

</specifics>

<deferred>
## Deferred Ideas

- Dark mode — Phase 1'den beri ertelenmiş; bu fazda da kapsam dışı
- Animasyon / geçiş efektleri — ayrı faz olabilir

</deferred>

---

*Phase: 08-ui-yenileme-renk-paleti-degisikligi-ve-shadcn-ui-bilesenleri*
*Context gathered: 2026-04-11*
