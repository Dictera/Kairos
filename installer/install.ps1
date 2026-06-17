#requires -Version 5.1
<#
  Kairos - Sigorta Uyuşmazlık Takip
  Son kullanıcı kurulum betiği (Windows).

  Yaptıkları:
    1. Node.js 20.9+ kontrolü (yoksa winget ile kurar)
    2. pnpm etkinleştirme (corepack)
    3. Kurulum seçenekleri + .env.local oluşturma
       (rastgele SESSION_PASSWORD, APP_PASSWORD, opsiyonel Telegram)
    4. Bağımlılıkların yüklenmesi (pnpm install)
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

# UTF-8 cikti: Turkce karakterler her sistem dilinde dogru gorunsun.
# Bu betik UTF-8 (BOM'lu) kaydedilmistir; setup.bat ayrica `chcp 65001` yapar.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { [Console]::InputEncoding  = [System.Text.Encoding]::UTF8 } catch {}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot

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

function Resolve-Exe {
  param([string]$Name)
  Get-Command $Name -All -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -match '\.(cmd|exe|bat)$' } |
    Select-Object -First 1 -ExpandProperty Source
}

function Invoke-Safe {
  param(
    [string]$FilePath,
    [string[]]$ArgList
  )
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $FilePath @ArgList 2>&1 | ForEach-Object {
    if ($_ -is [System.Management.Automation.ErrorRecord]) {
      Write-Host $_.Exception.Message
    } else {
      Write-Host $_
    }
  }
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevEAP
  return $exitCode
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
$nodeExe = Resolve-Exe 'node'
if ($nodeExe) {
  $nodeVersionRaw = & $nodeExe --version 2>$null
  $nodeVersion = ($nodeVersionRaw -replace '^v', '').Split("`n")[0].Trim()
  $major = 0
  if ($nodeVersion -match '^(\d+)') { $major = [int]$Matches[1] }
  if ($major -ge 20) {
    Write-Ok "Node.js $nodeVersion bulundu"
    $nodeOk = $true
  } else {
    Write-Warn "Node.js $nodeVersion çok eski (Next.js 16 için 20.9+ gerekli)."
  }
}

if (-not $nodeOk) {
  if (Test-Command 'winget') {
    # Kullanıcı kapsamı: yönetici (admin) hakkı gerektirmez.
    Write-Note "Node.js LTS, winget ile kuruluyor (kullanıcı kapsamı)..."
    $wingetExit = Invoke-Safe 'winget' @('install', '--id', 'OpenJS.NodeJS.LTS', '-e', '--source', 'winget', '--scope', 'user', '--accept-source-agreements', '--accept-package-agreements')
    if ($wingetExit -ne 0) {
      Fail "Node.js otomatik kurulamadı. Lütfen https://nodejs.org adresinden LTS sürümünü kurup setup.bat dosyasını tekrar çalıştırın."
    }
    # winget mevcut oturumun PATH'ini güncellemez — elle yenile, yeniden kapatıp açmaya gerek kalmasın.
    $machinePath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
    $userPath    = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
    $env:PATH    = ($machinePath, $userPath, $env:PATH | Where-Object { $_ }) -join ';'
    $nodeExe = Resolve-Exe 'node'
    if ($nodeExe) {
      $nodeVersionRaw = & $nodeExe --version 2>$null
      $nodeVersion = ($nodeVersionRaw -replace '^v', '').Split("`n")[0].Trim()
      $major = 0
      if ($nodeVersion -match '^(\d+)') { $major = [int]$Matches[1] }
      if ($major -ge 20) {
        Write-Ok "Node.js $nodeVersion kuruldu ve etkin"
        $nodeOk = $true
      }
    }
    if (-not $nodeOk) {
      Write-Warn "Node.js kuruldu ancak bu oturumda görünmüyor. Bu pencereyi KAPATIP setup.bat dosyasını TEKRAR çalıştırın."
      exit 0
    }
  } else {
    Fail "Node.js bulunamadı ve winget yok. Lütfen https://nodejs.org adresinden Node.js 20+ LTS kurup setup.bat dosyasını tekrar çalıştırın."
  }
}

# ------------------------------------------------------------------
# 2. pnpm (corepack)
# ------------------------------------------------------------------
Write-Step "pnpm hazırlanıyor"
# pnpm'i nasıl çağıracağımızı belirle. $PnpmPrefix corepack fallback için (@('pnpm')).
$PnpmExe = $null
$PnpmPrefix = @()
$corepackExe = Resolve-Exe 'corepack'
if ($corepackExe) {
  # Sürümü corepack önbelleğine al — kullanıcı dizinine yazar, yönetici gerektirmez.
  Invoke-Safe $corepackExe @('prepare', 'pnpm@11.6.0', '--activate') | Out-Null
  # 'enable' global shim yazmaya çalışır; dizin yazılamazsa (yetki) HATA DEĞİL —
  # bu durumda pnpm'i 'corepack pnpm' olarak çağırırız.
  Invoke-Safe $corepackExe @('enable') | Out-Null
  # enable mevcut oturumun PATH'ini güncellemez — elle yenile
  $machinePath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
  $userPath    = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
  $env:PATH    = ($machinePath, $userPath, $env:PATH | Where-Object { $_ }) -join ';'
}

$pnpmOnPath = Resolve-Exe 'pnpm'
if ($pnpmOnPath) {
  $PnpmExe = $pnpmOnPath
} elseif ($corepackExe) {
  # Global shim yazılamadı (muhtemelen yetki) — corepack üzerinden çalıştır, yetki gerekmez.
  $PnpmExe = $corepackExe
  $PnpmPrefix = @('pnpm')
  Write-Note "pnpm, corepack üzerinden çalıştırılacak (global shim yazılamadı — yetki gerekmiyor)."
} else {
  Write-Note "corepack yok, pnpm npm ile kuruluyor..."
  $npmExe = Resolve-Exe 'npm'
  if (-not $npmExe) { Fail "npm bulunamadı, pnpm kurulamadı." }
  if ((Invoke-Safe $npmExe @('install', '-g', 'pnpm')) -ne 0) { Fail "pnpm kurulamadı." }
  $npmPrefix = & $npmExe prefix -g 2>$null
  if ($npmPrefix) { $env:PATH = "$env:PATH;$npmPrefix" }
  $PnpmExe = Resolve-Exe 'pnpm'
  if (-not $PnpmExe) { Fail "pnpm kurulamadı (PATH'te bulunamadı). Terminali kapatıp tekrar deneyin." }
}

function Invoke-Pnpm { param([string[]]$ArgList) return (Invoke-Safe $PnpmExe ($PnpmPrefix + $ArgList)) }
Write-Ok "pnpm hazır"

# ------------------------------------------------------------------
# 3. Kurulum seçenekleri + .env.local
# ------------------------------------------------------------------
Write-Step "Kurulum seçenekleri"

Write-Host ""
Write-Host "    Belge şablonu (.docx) -> PDF üretimi opsiyonel bir özelliktir." -ForegroundColor White
Write-Host "    Python 3.8+ ve LibreOffice gerektirir." -ForegroundColor DarkGray
$wantPdf = Read-YesNo "Şablonlar PDF üretimi kurulsun mu?" $false

$envPath   = Join-Path $RepoRoot '.env.local'
$envExists = Test-Path $envPath

if ($envExists) {
  Write-Ok ".env.local zaten var - dokunulmadı"
  Write-Note "Telegram bildirimlerini eklemek için .env.local içindeki TELEGRAM_* alanlarını düzenleyin."
} else {
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

  $telegramToken  = ''
  $telegramChatId = ''
  Write-Host ""
  Write-Host "    Telegram bildirimleri (günlük duruşma/süre uyarıları) opsiyoneldir." -ForegroundColor White
  if (Read-YesNo "Telegram bildirimleri kurulsun mu?" $false) {
    Write-Note "Bot token: Telegram'da @BotFather -> /newbot ile alınır."
    Write-Note "Chat ID: Telegram'da @userinfobot'a mesaj atınca görünür."
    while ([string]::IsNullOrWhiteSpace($telegramToken)) {
      $telegramToken = (Read-Host "    TELEGRAM_BOT_TOKEN").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramToken)) {
        Write-Warn "Token boş olamaz (vazgeçmek için Ctrl+C)."
      } elseif ($telegramToken -notmatch '^[0-9]+:[A-Za-z0-9_-]+$') {
        Write-Warn "Token biçimi hatalı (örn. 123456789:ABC... ). Tekrar deneyin."
        $telegramToken = ''
      }
    }
    while ([string]::IsNullOrWhiteSpace($telegramChatId)) {
      $telegramChatId = (Read-Host "    TELEGRAM_CHAT_ID").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramChatId)) {
        Write-Warn "Chat ID boş olamaz (vazgeçmek için Ctrl+C)."
      } elseif ($telegramChatId -notmatch '^-?[0-9]+$') {
        Write-Warn "Chat ID sadece rakam olmalı (gruplar için - ile başlar). Tekrar deneyin."
        $telegramChatId = ''
      }
    }
    Write-Ok "Telegram bilgileri kaydedilecek"
  } else {
    Write-Note "Telegram atlandı - bildirimler devre dışı (sonradan .env.local'dan eklenebilir)."
  }

  $envContent = @"
SESSION_PASSWORD="$sessionPassword"
SESSION_COOKIE_NAME=sigorta-session
APP_PASSWORD="$appPassword"

# Pipeline yapılandırması (boş bırakılırsa otomatik algılanır)
PYTHON_PATH=
LIBREOFFICE_PATH=

# Telegram bildirimleri (opsiyonel - boş ise bildirimler atlanır)
TELEGRAM_BOT_TOKEN="$telegramToken"
TELEGRAM_CHAT_ID="$telegramChatId"
"@
  [System.IO.File]::WriteAllText($envPath, $envContent, (New-Object System.Text.UTF8Encoding($false)))
  Remove-Variable appPassword -ErrorAction SilentlyContinue
  Remove-Variable sessionPassword -ErrorAction SilentlyContinue
  Remove-Variable telegramToken -ErrorAction SilentlyContinue
  Remove-Variable telegramChatId -ErrorAction SilentlyContinue
  Write-Ok ".env.local oluşturuldu (SESSION_PASSWORD otomatik üretildi)"
}

# ------------------------------------------------------------------
# 4. Bağımlılıklar
# ------------------------------------------------------------------
Write-Step "Bağımlılıklar yükleniyor (pnpm install) - birkaç dakika sürebilir"
$installOk = $false
Write-Note "pnpm install --frozen-lockfile deneniyor..."
$frzExit = Invoke-Pnpm @('install', '--frozen-lockfile')
if ($frzExit -eq 0) {
  $installOk = $true
  Write-Ok "Bağımlılıklar yüklendi (frozen-lockfile)"
} else {
  Write-Warn "frozen-lockfile başarısız oldu, normal install deneniyor..."
  $normExit = Invoke-Pnpm @('install')
  if ($normExit -eq 0) {
    $installOk = $true
    Write-Ok "Bağımlılıklar yüklendi"
  }
}
if (-not $installOk) {
  Fail "Bağımlılıklar yüklenemedi. Node.js 20+ LTS kurulu olduğundan emin olun."
}

# ------------------------------------------------------------------
# 5. Derleme
# ------------------------------------------------------------------
Write-Step "Uygulama derleniyor (pnpm build) - birkaç dakika sürebilir"
$buildExit = Invoke-Pnpm @('build')
if ($buildExit -ne 0) { Fail "Derleme başarısız oldu (kod $buildExit)." }
Write-Ok "Derleme tamamlandı"

# ------------------------------------------------------------------
# 6. Veritabanı
# ------------------------------------------------------------------
Write-Step "Veritabanı hazırlanıyor (db:migrate)"
$dataDir = Join-Path $RepoRoot 'data'
if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  Write-Note "data/ dizini oluşturuldu"
}

$prevEAP3 = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$migrateRaw = & $PnpmExe @($PnpmPrefix + 'db:migrate') 2>&1
$migrateExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP3
$migrateOutput = ($migrateRaw | ForEach-Object {
  if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message }
  else { $_ }
}) -join "`n"
Write-Host $migrateOutput
if ($migrateExit -ne 0) {
  Write-Host ""
  Write-Host "=== VERİTABANI GEÇİŞ HATASI ===" -ForegroundColor Red
  Write-Host $migrateOutput -ForegroundColor Red
  Write-Host ""
  Write-Host "Not: derleme (adım 5) başarılı oldu; better-sqlite3 native modül ve" -ForegroundColor Yellow
  Write-Host "C++ derleyici bu noktada SORUN DEĞİLDİR." -ForegroundColor Yellow
  Write-Host "Olası nedenler ve çözümler:" -ForegroundColor Yellow
  Write-Host "  1. drizzle/ içindeki bir migration SQL hatası (en olası neden)" -ForegroundColor Yellow
  Write-Host "     -> Ayrıntılı hata için: pnpm exec drizzle-kit migrate" -ForegroundColor Yellow
  Write-Host "  2. data/ dizini yazılabilir değil" -ForegroundColor Yellow
  Write-Host "  3. data\db.sqlite başka bir süreç tarafından kilitli (uygulamayı kapatın)" -ForegroundColor Yellow
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
  Write-Note "Şablonlar PDF üretimi atlandı (seçilmedi)."
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
