#!/usr/bin/env bash
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı (macOS / Linux)
# Kullanım: chmod +x start-kairos.sh && ./start-kairos.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Uygulamaya "launcher tarafından yönetiliyorum" sinyali — buton ile güncelleme için.
export KAIROS_MANAGED=1
UPDATE_FLAG="$SCRIPT_DIR/data/.update-requested"

if [ ! -f .env.local ]; then
  printf "\n  \033[33mKurulum bulunamadı. Önce installer/install.sh dosyasını çalıştırın.\033[0m\n\n"
  exit 1
fi

# Bekleyen güncellemeyi uygula (git pull + install + build + migrate). Hata olursa eski sürümle devam.
apply_update() {
  printf "\n  \033[36m==> Güncelleme uygulanıyor...\033[0m\n"
  # Veritabanı yedeği
  if [ -f "$SCRIPT_DIR/data/db.sqlite" ]; then
    mkdir -p "$SCRIPT_DIR/data/backups"
    cp -f "$SCRIPT_DIR/data/db.sqlite" "$SCRIPT_DIR/data/backups/db-$(date +%Y%m%d-%H%M%S).sqlite" 2>/dev/null \
      && printf "    [OK] Veritabanı yedeklendi\n" || true
  fi
  # Güvenlik: yalnızca resmi depodan çek (origin değiştirilmişse güncelleme yapma).
  remote="$(git remote get-url origin 2>/dev/null | tr '[:upper:]' '[:lower:]' || true)"
  case "$remote" in
    *dictera/kairos*) : ;;
    *) printf "    \033[33m[!] Güncelleme kaynağı doğrulanamadı (origin resmi depo değil) — atlandı.\033[0m\n"; rm -f "$UPDATE_FLAG"; return 0 ;;
  esac
  if ! git pull --ff-only origin main; then
    printf "    \033[33m[!] git pull başarısız — güncelleme atlandı, mevcut sürümle devam.\033[0m\n"
    rm -f "$UPDATE_FLAG"; return 0
  fi
  pnpm install --frozen-lockfile || pnpm install || true
  if ! pnpm build; then
    printf "    \033[33m[!] Derleme başarısız — güncelleme yarıda kaldı. installer/install.sh ile yeniden kurun.\033[0m\n"
    rm -f "$UPDATE_FLAG"; return 0
  fi
  pnpm db:migrate || true
  rm -f "$UPDATE_FLAG"
  printf "    [OK] Güncelleme tamamlandı\n"
}

printf "\n  \033[36mKairos başlatılıyor... (bu terminali açık bırakın)\033[0m\n"
printf "  Tarayıcı birkaç saniye içinde açılacaktır.\n\n"

open_browser() {
  local url="http://localhost:3000" i code
  # Sunucu HTTP 200 dönene kadar bekle (port açık != sayfa hazır), en fazla ~120sn
  for i in $(seq 1 120); do
    if command -v curl >/dev/null 2>&1; then
      code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$url" 2>/dev/null || true)"
      [ "$code" = "200" ] && break
    elif (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
      exec 3>&- 3<&-; break
    fi
    sleep 1
  done
  open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || python3 -m webbrowser "$url" 2>/dev/null || true
}
open_browser &

# Çalıştırma döngüsü: bayrak varsa güncelle, sunucuyu başlat; buton tekrar bayrak yazıp çıkarsa yeniden başlat.
while true; do
  [ -f "$UPDATE_FLAG" ] && apply_update
  pnpm start || true
  if [ -f "$UPDATE_FLAG" ]; then
    printf "\n  \033[36mGüncelleme isteği alındı, yeniden başlatılıyor...\033[0m\n"
    continue
  fi
  break
done

printf "\n  \033[90mSunucu durdu.\033[0m\n"