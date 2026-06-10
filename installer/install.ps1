#requires -Version 5.1
<#
  Kairos - Sigorta Uyusmazlik Takip
  Son kullanici kurulum betigi.

  Yaptiklari:
    1. Node.js 18+ kontrolu (yoksa winget ile kurar)
    2. pnpm etkinlestirme (corepack)
    3. Bagimliliklarin yuklenmesi (pnpm install)
    4. .env.local olusturma (rastgele SESSION_PASSWORD + APP_PASSWORD sorar)
    5. Uygulama derlemesi (pnpm build)
    6. Veritabani semasi (pnpm db:migrate)
    7. Opsiyonel Python pipeline kurulumu (.docx -> PDF)
    8. Masaustu + Baslat menusu kisayolu

  Guvenlik:
    - SESSION_PASSWORD kriptografik RNG ile uretilir.
    - Mevcut .env.local ASLA uzerine yazilmaz.
    - Hicbir sir ekrana yazilmaz / okunmaz.
#>

$ErrorActionPreference = 'Stop'

# --- Repo koku: bu betik installer\ icinde, kok bir ust dizin ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot

# ------------------------------------------------------------------
# Yardimci fonksiyonlar
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

# pnpm'i guvenilir cagirmak icin: once dogrudan, olmazsa corepack uzerinden
function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
  if (Test-Command 'pnpm') {
    & pnpm @PnpmArgs
  } else {
    & corepack pnpm @PnpmArgs
  }
  if ($LASTEXITCODE -ne 0) { Fail "pnpm $($PnpmArgs -join ' ') komutu basarisiz oldu (kod $LASTEXITCODE)." }
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor White
Write-Host "  Kairos - Sigorta Uyusmazlik Takip - Kurulum" -ForegroundColor White
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
    Write-Warn "Node.js $nodeVersion cok eski (18+ gerekli)."
  }
}

if (-not $nodeOk) {
  if (Test-Command 'winget') {
    Write-Note "Node.js LTS winget ile kuruluyor..."
    & winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
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
if (Test-Command 'corepack') {
  & corepack enable 2>$null | Out-Null
  & corepack prepare pnpm@11.5.0 --activate 2>$null | Out-Null
}
if (-not (Test-Command 'pnpm') -and -not (Test-Command 'corepack')) {
  Write-Note "corepack yok, pnpm npm ile kuruluyor..."
  & npm install -g pnpm
  if ($LASTEXITCODE -ne 0) { Fail "pnpm kurulamadi." }
}
Write-Ok "pnpm hazir"

# ------------------------------------------------------------------
# 3. Bagimliliklar
# ------------------------------------------------------------------
Write-Step "Bagimliliklar yukleniyor (pnpm install) - birkac dakika surebilir"
Invoke-Pnpm install --frozen-lockfile
Write-Ok "Bagimliliklar yuklendi"

# ------------------------------------------------------------------
# 4. .env.local
# ------------------------------------------------------------------
Write-Step "Ortam ayarlari (.env.local)"
$envPath = Join-Path $RepoRoot '.env.local'
if (Test-Path $envPath) {
  Write-Ok ".env.local zaten var - dokunulmadi"
} else {
  # Kriptografik olarak guvenli rastgele SESSION_PASSWORD (48 karakter)
  $bytes = New-Object 'System.Byte[]' 36
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $sessionPassword = [Convert]::ToBase64String($bytes) -replace '[+/=]', 'A'
  $sessionPassword = $sessionPassword.Substring(0, 48)

  # APP_PASSWORD kullanicidan al (giris sifresi)
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

  $envContent = @"
SESSION_PASSWORD=$sessionPassword
SESSION_COOKIE_NAME=sigorta-session
APP_PASSWORD=$appPassword

# Pipeline yapilandirmasi (bos birakilirsa otomatik algilanir)
PYTHON_PATH=
LIBREOFFICE_PATH=

# Telegram bildirimleri (opsiyonel - bos ise bildirimler atlanir)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
"@
  # UTF-8 (BOM'suz) yaz
  [System.IO.File]::WriteAllText($envPath, $envContent, (New-Object System.Text.UTF8Encoding($false)))
  Write-Ok ".env.local olusturuldu (SESSION_PASSWORD otomatik uretildi)"
}

# ------------------------------------------------------------------
# 5. Derleme
# ------------------------------------------------------------------
Write-Step "Uygulama derleniyor (pnpm build) - birkac dakika surebilir"
Invoke-Pnpm build
Write-Ok "Derleme tamamlandi"

# ------------------------------------------------------------------
# 6. Veritabani
# ------------------------------------------------------------------
Write-Step "Veritabani hazirlaniyor (db:migrate)"
Invoke-Pnpm db:migrate
Write-Ok "Veritabani hazir (data\db.sqlite)"

# ------------------------------------------------------------------
# 7. Opsiyonel Python pipeline (.docx -> PDF)
# ------------------------------------------------------------------
Write-Step "Belge sablonu (PDF) pipeline'i - opsiyonel"
$venvScript = Join-Path $RepoRoot 'scripts\docx-pipeline\setup-venv.ps1'
if ((Test-Command 'python') -and (Test-Path $venvScript)) {
  try {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $venvScript
    if ($LASTEXITCODE -eq 0) { Write-Ok "Python pipeline kuruldu" }
    else { Write-Warn "Python pipeline kurulamadi - sablon PDF ozelligi devre disi (uygulama yine calisir)." }
  } catch {
    Write-Warn "Python pipeline kurulumu atlandi - sablon PDF ozelligi devre disi (uygulama yine calisir)."
  }
} else {
  Write-Note "Python bulunamadi - sablon PDF ozelligi atlandi (uygulama yine calisir)."
  Write-Note "Bu ozellik icin Python 3.8+ ve LibreOffice kurup setup.bat'i tekrar calistirabilirsiniz."
}

# ------------------------------------------------------------------
# 8. Kisayollar
# ------------------------------------------------------------------
Write-Step "Kisayollar olusturuluyor"
$launcher = Join-Path $RepoRoot 'start-kairos.bat'
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
      $sc.IconLocation      = "$env:SystemRoot\System32\shell32.dll,13"
      $sc.Save()
    } catch {
      Write-Warn "Kisayol olusturulamadi: $dir"
    }
  }
  Write-Ok "Masaustu ve Baslat menusu kisayollari olusturuldu"
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
