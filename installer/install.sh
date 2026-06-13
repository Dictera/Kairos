#!/usr/bin/env bash
# Kairos - Sigorta Uyuşmazlık Takip
# Son kullanıcı kurulum betiği (macOS / Linux).
#
# Yaptıkları:
#   1. Node.js 18+ kontrolü (yoksa Homebrew / apt'den kurar)
#   2. pnpm etkinleştirme (corepack)
#   3. Kurulum seçenekleri + .env.local oluşturma
#      (rastgele SESSION_PASSWORD, APP_PASSWORD, opsiyonel Telegram)
#   4. Bağımlılıkların yüklenmesi (pnpm install)
#   5. Uygulama derlemesi (pnpm build)
#   6. Veritabanı şeması (pnpm db:migrate) + hata tanısı
#   7. Opsiyonel Python pipeline kurulumu (.docx -> PDF)
#   8. Uygulama kısayolu / başlatma bilgisi
#
# Kullanım:
#   chmod +x installer/install.sh && ./installer/install.sh

set -euo pipefail

# --- Geçici dosya temizliği ---
_CLEANUP_FILES=()
cleanup() {
  local f
  for f in "${_CLEANUP_FILES[@]+"${_CLEANUP_FILES[@]}"}"; do
    rm -f "$f" 2>/dev/null || true
  done
}
trap cleanup EXIT

# --- Repo kökü: bu betik installer/ içinde, kök bir üst dizin ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# --- Renk yardımcıları (terminal destekliyorsa) ---
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'
  GRAY='\033[0;90m'; BOLD='\033[1m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; GRAY=''; BOLD=''; NC=''
fi

step()  { printf "\n${CYAN}==> %s${NC}\n" "$1"; }
ok()    { printf "    ${GREEN}[OK] %s${NC}\n" "$1"; }
note()  { printf "    ${GRAY}%s${NC}\n" "$1"; }
warn()  { printf "    ${YELLOW}[!] %s${NC}\n" "$1"; }
fail()  { printf "\n${RED}[HATA] %s${NC}\n" "$1" >&2; exit 1; }

# --- Evet/Hayır sorusu ---
yesno() {
  local question="$1" default="${2:-no}" hint ans
  if [ "$default" = "yes" ]; then hint="[E/h]"; else hint="[e/H]"; fi
  while true; do
    printf "    %s %s " "$question" "$hint"
    read -r ans
    ans="$(echo "$ans" | tr '[:upper:]' '[:lower:]' | xargs)"
    if [ -z "$ans" ]; then
      [ "$default" = "yes" ] && return 0 || return 1
    fi
    case "$ans" in
      e|evet|y|yes) return 0 ;;
      h|hayir|hayır|n|no) return 1 ;;
      *) printf "    ${YELLOW}Lütfen E (evet) veya H (hayır) girin.${NC}\n" ;;
    esac
  done
}

# --- Komut var mı? ---
has_cmd() { command -v "$1" >/dev/null 2>&1; }

# --- Kriptografik rastgele parola üret ---
rand_password() {
  local len="${1:-48}"
  if has_cmd openssl; then
    openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c "$len"
  elif [ -c /dev/urandom ]; then
    head -c "$((len * 3))" /dev/urandom 2>/dev/null | tr -dc 'a-zA-Z0-9' | head -c "$len" || true
  else
    local i result=""
    for i in $(seq 1 "$len"); do
      result="$result$(printf '%02x' $((RANDOM % 256)))"
    done
    echo "$result" | head -c "$len"
  fi
}

# --- macOS belirleni ---
is_macos() { [ "$(uname -s)" = "Darwin" ]; }
is_linux() { [ "$(uname -s)" = "Linux" ]; }

# =================================================================
printf "\n${BOLD}===========================================================${NC}\n"
printf "${BOLD}  Kairos - Sigorta Uyuşmazlık Takip - Kurulum${NC}\n"
printf "${BOLD}===========================================================${NC}\n"

# ------------------------------------------------------------------
# 1. Node.js
# ------------------------------------------------------------------
step "Node.js kontrol ediliyor"
NODE_OK=false
if has_cmd node; then
  NODE_VERSION="$(node --version | sed 's/^v//')"
  NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
  if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
    ok "Node.js $NODE_VERSION bulundu"
    NODE_OK=true
  else
    warn "Node.js $NODE_VERSION çok eski (18+ gerekli)."
  fi
fi

if [ "$NODE_OK" = false ]; then
  if is_macos && has_cmd brew; then
    note "Node.js LTS, Homebrew ile kuruluyor..."
    brew install node@22 || brew install node
    if [ $? -ne 0 ]; then
      fail "Node.js otomatik kurulamadı. Lütfen https://nodejs.org adresinden LTS sürümünü kurup install.sh dosyasını tekrar çalıştırın."
    fi
    ok "Node.js kuruldu"
    hash -r 2>/dev/null || true
    exec "$0" "$@"
  elif is_linux && has_cmd apt-get; then
    note "Node.js LTS, NodeSource ile kuruluyor..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl
    NS_TMP="$(mktemp)"
    _CLEANUP_FILES+=("$NS_TMP")
    curl -fsSL -o "$NS_TMP" https://deb.nodesource.com/setup_22.x || { rm -f "$NS_TMP"; fail "NodeSource betiği indirilemedi."; }
    sudo -E bash "$NS_TMP"
    NS_EXIT=$?
    rm -f "$NS_TMP"
    if [ $NS_EXIT -ne 0 ]; then fail "NodeSource betiği çalıştırılamadı."; fi
    sudo apt-get install -y -qq nodejs || fail "Node.js otomatik kurulamadı. Lütfen https://nodejs.org adresinden LTS sürümünü kurun."
    ok "Node.js kuruldu"
    exec "$0" "$@"
  else
    fail "Node.js bulunamadı. Lütfen https://nodejs.org adresinden Node.js 18+ LTS kurup install.sh dosyasını tekrar çalıştırın."
  fi
fi

# ------------------------------------------------------------------
# 2. pnpm (corepack)
# ------------------------------------------------------------------
step "pnpm hazırlanıyor"
if has_cmd corepack; then
  corepack enable 2>/dev/null || true
  corepack prepare pnpm@11.6.0 --activate 2>/dev/null || true
fi
if ! has_cmd pnpm; then
  if has_cmd corepack; then
    note "pnpm corepack üzerinden etkinleştiriliyor..."
    corepack enable
    corepack prepare pnpm@11.6.0 --activate
  elif has_cmd npm; then
    note "corepack yok, pnpm npm ile kuruluyor..."
    npm install -g pnpm || fail "pnpm kurulamadı."
  else
    fail "npm/corepack bulunamadı, pnpm kurulamadı."
  fi
fi
has_cmd pnpm || fail "pnpm bulunamadı."
ok "pnpm hazır"

# ------------------------------------------------------------------
# 3. Kurulum seçenekleri + .env.local
# ------------------------------------------------------------------
step "Kurulum seçenekleri"

printf "\n    Belge şablonu (.docx) -> PDF üretimi opsiyonel bir özelliktir.\n"
printf "    ${GRAY}Python 3.8+ ve LibreOffice gerektirir.${NC}\n"
WANT_PDF=false
if yesno "Şablondan PDF üretimi kurulsun mu?" no; then
  WANT_PDF=true
fi

ENV_PATH="$REPO_ROOT/.env.local"
if [ -f "$ENV_PATH" ]; then
  ok ".env.local zaten var - dokunulmadı"
  note "Telegram bildirimlerini eklemek için .env.local içindeki TELEGRAM_* alanlarını düzenleyin."
else
  SESSION_PASSWORD="$(rand_password 48)"

  printf "\n    Uygulamaya giriş için bir şifre belirleyin.\n"
  APP_PASSWORD=''
  while [ -z "$APP_PASSWORD" ]; do
    read -s -p "    Giriş şifresi (APP_PASSWORD): " APP_PASSWORD
    printf "\n"
    if [ -z "$APP_PASSWORD" ]; then
      warn "Şifre boş olamaz."
    fi
  done

  TELEGRAM_TOKEN=''
  TELEGRAM_CHAT_ID=''
  printf "\n    Telegram bildirimleri (günlük duruşma/süre uyarıları) opsiyoneldir.\n"
  if yesno "Telegram bildirimleri kurulsun mu?" no; then
    note "Bot token: Telegram'da @BotFather -> /newbot ile alınır."
    note "Chat ID: Telegram'da @userinfobot'a mesaj atınca görünür."
    while [ -z "$TELEGRAM_TOKEN" ]; do
      read -p "    TELEGRAM_BOT_TOKEN: " TELEGRAM_TOKEN
      TELEGRAM_TOKEN="$(echo "$TELEGRAM_TOKEN" | tr -d '[:space:]')"
      if [ -z "$TELEGRAM_TOKEN" ]; then warn "Token boş olamaz (vazgeçmek için Ctrl+C)."; fi
    done
    while [ -z "$TELEGRAM_CHAT_ID" ]; do
      read -p "    TELEGRAM_CHAT_ID: " TELEGRAM_CHAT_ID
      TELEGRAM_CHAT_ID="$(echo "$TELEGRAM_CHAT_ID" | tr -d '[:space:]')"
      if [ -z "$TELEGRAM_CHAT_ID" ]; then warn "Chat ID boş olamaz (vazgeçmek için Ctrl+C)."; fi
    done
    ok "Telegram bilgileri kaydedilecek"
  else
    note "Telegram atlandı - bildirimler devre dışı (sonradan .env.local'dan eklenebilir)."
  fi

  env_quote() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }
  cat > "$ENV_PATH" << ENVEOF
SESSION_PASSWORD=$(env_quote "$SESSION_PASSWORD")
SESSION_COOKIE_NAME=sigorta-session
APP_PASSWORD=$(env_quote "$APP_PASSWORD")

# Pipeline yapılandırması (boş bırakılırsa otomatik algılanır)
PYTHON_PATH=
LIBREOFFICE_PATH=

# Telegram bildirimleri (opsiyonel - boş ise bildirimler atlanır)
TELEGRAM_BOT_TOKEN=$(env_quote "$TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID=$(env_quote "$TELEGRAM_CHAT_ID")
ENVEOF
  chmod 600 "$ENV_PATH"
  unset APP_PASSWORD SESSION_PASSWORD TELEGRAM_TOKEN TELEGRAM_CHAT_ID 2>/dev/null || true
  ok ".env.local oluşturuldu (SESSION_PASSWORD otomatik üretildi)"
fi

# ------------------------------------------------------------------
# 4. Bağımlılıklar
# ------------------------------------------------------------------
step "Bağımlılıklar yükleniyor (pnpm install) - birkaç dakika sürebilir"
note "pnpm install --frozen-lockfile deneniyor..."
if pnpm install --frozen-lockfile 2>&1; then
  ok "Bağımlılıklar yüklendi (frozen-lockfile)"
else
  warn "frozen-lockfile başarısız oldu, normal install deneniyor..."
  pnpm install || fail "Bağımlılıklar yüklenemedi. Node.js 18+ LTS kurulu olduğundan emin olun."
  ok "Bağımlılıklar yüklendi"
fi

# ------------------------------------------------------------------
# 5. Derleme
# ------------------------------------------------------------------
step "Uygulama derleniyor (pnpm build) - birkaç dakika sürebilir"
pnpm build || fail "Derleme başarısız oldu (kod $?)."
ok "Derleme tamamlandı"

# ------------------------------------------------------------------
# 6. Veritabanı
# ------------------------------------------------------------------
step "Veritabanı hazırlanıyor (db:migrate)"
DATA_DIR="$REPO_ROOT/data"
if [ ! -d "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR"
  note "data/ dizini oluşturuldu"
fi

MIGRATE_OUTPUT="$(pnpm db:migrate 2>&1)" || true
MIGRATE_EXIT=$?
printf "%s\n" "$MIGRATE_OUTPUT"
if [ "$MIGRATE_EXIT" -ne 0 ]; then
  printf "\n${RED}=== VERİTABANI GEÇİŞ HATASI ===${NC}\n"
  printf "%s\n" "$MIGRATE_OUTPUT"
  printf "\n${YELLOW}Not: derleme (adım 5) başarılı oldu; better-sqlite3 native modül ve${NC}\n"
  printf "${YELLOW}C++ derleyici bu noktada SORUN DEĞİLDİR.${NC}\n"
  printf "${YELLOW}Olası nedenler ve çözümler:${NC}\n"
  printf "  ${YELLOW}1. drizzle/ içindeki bir migration SQL hatası (en olası neden)${NC}\n"
  printf "     ${YELLOW}-> Ayrıntılı hata için: pnpm exec drizzle-kit migrate${NC}\n"
  printf "  ${YELLOW}2. data/ dizini yazılabilir değil${NC}\n"
  printf "  ${YELLOW}3. data/db.sqlite başka bir süreç tarafından kilitli (uygulamayı kapatın)${NC}\n\n"
  fail "Veritabanı geçişi başarısız oldu. Yukarıdaki hata mesajını inceleyin."
fi
ok "Veritabanı hazır (data/db.sqlite)"

# ------------------------------------------------------------------
# 7. Opsiyonel Python pipeline (.docx -> PDF)
# ------------------------------------------------------------------
step "Belge şablonu (PDF) pipeline'ı"
if [ "$WANT_PDF" = true ]; then
  VENV_SCRIPT="$REPO_ROOT/scripts/docx-pipeline/setup-venv.sh"
  if has_cmd python3 && [ -f "$VENV_SCRIPT" ]; then
    chmod +x "$VENV_SCRIPT"
    if bash "$VENV_SCRIPT"; then
      ok "Python pipeline kuruldu"
    else
      warn "Python pipeline kurulamadı - şablon PDF özelliği devre dışı (uygulama yine de çalışır)."
    fi
    if ! has_cmd soffice; then
      note "LibreOffice (soffice) PATH'te bulunamadı - PDF dönüşümü için kurulu olmalı: https://www.libreoffice.org"
    fi
  else
    if ! has_cmd python3; then
      warn "Python3 bulunamadı - şablon PDF özelliği kurulamadı."
      note "Python 3.8+ ve LibreOffice kurup install.sh dosyasını tekrar çalıştırın."
    fi
    if [ ! -f "$VENV_SCRIPT" ]; then
      warn "setup-venv.sh bulunamadı - Python pipeline atlandı."
    fi
  fi
else
  note "Şablondan PDF üretimi atlandı (seçilmedi)."
fi

# ------------------------------------------------------------------
# 8. Başlatma bilgisi
# ------------------------------------------------------------------
step "Kurulum tamamlandı"
printf "\n${GREEN}===========================================================${NC}\n"
printf "${GREEN}  Kurulum tamamlandı!${NC}\n"
printf "${GREEN}===========================================================${NC}\n"
printf "  Uygulamayı başlatmak için:${NC}\n"
printf "    ${BOLD}./start-kairos.sh${NC}\n"
printf "    veya: ${BOLD}pnpm start${NC}\n\n"
printf "  Tarayıcıda http://localhost:3000 açılacaktır.\n\n"

START_SCRIPT="$REPO_ROOT/start-kairos.sh"
if [ ! -f "$START_SCRIPT" ]; then
  note "start-kairos.sh oluşturuluyor..."
  cat > "$START_SCRIPT" << 'STARTEOF'
#!/usr/bin/env bash
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı (macOS / Linux)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env.local ]; then
  printf "\n  Kurulum bulunamadı. Önce installer/install.sh dosyasını çalıştırın.\n\n"
  exit 1
fi

printf "\n  Kairos başlatılıyor... (bu terminali açık bırakın)\n"
printf "  Tarayıcı birkaç saniye içinde açılacaktır.\n\n"

# Tarayıcıyı arka planda aç (gecikmeli)
( sleep 5 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || python3 -m webbrowser http://localhost:3000 2>/dev/null ) &

pnpm start

printf "\n  Sunucu durdu.\n"
STARTEOF
  chmod +x "$START_SCRIPT"
  ok "start-kairos.sh oluşturuldu"
fi

exit 0