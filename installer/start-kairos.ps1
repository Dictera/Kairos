#requires -Version 5.1
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı (Windows)
# Türkçe çıktı için PowerShell üzerinden çalışır (.bat sadece ASCII shim).
# Bu betik UTF-8 (BOM'lu) kaydedilmiştir; Türkçe karakterler her sistem dilinde doğru görünür.

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# Uygulamaya "launcher tarafından yönetiliyorum" sinyali — buton ile güncelleme/yeniden başlatma için.
$env:KAIROS_MANAGED = '1'
$UpdateFlag = Join-Path $RepoRoot 'data\.update-requested'

if (-not (Test-Path (Join-Path $RepoRoot '.env.local'))) {
  Write-Host ""
  Write-Host "  Kurulum bulunamadı. Önce setup.bat dosyasını çalıştırın." -ForegroundColor Yellow
  Write-Host ""
  Read-Host "  Kapatmak için Enter'a basın" | Out-Null
  exit 1
}

Write-Host ""
Write-Host "  Kairos başlatılıyor... (bu pencereyi açık bırakın)" -ForegroundColor Cyan
Write-Host "  Tarayıcı birkaç saniye içinde açılacaktır."
Write-Host ""

# Tarayıcıyı sunucu HTTP 200 dönünce aç (port açık != sayfa hazır), en fazla ~120sn
$browserJob = Start-Job -ScriptBlock {
  for ($i = 0; $i -lt 120; $i++) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:3000'
      if ($r.StatusCode -eq 200) { break }
    } catch { Start-Sleep -Seconds 1 }
  }
  Start-Process 'http://localhost:3000'
}

function Resolve-Exe {
  param([string]$Name)
  Get-Command $Name -All -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -match '\.(cmd|exe|bat)$' } |
    Select-Object -First 1 -ExpandProperty Source
}

function Invoke-Safe {
  param([string]$FilePath, [string[]]$ArgList)
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

# pnpm'i çöz (gerekirse corepack üzerinden)
$pnpm = Resolve-Exe 'pnpm'
$pnpmArgsPrefix = @()
if (-not $pnpm) {
  $corepack = Resolve-Exe 'corepack'
  if ($corepack) { $pnpm = $corepack; $pnpmArgsPrefix = @('pnpm') }
  else {
    Write-Host "  pnpm bulunamadı. Önce setup.bat dosyasını çalıştırın." -ForegroundColor Yellow
    Read-Host "  Kapatmak için Enter'a basın" | Out-Null
    exit 1
  }
}
function Invoke-Pnpm { param([string[]]$ArgList) return (Invoke-Safe $pnpm ($pnpmArgsPrefix + $ArgList)) }

# Bekleyen güncellemeyi uygula (git pull + install + build + migrate). Hata olursa eski sürümle devam.
function Apply-Update {
  Write-Host ""
  Write-Host "==> Güncelleme uygulanıyor..." -ForegroundColor Cyan

  # Veritabanı yedeği
  $dbPath = Join-Path $RepoRoot 'data\db.sqlite'
  if (Test-Path $dbPath) {
    $backupDir = Join-Path $RepoRoot 'data\backups'
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    try { Copy-Item $dbPath (Join-Path $backupDir "db-$stamp.sqlite") -Force; Write-Host "    [OK] Veritabanı yedeklendi" -ForegroundColor Green } catch {}
  }

  $git = Resolve-Exe 'git'
  if (-not $git) { $git = 'git' }
  # Güvenlik: yalnızca resmi depodan çek (origin değiştirilmişse güncelleme yapma).
  $remoteUrl = (& $git remote get-url origin 2>$null)
  if (-not ($remoteUrl -and $remoteUrl.ToLower().Contains('dictera/kairos'))) {
    Write-Host "    [!] Güncelleme kaynağı doğrulanamadı (origin resmi depo değil) — atlandı." -ForegroundColor Yellow
    Remove-Item $UpdateFlag -Force -ErrorAction SilentlyContinue
    return
  }
  if ((Invoke-Safe $git @('pull', '--ff-only', 'origin', 'main')) -ne 0) {
    Write-Host "    [!] git pull başarısız — güncelleme atlandı, mevcut sürümle devam." -ForegroundColor Yellow
    Remove-Item $UpdateFlag -Force -ErrorAction SilentlyContinue
    return
  }
  if ((Invoke-Pnpm @('install', '--frozen-lockfile')) -ne 0) { Invoke-Pnpm @('install') | Out-Null }
  if ((Invoke-Pnpm @('build')) -ne 0) {
    Write-Host "    [!] Derleme başarısız — güncelleme yarıda kaldı. Lütfen setup.bat ile yeniden kurun." -ForegroundColor Yellow
    Remove-Item $UpdateFlag -Force -ErrorAction SilentlyContinue
    return
  }
  Invoke-Pnpm @('db:migrate') | Out-Null
  Remove-Item $UpdateFlag -Force -ErrorAction SilentlyContinue
  Write-Host "    [OK] Güncelleme tamamlandı" -ForegroundColor Green
}

# Çalıştırma döngüsü: bayrak varsa güncelle, sunucuyu başlat; buton tekrar bayrak yazıp çıkarsa yeniden başlat.
while ($true) {
  if (Test-Path $UpdateFlag) { Apply-Update }
  Invoke-Pnpm @('start') | Out-Null
  if (Test-Path $UpdateFlag) {
    Write-Host ""
    Write-Host "  Güncelleme isteği alındı, yeniden başlatılıyor..." -ForegroundColor Cyan
    continue
  }
  break
}

if ($browserJob) { Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "  Sunucu durdu. Bu pencereyi kapatabilirsiniz." -ForegroundColor DarkGray
Read-Host "  Kapatmak için Enter'a basın" | Out-Null
