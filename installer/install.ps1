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
    4b. better-sqlite3 native modülünü yeniden derle
    5. Uygulama derlemesi (pnpm build)
    6. Veritabanı şeması (pnpm db:migrate) + hata tanısı
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

# Çalıştırılabilir shim'i (.cmd/.exe/.bat) çöz. Node/corepack, isimlerin
# uzantısız (bash) sürümlerini de PATH'e koyar; bunlar PATHEXT'te olmadığından
# Windows "Bu dosyayı nasıl açmak istersiniz?" penceresini gösterir.
# Bu yüzden adı eşleşen ilk .cmd/.exe/.bat shim'ini seçeriz.
function Resolve-Exe {
  param([string]$Name)
  Get-Command $Name -All -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -match '\.(cmd|exe|bat)$' } |
    Select-Object -First 1 -ExpandProperty Source
}
function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
  $pnpm = Resolve-Exe 'pnpm'
  if ($pnpm) {
    & $pnpm @PnpmArgs 2>&1
  } else {
    $corepack = Resolve-Exe 'corepack'
    if ($corepack) { & $corepack pnpm @PnpmArgs 2>&1 }
    else { Fail "pnpm veya corepack bulunamadı." }
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
$corepackExe = Resolve-Exe 'corepack'
if ($corepackExe) {
  & $corepackExe enable 2>$null | Out-Null
  & $corepackExe prepare pnpm@11.6.0 --activate 2>$null | Out-Null
}
if (-not (Resolve-Exe 'pnpm') -and -not $corepackExe) {
  Write-Note "corepack yok, pnpm npm ile kuruluyor..."
  $npmExe = Resolve-Exe 'npm'
  if (-not $npmExe) { Fail "npm bulunamadı, pnpm kurulamadı." }
  & $npmExe install -g pnpm
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
# Önce frozen-lockfile ile dene (tekrar üretilebilir kurulum), başarısız olursa normal install'a düş
$pnpmExe = Resolve-Exe 'pnpm'
if (-not $pnpmExe) {
  $corepackTmp = Resolve-Exe 'corepack'
  if ($corepackTmp) { $pnpmExe = $corepackTmp }
}
if (-not $pnpmExe) { Fail "pnpm bulunamadı." }

$installOk = $false
if ($pnpmExe) {
  Write-Note "pnpm install --frozen-lockfile deneniyor..."
  & $pnpmExe install --frozen-lockfile 2>&1 | Write-Host
  if ($LASTEXITCODE -eq 0) {
    $installOk = $true
    Write-Ok "Bağımlılıklar yüklendi (frozen-lockfile)"
  } else {
    Write-Warn "frozen-lockfile başarısız oldu, normal install deneniyor..."
    & $pnpmExe install 2>&1 | Write-Host
    if ($LASTEXITCODE -eq 0) {
      $installOk = $true
      Write-Ok "Bağımlılıklar yüklendi"
    }
  }
}
if (-not $installOk) {
  Fail "Bağımlılıklar yüklenemedi. Node.js 18+ LTS kurulu olduğundan emin olun."
}

# ------------------------------------------------------------------
# 4b. better-sqlite3 native modülünü doğrula ve gerekirse yeniden derle
# ------------------------------------------------------------------
Write-Step "Veritabanı modülü doğrulanıyor (better-sqlite3)"
try {
  $nodeExe = Resolve-Exe 'node'
  if ($nodeExe) {
    Push-Location $RepoRoot
    $bs3Test = & $nodeExe -e "try{require('better-sqlite3');console.log('OK')}catch(e){console.error('FAIL:'+e.message)}" 2>&1
    Pop-Location
    if ($bs3Test -match 'FAIL') {
      Write-Warn "better-sqlite3 yüklenemedi, yeniden derleme deneniyor..."
      if ($pnpmExe) {
        & $pnpmExe rebuild better-sqlite3 2>&1 | Write-Host
      }
      Push-Location $RepoRoot
      $bs3Test2 = & $nodeExe -e "try{require('better-sqlite3');console.log('OK')}catch(e){console.error('FAIL:'+e.message)}" 2>&1
      Pop-Location
      if ($bs3Test2 -match 'FAIL') {
        Write-Host ""
        Write-Host "[HATA] better-sqlite3 yerel modülü derlenemiyor." -ForegroundColor Red
        Write-Host "   Çözüm: Visual Studio Build Tools kurun (C++ workload):" -ForegroundColor Yellow
        Write-Host "   https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
        Write-Host "   Ardından setup.bat'i tekrar çalıştırın." -ForegroundColor Yellow
        Write-Host ""
        Fail "better-sqlite3 modülü yüklenemiyor. Yukarıdaki çözümü uygulayın."
      }
      Write-Ok "better-sqlite3 yeniden derlendi"
    } else {
      Write-Ok "better-sqlite3 modülü hazır"
    }
  }
} catch {
  Write-Warn "better-sqlite3 doğrulaması atlandı (devam ediliyor)"
}

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
# data/ dizininin var olduğundan emin ol (ZIP çıkarmada .gitkeep korunmayabilir)
$dataDir = Join-Path $RepoRoot 'data'
if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  Write-Note "data/ dizini oluşturuldu"
}

# db:migrate - çıktıyı yakala, hata durumunda detaylı mesaj göster
$migrateOutput = & $pnpmExe db:migrate 2>&1
$migrateExit = $LASTEXITCODE
Write-Host $migrateOutput
if ($migrateExit -ne 0) {
  Write-Host ""
  Write-Host "=== VERİTABANI GEÇİŞ HATASI ===" -ForegroundColor Red
  Write-Host $migrateOutput -ForegroundColor Red
  Write-Host ""
  Write-Host "Olası nedenler ve çözümler:" -ForegroundColor Yellow
  Write-Host "  1. better-sqlite3 native modülü derlenmemiş" -ForegroundColor Yellow
  Write-Host "     -> Visual Studio Build Tools (C++ workload) kurun:" -ForegroundColor Yellow
  Write-Host "        https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
  Write-Host "  2. Node.js sürüm uyumsuzluğu (18+ LTS gerekli)" -ForegroundColor Yellow
  Write-Host "  3. data/ dizini yazılabilir değil" -ForegroundColor Yellow
  Write-Host ""
  Fail "Veritabanı geçişi başarısız oldu. Yukarıdaki hata mesajını inceleyin."
}
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