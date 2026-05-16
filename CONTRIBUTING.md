<!-- generated-by: gsd-doc-writer -->

# Katkı Rehberi / Contributing Guide

Kairos'a katkıda bulunmak istediğiniz için teşekkürler! / Thank you for considering a contribution to Kairos.

## Geliştirme Ortamı / Development Setup

Katkıya başlamadan önce geliştirme ortamınızı kurun. / Set up your development environment before contributing.

- **Ön koşullar ve ilk çalıştırma** için [GETTING-STARTED.md](docs/GETTING-STARTED.md) sayfasına bakın.
- **Detaylı geliştirme kurulumu** için [DEVELOPMENT.md](docs/DEVELOPMENT.md) sayfasına bakın.

Kısa özet / Quick summary:

```bash
git clone <repository-url>
cd kairos
pnpm install
cp .env.example .env         # ardından .env dosyasını düzenleyin
pnpm run dev                  # localhost:3000
```

## Kod Standartları / Coding Standards

Proje [ESLint](https://eslint.org/) kullanır; yapılandırma `eslint.config.mjs` dosyasındadır. Next.js flat config yapısı ile `next/core-web-vitals` ve `next/typescript` kural setleri etkindir.

- **Lint komutu:** `pnpm run lint`
- **Formatlama:** Ayrı bir Prettier veya Biome yapılandırması yoktur — kod formatlaması ESLint tarafından yönetilir.
- **CI:** Her PR ve `main` dalına push işleminde `pnpm run build` ve `pnpm test` otomatik çalıştırılır. Lint kontrolü `next build` aşamasında yapılır. PR açmadan önce `pnpm run lint` çalıştırarak temiz bir çıktı aldığınızdan emin olun.

CI iş akışı `.github/workflows/ci.yml` dosyasında tanımlıdır.

## PR Süreci / Pull Request Guidelines

1. `master` dalından yeni bir dal oluşturun.
2. Değişikliklerinizi yapın.
3. Testleri çalıştırın: `pnpm test`
4. Lint kontrolü yapın: `pnpm run lint`
5. Değişikliklerinizi commit edin ve dalı push'layın.
6. `master` dalına yönelik bir pull request açın.
7. PR açıklamasında **neyi değiştirdiğinizi** ve **neden** değiştirdiğinizi açıklayın.
8. CI (`pnpm run build` + `pnpm test`) başarılı olmalıdır. Başarısız CI kontrolleri olan PR'lar merge edilemez.

### Dal Adlandırma Önerileri / Suggested Branch Naming

Belirlenmiş katı bir dal adlandırma kuralı yoktur, ancak şu desenleri takip etmeniz önerilir:

- `feat/kisa-aciklama` — yeni özellikler / new features
- `fix/kisa-aciklama` — hata düzeltmeleri / bug fixes
- `chore/kisa-aciklama` — bağımlılık güncellemeleri, yapılandırma değişiklikleri / dependency updates, config changes

### Commit Mesajları / Commit Messages

Net ve açıklayıcı commit mesajları yazın. Mümkünse [Conventional Commits](https://www.conventionalcommits.org/) formatını kullanın:

- `feat: kullanıcı dashboard'una filtreleme eklendi`
- `fix: dosya listesindeki silme butonu hatası düzeltildi`
- `chore: bağımlılıklar güncellendi`

## Hata ve Özellik Bildirimi / Issue Reporting

### Hata Bildirme / Reporting a Bug

Hata bildirmek için [Bug Report](https://github.com/<repository>/issues/new?template=bug_report.md) şablonunu kullanın. / Use the Bug Report template.

Lütfen şu bilgileri ekleyin:
- Hatanın kısa açıklaması / Brief description of the bug
- Hatanın tekrarlanması için adım adım talimatlar / Step-by-step reproduction instructions
- Beklediğiniz ve gerçekleşen davranış / Expected vs actual behavior
- Sistem bilgisi (İşletim sistemi, tarayıcı, Node.js ve pnpm sürümü) / System information (OS, browser, Node.js and pnpm versions)

### Özellik İsteği / Requesting a Feature

Yeni bir özellik önermek için [Feature Request](https://github.com/<repository>/issues/new?template=feature_request.md) şablonunu kullanın. / Use the Feature Request template.

Lütfen şu bilgileri ekleyin:
- Özelliğin açıklaması / Feature description
- Neden gerekli olduğu (hangi sorunu çözüyor?) / Why it is needed (what problem does it solve?)
- Önerilen çözüm / Proposed solution
- Varsa alternatif çözümler / Any alternative solutions considered

### Konu Başlığı Etiketleri / Issue Labels

- `bug` — Hata bildirimleri / Bug reports
- `enhancement` — Özellik istekleri / Feature requests

## Proje Sözleşmeleri / Project Conventions

Detaylı proje sözleşmeleri (dosya organizasyonu, tRPC procedure yapısı, Drizzle ORM iş akışı) için [DEVELOPMENT.md](docs/DEVELOPMENT.md) sayfasındaki **Project Conventions** bölümüne bakın.

## Sorular / Questions

Sorularınız için GitHub Issues üzerinden bir konu açabilir veya doğrudan proje sahibiyle iletişime geçebilirsiniz. / For questions, open a GitHub Issue or contact the project maintainer directly.
