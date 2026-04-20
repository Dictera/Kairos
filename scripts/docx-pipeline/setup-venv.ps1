# scripts/docx-pipeline/setup-venv.ps1
# Setup Python virtual environment for docx-pipeline sidecar

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (Test-Path ".venv") {
    Write-Host "venv already exists at .venv" -ForegroundColor Yellow
    exit 0
}

python -m venv .venv
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "venv setup complete." -ForegroundColor Green