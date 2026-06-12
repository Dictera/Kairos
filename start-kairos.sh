#!/usr/bin/env bash
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı (macOS / Linux)
# Kullanım: chmod +x start-kairos.sh && ./start-kairos.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env.local ]; then
  printf "\n  \033[33mKurulum bulunamadı. Önce installer/install.sh dosyasını çalıştırın.\033[0m\n\n"
  exit 1
fi

printf "\n  \033[36mKairos başlatılıyor... (bu terminali açık bırakın)\033[0m\n"
printf "  Tarayıcı birkaç saniye içinde açılacaktır.\n\n"

( sleep 5 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || python3 -m webbrowser http://localhost:3000 2>/dev/null ) &

pnpm start

printf "\n  \033[90mSunucu durdu.\033[0m\n"