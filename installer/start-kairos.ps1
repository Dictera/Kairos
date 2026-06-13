#requires -Version 5.1
# Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı (Windows)
# Türkçe çıktı için PowerShell üzerinden çalışır (.bat sadece ASCII shim).
# Bu betik UTF-8 (BOM'lu) kaydedilmiştir; Türkçe karakterler her sistem dilinde doğru görünür.

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

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

Start-Job -ScriptBlock { Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000' } | Out-Null

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

$pnpm = Resolve-Exe 'pnpm'
if ($pnpm) {
  Invoke-Safe $pnpm @('start')
} else {
  $corepack = Resolve-Exe 'corepack'
  if ($corepack) {
    Invoke-Safe $corepack @('pnpm', 'start')
  } else {
    Write-Host "  pnpm bulunamadı. Önce setup.bat dosyasını çalıştırın." -ForegroundColor Yellow
    Read-Host "  Kapatmak için Enter'a basın" | Out-Null
    exit 1
  }
}

Write-Host ""
Write-Host "  Sunucu durdu. Bu pencereyi kapatabilirsiniz." -ForegroundColor DarkGray
Read-Host "  Kapatmak için Enter'a basın" | Out-Null
