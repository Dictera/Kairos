#requires -Version 5.1
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı
# Türkçe çıktı için PowerShell üzerinden çalışır (.bat sadece ASCII shim).

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

# Betik installer\ içinde; repo kökü bir üst dizin
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# .env.local yoksa kurulum yapılmamış demektir
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

# Sunucu hazır olunca tarayıcıyı aç (gecikmeli, ayrı süreç)
Start-Job -ScriptBlock { Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000' } | Out-Null

# pnpm bul: çalıştırılabilir shim (.cmd/.exe), olmazsa corepack.
# Uzantısız 'pnpm'/'corepack' dosyaları PATHEXT'te olmadığından Windows "Bu
# dosyayı nasıl açmak istersiniz?" penceresini gösterir; sadece .cmd/.exe/.bat seçilir.
function Resolve-Exe {
  param([string]$Name)
  Get-Command $Name -All -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -match '\.(cmd|exe|bat)$' } |
    Select-Object -First 1 -ExpandProperty Source
}
$pnpm = Resolve-Exe 'pnpm'
if ($pnpm) {
  & $pnpm start
} else {
  $corepack = Resolve-Exe 'corepack'
  if ($corepack) {
    & $corepack pnpm start
  } else {
    Write-Host "  pnpm bulunamadı. Önce setup.bat dosyasını çalıştırın." -ForegroundColor Yellow
    Read-Host "  Kapatmak için Enter'a basın" | Out-Null
    exit 1
  }
}

Write-Host ""
Write-Host "  Sunucu durdu. Bu pencereyi kapatabilirsiniz." -ForegroundColor DarkGray
Read-Host "  Kapatmak için Enter'a basın" | Out-Null
