@echo off
chcp 65001 >nul
REM ============================================================
REM  Kairos - Sigorta Uyusmazlik Takip - Kurulum (ASCII shim)
REM  Turkce ciktinin tamami installer\install.ps1 icindedir.
REM ============================================================
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\install.ps1"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
  echo  Kurulum tamamlandi. Bu pencereyi kapatabilirsiniz.
) else (
  echo  Kurulum hata ile sonlandi ^(kod %EXITCODE%^). Yukaridaki mesaja bakin.
)
echo.
pause
exit /b %EXITCODE%
