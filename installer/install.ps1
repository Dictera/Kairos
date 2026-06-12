#requires -Version 5.1
<#
  Kairos - Sigorta Uyuşmazlık Takip
  Son kullanici kurulum betigi (Windows).

  Yaptiklari:
    1. Node.js 18+ kontrolu (yoksa winget ile kurar)
    2. pnpm etkinlestirme (corepack)
    3. Kurulum secenekleri + .env.local olusturma
       (rastgele SESSION_PASSWORD, APP_PASSWORD, opsiyonel Telegram)
    4. Bagimliliklarin yuklenmesi (pnpm install)
    4b. better-sqlite3 native modulunu yeniden derle
    5. Uygulama derlemesi (pnpm build)
    6. Veritabani semasi (pnpm db:migrate) + hata tanisi
    7. Opsiyonel Python pipeline kurulumu (.docx -> PDF)
    8. Masaustu + Baslat menuyu kisayolu

  Guvenlik:
    - SESSION_PASSWORD kriptografik RNG ile uretilir.
    - Mevcut .env.local ASLA uzerine yazilmaz.
    - APP_PASSWORD ekrana yazilmaz / okunmaz.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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
    if ($ans -in @('h', 'hayir', 'hayir', 'n', 'no')) { return $false }
    Write-Warn "Lutfen E (evet) veya H (hayir) girin."
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
  if ($major -ge 18) {
    Write-Ok "Node.js $nodeVersion bulundu"
    $nodeOk = $true
  } else {
    Write-Warn "Node.js $nodeVersion cok eski (18+ gerekli)."
  }
}

if (-not $nodeOk) {
  if (Test-Command 'winget') {
    Write-Note "Node.js LTS, winget ile kuruluyor..."
    $wingetExit = Invoke-Safe 'winget' @('install', '--id', 'OpenJS.NodeJS.LTS', '-e', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements')
    if ($wingetExit -ne 0) {
      Fail "Node.js otomatik kurulamadi. Lutfen https://nodejs.org adresinden LTS surumunu kurup setup.bat dosyasini tekrar calistirin."
    }
    Write-Warn "Node.js kuruldu. PATH'in guncellenmesi icin bu pencereyi KAPATIP setup.bat dosyasini TEKRAR calistirin."
    exit 0
  } else {
    Fail "Node.js bulunamadi ve winget yok. Lutfen https://nodejs.org adresinden Node.js 18+ LTS kurup setup.bat dosyasini tekrar calistirin."
  }
}

# ------------------------------------------------------------------
# 2. pnpm (corepack)
# ------------------------------------------------------------------
Write-Step "pnpm hazirlaniyor"
$corepackExe = Resolve-Exe 'corepack'
if ($corepackExe) {
  Invoke-Safe $corepackExe @('enable') | Out-Null
  Invoke-Safe $corepackExe @('prepare', 'pnpm@11.6.0', '--activate') | Out-Null
}
if (-not (Resolve-Exe 'pnpm') -and -not $corepackExe) {
  Write-Note "corepack yok, pnpm npm ile kuruluyor..."
  $npmExe = Resolve-Exe 'npm'
  if (-not $npmExe) { Fail "npm bulunamadi, pnpm kurulamadi." }
  $npmExit = Invoke-Safe $npmExe @('install', '-g', 'pnpm')
  if ($npmExit -ne 0) { Fail "pnpm kurulamadi." }
}
Write-Ok "pnpm hazir"

# ------------------------------------------------------------------
# 3. Kurulum secenekleri + .env.local
# ------------------------------------------------------------------
Write-Step "Kurulum secenekleri"

Write-Host ""
Write-Host "    Belge sablonu (.docx) -> PDF uretimi opsiyonel bir ozelliktir." -ForegroundColor White
Write-Host "    Python 3.8+ ve LibreOffice gerektirir." -ForegroundColor DarkGray
$wantPdf = Read-YesNo "Sablonlar PDF uretimi kurulsun mu?" $false

$envPath   = Join-Path $RepoRoot '.env.local'
$envExists = Test-Path $envPath

if ($envExists) {
  Write-Ok ".env.local zaten var - dokunulmadi"
  Write-Note "Telegram bildirimlerini eklemek icin .env.local icindeki TELEGRAM_* alanlarini duzenleyin."
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
  Write-Host "    Uygulamaya giris icin bir sifre belirleyin." -ForegroundColor White
  $appPassword = ''
  while ([string]::IsNullOrWhiteSpace($appPassword)) {
    $secure = Read-Host "    Giris sifresi (APP_PASSWORD)" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ([string]::IsNullOrWhiteSpace($appPassword)) { Write-Warn "Sifre bos olamaz." }
  }

  $telegramToken  = ''
  $telegramChatId = ''
  Write-Host ""
  Write-Host "    Telegram bildirimleri (gunluk durusma/sure uyarlari) opsiyoneldir." -ForegroundColor White
  if (Read-YesNo "Telegram bildirimleri kurulsun mu?" $false) {
    Write-Note "Bot token: Telegram'da @BotFather -> /newbot ile alinir."
    Write-Note "Chat ID: Telegram'da @userinfobot'a mesaj atinca gorunur."
    while ([string]::IsNullOrWhiteSpace($telegramToken)) {
      $telegramToken = (Read-Host "    TELEGRAM_BOT_TOKEN").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramToken)) { Write-Warn "Token bos olamaz (vazgecmek icin Ctrl+C)." }
    }
    while ([string]::IsNullOrWhiteSpace($telegramChatId)) {
      $telegramChatId = (Read-Host "    TELEGRAM_CHAT_ID").Trim()
      if ([string]::IsNullOrWhiteSpace($telegramChatId)) { Write-Warn "Chat ID bos olamaz (vazgecmek icin Ctrl+C)." }
    }
    Write-Ok "Telegram bilgileri kaydedilecek"
  } else {
    Write-Note "Telegram atlandi - bildirimler devre disi (sonradan .env.local'dan eklenebilir)."
  }

  $envContent = @"
SESSION_PASSWORD="$sessionPassword"
SESSION_COOKIE_NAME=sigorta-session
APP_PASSWORD="$appPassword"

# Pipeline yapilandirmasi (bos birtililrsa otomatik algilanir)
PYTHON_PATH=
LIBREOFFICE_PATH=

# Telegram bildirimleri (opsiyonel - bos ise bildirimler atlanir)
TELEGRAM_BOT_TOKEN="$telegramToken"
TELEGRAM_CHAT_ID="$telegramChatId"
"@
  [System.IO.File]::WriteAllText($envPath, $envContent, (New-Object System.Text.UTF8Encoding($false)))
  Remove-Variable appPassword -ErrorAction SilentlyContinue
  Remove-Variable sessionPassword -ErrorAction SilentlyContinue
  Remove-Variable telegramToken -ErrorAction SilentlyContinue
  Remove-Variable telegramChatId -ErrorAction SilentlyContinue
  Write-Ok ".env.local olusturuldu (SESSION_PASSWORD otomatik uretildi)"
}

# ------------------------------------------------------------------
# 4. Bagimliliklar
# ------------------------------------------------------------------
Write-Step "Bagimliliklar yukleniyor (pnpm install) - birkac dakika surebilir"
$pnpmExe = Resolve-Exe 'pnpm'
if (-not $pnpmExe) {
  $corepackTmp = Resolve-Exe 'corepack'
  if ($corepackTmp) { $pnpmExe = $corepackTmp }
}
if (-not $pnpmExe) { Fail "pnpm bulunamadi." }

$installOk = $false
Write-Note "pnpm install --frozen-lockfile deneniyor..."
$frzExit = Invoke-Safe $pnpmExe @('install', '--frozen-lockfile')
if ($frzExit -eq 0) {
  $installOk = $true
  Write-Ok "Bagimliliklar yuklendi (frozen-lockfile)"
} else {
  Write-Warn "frozen-lockfile basarisiz oldu, normal install deneniyor..."
  $normExit = Invoke-Safe $pnpmExe @('install')
  if ($normExit -eq 0) {
    $installOk = $true
    Write-Ok "Bagimliliklar yuklendi"
  }
}
if (-not $installOk) {
  Fail "Bagimliliklar yuklenemedi. Node.js 18+ LTS kurulu oldugundan emin olun."
}

# ------------------------------------------------------------------
# 4b. Visual Studio Build Tools (C++ workload) kontrolu
# ------------------------------------------------------------------
Write-Step "Visual Studio Build Tools kontrol ediliyor"
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$hasVCTools = $false
if (Test-Path $vsWhere) {
  $vsInstallPath = & $vsWhere -latest -property installationPath 2>$null
  if ($vsInstallPath) {
    $vcToolsDir = Join-Path $vsInstallPath 'VC\Tools\MSVC'
    $hasVCTools = Test-Path $vcToolsDir
  }
}
if (-not $hasVCTools) {
  Write-Warn "Visual Studio C++ Build Tools bulunamadi."
  if (Test-Command 'winget') {
    Write-Note "VS Build Tools + C++ workload, winget ile kuruluyor..."
    Write-Note "Bu islem birkaç dakika surebilir (buyuk indirme)."
    $vsExit = Invoke-Safe 'winget' @('install', '--id', 'Microsoft.VisualStudio.2022.BuildTools', '-e', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements', '--override', '--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended')
    if ($vsExit -eq 0) {
      Write-Ok "Visual Studio Build Tools + C++ workload kuruldu"
      Write-Warn "PATH'in guncellenmesi icin bu pencereyi KAPATIP setup.bat'i TEKRAR calistirin."
      exit 0
    } else {
      Write-Warn "VS Build Tools otomatik kurulamadi. better-sqlite3 derlemesi denenecek..."
    }
  } else {
    Write-Warn "winget yok, VS Build Tools otomatik kurulamiyor."
  }
} else {
  Write-Ok "Visual Studio C++ Build Tools mevcut"
}

# ------------------------------------------------------------------
# 4c. better-sqlite3 native modulunu dogrula
# ------------------------------------------------------------------
Write-Step "Veritabani modulu dogrulanioor (better-sqlite3)"
try {
  $nodeExe = Resolve-Exe 'node'
  if ($nodeExe) {
    Push-Location $RepoRoot
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $bs3Test = & $nodeExe -e "try{require('better-sqlite3');console.log('OK')}catch(e){console.error('FAIL:'+e.message)}" 2>&1
    $ErrorActionPreference = $prevEAP
    Pop-Location
    $bs3Str = ($bs3Test | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message }
      else { $_ }
    }) -join ''
    if ($bs3Str -match 'FAIL') {
      Write-Warn "better-sqlite3 yuklenemedi, yeniden derleme deneniyor..."
      if ($pnpmExe) {
        Invoke-Safe $pnpmExe @('rebuild', 'better-sqlite3') | Out-Null
      }
      Push-Location $RepoRoot
      $prevEAP2 = $ErrorActionPreference
      $ErrorActionPreference = 'Continue'
      $bs3Test2 = & $nodeExe -e "try{require('better-sqlite3');console.log('OK')}catch(e){console.error('FAIL:'+e.message)}" 2>&1
      $ErrorActionPreference = $prevEAP2
      Pop-Location
      $bs3Str2 = ($bs3Test2 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message }
        else { $_ }
      }) -join ''
      if ($bs3Str2 -match 'FAIL') {
        Write-Host ""
        Write-Host "[HATA] better-sqlite3 yerel modulu derlenemiyor." -ForegroundColor Red
        Write-Host "   Cozum: Visual Studio Build Tools kurun (C++ workload):" -ForegroundColor Yellow
        Write-Host "   winget install Microsoft.VisualStudio.2022.BuildTools --override `"--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended`"" -ForegroundColor Yellow
        Write-Host "   Veya manuel: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
        Write-Host "   Ardindan setup.bat'i tekrar calistirin." -ForegroundColor Yellow
        Write-Host ""
        Fail "better-sqlite3 modulu yuklenemiyor. Yukaridaki cozumu uygulayin."
      }
      Write-Ok "better-sqlite3 yeniden derlendi"
    } else {
      Write-Ok "better-sqlite3 modulu hazir"
    }
  }
} catch {
  Write-Warn "better-sqlite3 dogrulamasi atlandi (devam ediliyor)"
}

# ------------------------------------------------------------------
# 5. Derleme
# ------------------------------------------------------------------
Write-Step "Uygulama derleniyor (pnpm build) - birkac dakika surebilir"
$buildExit = Invoke-Safe $pnpmExe @('build')
if ($buildExit -ne 0) { Fail "Derleme basarisiz oldu (kod $buildExit)." }
Write-Ok "Derleme tamamlandi"

# ------------------------------------------------------------------
# 6. Veritabani
# ------------------------------------------------------------------
Write-Step "Veritabani hazirlaniyor (db:migrate)"
$dataDir = Join-Path $RepoRoot 'data'
if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  Write-Note "data/ dizini olusturuldu"
}

$prevEAP3 = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$migrateRaw = & $pnpmExe db:migrate 2>&1
$migrateExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP3
$migrateOutput = ($migrateRaw | ForEach-Object {
  if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message }
  else { $_ }
}) -join "`n"
Write-Host $migrateOutput
if ($migrateExit -ne 0) {
  Write-Host ""
  Write-Host "=== VERITABANI GECIS HATASI ===" -ForegroundColor Red
  Write-Host $migrateOutput -ForegroundColor Red
  Write-Host ""
  Write-Host "Olasin nedenler ve cozumler:" -ForegroundColor Yellow
  Write-Host "  1. better-sqlite3 native modulu derlenmemis" -ForegroundColor Yellow
  Write-Host "     -> Visual Studio Build Tools (C++ workload) kurun:" -ForegroundColor Yellow
  Write-Host "        https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
  Write-Host "  2. Node.js surum uyumsuzlugu (18+ LTS gerekli)" -ForegroundColor Yellow
  Write-Host "  3. data/ dizini yazilabilir degil" -ForegroundColor Yellow
  Write-Host ""
  Fail "Veritabani gecisi basarisiz oldu. Yukaridaki hata mesajini inceleyin."
}
Write-Ok "Veritabani hazir (data\db.sqlite)"

# ------------------------------------------------------------------
# 7. Opsiyonel Python pipeline (.docx -> PDF)
# ------------------------------------------------------------------
Write-Step "Belge sablonu (PDF) pipeline'i"
if ($wantPdf) {
  $venvScript = Join-Path $RepoRoot 'scripts\docx-pipeline\setup-venv.ps1'
  if ((Test-Command 'python') -and (Test-Path $venvScript)) {
    try {
      & powershell -NoProfile -ExecutionPolicy Bypass -File $venvScript
      if ($LASTEXITCODE -eq 0) { Write-Ok "Python pipeline kuruldu" }
      else { Write-Warn "Python pipeline kurulamadi - sablon PDF ozelligi devre disi (uygulama yine de calisir)." }
    } catch {
      Write-Warn "Python pipeline kurulumu atlandi - sablon PDF ozelligi devre disi (uygulama yine de calisir)."
    }
    if (-not (Test-Command 'soffice')) {
      Write-Note "LibreOffice (soffice) PATH'te bulunamadi - PDF donusumu icin kurulu olmali: https://www.libreoffice.org"
    }
  } else {
    Write-Warn "Python bulunamadi - sablon PDF ozelligi kurulamadi."
    Write-Note "Python 3.8+ ve LibreOffice kurup setup.bat'i tekrar calistirin."
  }
} else {
  Write-Note "Sablonlar PDF uretimi atlandi (secilmedi)."
}

# ------------------------------------------------------------------
# 8. Kisayollar
# ------------------------------------------------------------------
Write-Step "Kisayollar olusturuluyor"
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
      $sc.Description       = 'Kairos - Sigorta Uyusmazlik Takip'
      $sc.IconLocation      = $iconLoc
      $sc.Save()
    } catch {
      Write-Warn "Kisayol olusturulamadi: $dir"
    }
  }
  Write-Ok "Masaustu ve Baslat menuyu kisayollari olusturuldu"
} else {
  Write-Warn "start-kairos.bat bulunamadi - kisayol atlandi."
}

# ------------------------------------------------------------------
# Bitti
# ------------------------------------------------------------------
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Kurulum tamamlandi!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Uygulamayi baslatmak icin masaustundeki 'Kairos'" -ForegroundColor White
Write-Host "  kisayoluna cift tiklayin (veya start-kairos.bat)." -ForegroundColor White
Write-Host "  Tarayicida http://localhost:3000 acilacaktir." -ForegroundColor White
Write-Host ""
exit 0