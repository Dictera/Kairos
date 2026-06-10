# Kairos — Kurulum Kılavuzu (Son Kullanıcı)

Sigorta Uyuşmazlık Takip uygulamasını bilgisayarınıza kurmak için bu adımları izleyin.
Teknik bilgi gerekmez — sadece çift tıklayın.

## Gereksinimler

- **Windows 10 / 11**
- **İnternet bağlantısı** (yalnızca ilk kurulum sırasında — gerekli bileşenler indirilir)

> Node.js kurulu değilse kurulum betiği bunu sizin için otomatik kurar.

## Kurulum (tek seferlik)

1. **`setup.bat`** dosyasına **çift tıklayın.**
2. Açılan pencerede sizden bir **giriş şifresi** istenecek — uygulamaya her girişte kullanacağınız şifre budur. Yazıp Enter'a basın.
3. Kurulumun bitmesini bekleyin (ilk kurulum birkaç dakika sürebilir).
   - *Not:* Node.js yeni kurulduysa pencere kapanıp **`setup.bat`'i bir kez daha** çalıştırmanız istenebilir. Bu normaldir.
4. "Kurulum tamamlandı!" mesajını gördüğünüzde hazırsınız. Masaüstünde **Kairos** kısayolu oluşur.

## Uygulamayı Başlatma

- Masaüstündeki **Kairos** kısayoluna (veya klasördeki **`start-kairos.bat`**) çift tıklayın.
- Açılan siyah pencereyi **kapatmayın** — uygulama bu pencere açıkken çalışır.
- Tarayıcınız otomatik olarak **http://localhost:3000** adresini açar.
- Kurulumda belirlediğiniz **giriş şifresi** ile oturum açın.

## Uygulamayı Kapatma

- Çalışan siyah pencereyi kapatın. Uygulama durur, verileriniz bilgisayarınızda saklı kalır.

## Sık Sorulanlar

**Verilerim nerede?**
Tüm veriler bilgisayarınızda `data\db.sqlite` dosyasında tutulur. İnternete gönderilmez.

**Şifremi unuttum.**
Klasördeki `.env.local` dosyasını bir metin düzenleyiciyle açıp `APP_PASSWORD=` satırındaki değeri değiştirin.

**Belge şablonundan PDF üretimi çalışmıyor.**
Bu özellik için **Python 3.8+** ve **LibreOffice** kurulu olmalıdır. İkisini de kurduktan sonra `setup.bat`'i tekrar çalıştırın.

**Telegram bildirimleri.**
Opsiyoneldir. Kurmak için `.env.local` içindeki `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` alanlarını doldurun (ayrıntılar `.env.example` dosyasında).

---

Sorun yaşarsanız `setup.bat` penceresindeki kırmızı **[HATA]** mesajını not alın.
