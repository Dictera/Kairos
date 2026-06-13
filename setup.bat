@echo off
chcp 65001 >nul
REM ============================================================
REM  Kairos - Sigorta Uyusmazlik Takip
REM  Kurulum baslaticisi (cift tiklayin)
REM ------------------------------------------------------------
REM  NOT: Bu .bat dosyasi BILEREK yalnizca ASCII icerir.
REM  cmd.exe, UTF-8 batch dosyalarindaki cok-baytli karakterlerde
REM  (s/i/c gibi) dosya pozisyonunu kaybedip komutlari bolerek
REM  yanlis ayristirir (ozellikle Almanca/Fransiz vb. konsollarda).
REM  Turkce/diakritikli tum kullanici metni installer\install.ps1
REM  icindedir (UTF-8 + BOM ile her dilde dogru gorunur).
REM ============================================================

setlocal
cd /d "%~dp0"

echo.
echo  Kairos kurulumu baslatiliyor...
echo.

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
