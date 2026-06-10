@echo off
chcp 65001 >nul
REM ============================================================
REM  Kairos - Sigorta Uyuşmazlık Takip
REM  Kurulum başlatıcısı (çift tıklayın)
REM ============================================================
REM  Bu dosya kurulumu PowerShell üzerinden çalıştırır.
REM  Tüm kurulum adımları installer\install.ps1 içindedir.
REM ============================================================

setlocal
cd /d "%~dp0"

echo.
echo  Kairos kurulumu başlatılıyor...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\install.ps1"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
  echo  Kurulum tamamlandı. Bu pencereyi kapatabilirsiniz.
) else (
  echo  Kurulum hata ile sonlandı ^(kod %EXITCODE%^). Yukarıdaki mesaja bakın.
)
echo.
pause
exit /b %EXITCODE%
