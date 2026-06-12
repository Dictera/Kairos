#requires -Version 5.1
<#
  Kairos - Sigorta Uyuşmazlık Takip
  Son kullanıcı kurulum betiği.

  Yaptıkları:
    1. Node.js 18+ kontrolü (yoksa winget ile kurar)
    2. pnpm etkinleştirme (corepack)
    3. Kurulum seçenekleri + .env.local oluşturma
       (rastgele SESSION_PASSWORD, APP_PASSWORD, opsiyonel Telegram)
    4. Bağımlılıkların yüklenmesi (pnpm install)
    5. Uygulama derlemesi (pnpm build)
    6. Veritabanı şeması (pnpm db:migrate)
    7. Opsiyonel Python pipeline kurulumu (.docx -> PDF)
    8. Masaüstü + Başlat menüsü kısayolu

  Güvenlik:
    - SESSION_PASSWORD kriptografik RNG ile üretilir.
    - Mevcut .env.local ASLA üzerine yazılmaz.
    - APP_PASSWORD ekrana yazılmaz / okunmaz.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Türkçe karakterlerin konsolda doğru görünmesi için UTF-8 giriş/çıkış
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { [Console]::InputEncoding  = [System.Text.Encoding]::UTF8 } catch {}

# --- Repo kökü: bu betik installer\ içinde, kök bir üst dizin ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot

# ------------------------------------------------------------------
# Yardımcı fonksiyonlar
# ------------------------------------------------------------------
function Write-Step { param([string]$Msg) Write-Host "`n==> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "    [OK] $Msg" -ForegroundColor Green }
function Write-Note { param([string]$Msg) Write-Host "    $Msg" -ForegroundColor DarkGray }
function Write-Warn { param([string]$Msg) Write-Host "    [!] $Msg" -ForegroundColor Yellow }
function Fail {
  param([string]$Msg)
  Write-Host "`n[HATA] $Msg" -ForegroundColor Red
  exit 1
}

function Test-Command {
  param([string]$Name)
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# Türkçe Evet/Hayır sorusu. Boş cevap varsayılanı döndürür.
function Read-YesNo {
  param([string]$Question, [bool]$Default = $false)
  $hint = if ($Default) { '[E/h]' } else { '[e/H]' }
  while ($true) {
    $ans = (Read-Host "    $Question $hint").Trim().ToLower()
    if ([string]::IsNullOrEmpty($ans)) { return $Default }
    if ($ans -in @('e', 'evet', 'y', 'yes')) { return $true }
    if ($ans -in @('h', 'hayir', 'hayır', 'n', 'no')) { return $false }
    Write-Warn "Lütfen E (evet) veya H (hayır) girin."
  }
}

# pnpm'i güvenilir çağırmak için: önce doğrudan, olmazsa corepack üzerinden
function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
  if (Test-Command 'pnpm') {
    & pnpm @PnpmArgs
  } else {
    & corepack pnpm @PnpmArgs
  }
  if ($LASTEXITCODE -ne 0) { Fail "pnpm $($PnpmArgs -join ' ') komutu başarısız oldu (kod $LASTEXITCODE)." }
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor White
Write-Host "  Kairos - Sigorta Uyuşmazlık Takip - Kurulum" -ForegroundColor White
Write-Host "===========================================================" -ForegroundColor White

# ------------------------------------------------------------------
# 1. Node.js
# ------------------------------------------------------------------
Write-Step "Node.js kontrol ediliyor"
$nodeOk = $false
if (Test-Command 'node') {
  $nodeVersion = (& node --version) -replace '^v', ''
  $major = [int]($nodeVersion.Split('.')[0])
  if ($major -ge 18) {
    Write-Ok "Node.js $nodeVersion bulundu"
    $nodeOk = $true
  } else {
    Write-Warn "Node.js $nodeVersion çok eski (18+ gerekli)."
  }
}

if (-not $nodeOk) {
  if (Test-Command 'winget') {
    Write-Note "Node.js LTS, winget ile kuruluyor..."
    & winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
      Fail "Node.js otomatik kurulamadı. Lütfen https://nodejs.org adresinden LTS sürümünü kurup setup.bat dosyasını tekrar çalıştırın."
    }
    Write-Warn "Node.js kuruldu. PATH'in güncellenmesi için bu pencereyi KAPATIP setup.bat dosyasını TEKRAR çalıştırın."
    exit 0
  } else {
    Fail "Node.js bulunamadı ve winget yok. Lütfen https://nodejs.org adresinden Node.js 18+ LTS kurup setup.bat dosyasını tekrar çalıştırın."
  }
}

# ------------------------------------------------------------------
# 2. pnpm (corepack)
# ------------------------------------------------------------------
Write-Step "pnpm hazırlanıyor"
if (Test-Command 'corepack') {
  & corepack enable 2>$null | Out-Null
  & corepack prepare pnpm@11.5.0 --activate 2>$null | Out-Null
}
if (-not (Test-Command 'pnpm') -and -not (Test-Command 'corepack')) {
  Write-Note "corepack yok, pnpm npm ile kuruluyor..."
  & npm install -g pnpm
  if ($LASTEXITCODE -ne 0) { Fail "pnpm kurulamadı." }
}
Write-Ok "pnpm hazır"

# ------------------------------------------------------------------
# 3. Kurulum seçenekleri + .env.local
#    (Tüm sorular burada sorulur; uzun adımlar sonra gözetimsiz çalışır.)
# ------------------------------------------------------------------
Write-Step "Kurulum seçenekleri"

# --- Opsiyon: belge şablonundan PDF (Python pipeline) ---
Write-Host ""
Write-Host "    Belge şablonu (.docx) -> PDF üretimi opsiyonel bir özelliktir." -ForegroundColor White
Write-Host "    Python 3.8+ ve LibreOffice gerektirir." -ForegroundColor DarkGray
$wantPdf = Read-YesNo "Şablondan PDF üretimi kurulsun mu?" $false

# --- .env.local + opsiyonel Telegram ---
$envPath   = Join-Path $RepoRoot '.env.local'
$envExists = Test-Path $envPath

if ($envExists) {
  Write-Ok ".env.local zaten var - dokunulmadı"
  Write-Note "Telegram bildirimlerini eklemek için .env.local içindeki TELEGRAM_* alanlarını düzenleyin."
} else {
  # Kriptografik olarak güvenli rastgele SESSION_PASSWORD (48 karakter, alfanümerik)
  $alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $bufLen = 48
    $buf = New-Object 'System.Byte[]' $bufLen
    $rng.GetBytes($buf)
    $sb = New-Object System.Text.StringBuilder $bufLen
    foreach ($b in $buf) { [void]$sb.Append($alphabet[[int]$b % $alphabet.Length]) }
    $sessionPassword = $sb.ToString()
  } finally {
    $rng.Dispose()
  }

  # APP_PASSWORD kullanıcıdan alınır (giriş şifresi) - ekrana yazılmaz
  Write-Host ""
  Write-Host "    Uygulamaya giriş için bir şifre belirleyin." -ForegroundColor White
  $appPassword = ''
  while ([string]::IsNullOrWhiteSpace($appPassword)) {
    $secure = Read-Host "    Giriş şifresi (APP_PASSWORD)" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ([string]::IsNullOrWhiteSpace($appPassword)) { Write-Warn "Şifre boş olamaz." }
  }

  # Opsiyon: Telegram bildirimleri
  $telegramToken  = ''
  $telegramChatId = ''
  Write-Host ""
  Write-Host "    Telegram bildirimleri (günlük duruşma/süre uyarıları) opsiyoneldir." -ForegroundColor White
  if (Read-YesNo "Telegram bildirimleri kurulsun mu?" $false) {
    Write-Note "Bot token: Telegram'da @BotFather -> /newbot ile alınır."
    Write-Note "Chat ID: Telegram'da @userinfobot'a mesaj atınca görünür."
    while ([string]::IsNullOrWhiteSpace($telegramToken)) {
      $telegramToken = (Read-Host "    TELEGRAM_BOT_TOKEN").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramToken)) { Write-Warn "Token boş olamaz (vazgeçmek için Ctrl+C)." }
    }
    while ([string]::IsNullOrWhiteSpace($telegramChatId)) {
      $telegramChatId = (Read-Host "    TELEGRAM_CHAT_ID").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramChatId)) { Write-Warn "Chat ID boş olamaz (vazgeçmek için Ctrl+C)." }
    }
    Write-Ok "Telegram bilgileri kaydedilecek"
  } else {
    Write-Note "Telegram atlandı - bildirimler devre dışı (sonradan .env.local'dan eklenebilir)."
  }

  $envContent = @"
SESSION_PASSWORD=$sessionPassword
SESSION_COOKIE_NAME=sigorta-session
APP_PASSWORD=$appPassword

# Pipeline yapılandırması (boş bırakılırsa otomatik algılanır)
PYTHON_PATH=
LIBREOFFICE_PATH=

# Telegram bildirimleri (opsiyonel - boş ise bildirimler atlanır)
TELEGRAM_BOT_TOKEN=$telegramToken
TELEGRAM_CHAT_ID=$telegramChatId
"@
  # UTF-8 (BOM'suz) yaz
  [System.IO.File]::WriteAllText($envPath, $envContent, (New-Object System.Text.UTF8Encoding($false)))
  Write-Ok ".env.local oluşturuldu (SESSION_PASSWORD otomatik üretildi)"
}

# ------------------------------------------------------------------
# 4. Bağımlılıklar
# ------------------------------------------------------------------
Write-Step "Bağımlılıklar yükleniyor (pnpm install) - birkaç dakika sürebilir"
Invoke-Pnpm install --frozen-lockfile
Write-Ok "Bağımlılıklar yüklendi"

# ------------------------------------------------------------------
# 5. Derleme
# ------------------------------------------------------------------
Write-Step "Uygulama derleniyor (pnpm build) - birkaç dakika sürebilir"
Invoke-Pnpm build
Write-Ok "Derleme tamamlandı"

# ------------------------------------------------------------------
# 6. Veritabanı
# ------------------------------------------------------------------
Write-Step "Veritabanı hazırlanıyor (db:migrate)"
Invoke-Pnpm db:migrate
Write-Ok "Veritabanı hazır (data\db.sqlite)"

# ------------------------------------------------------------------
# 7. Opsiyonel Python pipeline (.docx -> PDF)
# ------------------------------------------------------------------
Write-Step "Belge şablonu (PDF) pipeline'ı"
if ($wantPdf) {
  $venvScript = Join-Path $RepoRoot 'scripts\docx-pipeline\setup-venv.ps1'
  if ((Test-Command 'python') -and (Test-Path $venvScript)) {
    try {
      & powershell -NoProfile -ExecutionPolicy Bypass -File $venvScript
      if ($LASTEXITCODE -eq 0) { Write-Ok "Python pipeline kuruldu" }
      else { Write-Warn "Python pipeline kurulamadı - şablon PDF özelliği devre dışı (uygulama yine de çalışır)." }
    } catch {
      Write-Warn "Python pipeline kurulumu atlandı - şablon PDF özelliği devre dışı (uygulama yine de çalışır)."
    }
    if (-not (Test-Command 'soffice')) {
      Write-Note "LibreOffice (soffice) PATH'te bulunamadı - PDF dönüşümü için kurulu olmalı: https://www.libreoffice.org"
    }
  } else {
    Write-Warn "Python bulunamadı - şablon PDF özelliği kurulamadı."
    Write-Note "Python 3.8+ ve LibreOffice kurup setup.bat'i tekrar çalıştırın."
  }
} else {
  Write-Note "Şablondan PDF üretimi atlandı (seçilmedi)."
}

# ------------------------------------------------------------------
# 8. Kısayollar
# ------------------------------------------------------------------
Write-Step "Kısayollar oluşturuluyor"
$launcher = Join-Path $RepoRoot 'start-kairos.bat'
$iconFile = Join-Path $RepoRoot 'public\app-icon.ico'
$iconLoc  = if (Test-Path $iconFile) { "$iconFile,0" } else { "$env:SystemRoot\System32\shell32.dll,13" }
if (Test-Path $launcher) {
  $WshShell = New-Object -ComObject WScript.Shell
  foreach ($dir in @([Environment]::GetFolderPath('Desktop'),
                     (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'))) {
    try {
      if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
      $lnkPath = Join-Path $dir 'Kairos.lnk'
      $sc = $WshShell.CreateShortcut($lnkPath)
      $sc.TargetPath       = $launcher
      $sc.WorkingDirectory = $RepoRoot
      $sc.Description       = 'Kairos - Sigorta Uyuşmazlık Takip'
      $sc.IconLocation      = $iconLoc
      $sc.Save()
    } catch {
      Write-Warn "Kısayol oluşturulamadı: $dir"
    }
  }
  Write-Ok "Masaüstü ve Başlat menüsü kısayolları oluşturuldu"
} else {
  Write-Warn "start-kairos.bat bulunamadı - kısayol atlandı."
}

# ------------------------------------------------------------------
# Bitti
# ------------------------------------------------------------------
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Kurulum tamamlandı!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Uygulamayı başlatmak için masaüstündeki 'Kairos'" -ForegroundColor White
Write-Host "  kısayoluna çift tıklayın (veya start-kairos.bat)." -ForegroundColor White
Write-Host "  Tarayıcıda http://localhost:3000 açılacaktır." -ForegroundColor White
Write-Host ""
exit 0
