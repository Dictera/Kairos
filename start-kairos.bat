@echo off
chcp 65001 >nul
REM ============================================================
REM  Kairos - Sigorta Uyusmazlik Takip - Baslatici (ASCII shim)
REM  Turkce ciktinin tamami installer\start-kairos.ps1 icindedir.
REM ============================================================
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\start-kairos.ps1"
exit /b %ERRORLEVEL%