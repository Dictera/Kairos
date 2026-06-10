@echo off
chcp 65001 >nul
REM ============================================================
REM  Kairos - Sigorta Uyuşmazlık Takip - Başlatıcı
REM ============================================================
setlocal
cd /d "%~dp0"

REM .env.local yoksa kurulum yapılmamış demektir
if not exist ".env.local" (
  echo.
  echo  Kurulum bulunamadı. Önce setup.bat dosyasını çalıştırın.
  echo.
  pause
  exit /b 1
)

echo.
echo  Kairos başlatılıyor... ^(bu pencereyi açık bırakın^)
echo  Tarayıcı birkaç saniye içinde açılacaktır.
echo.

REM Sunucu hazır olunca tarayıcıyı aç (gecikmeli, ayrı süreç)
start "" /b cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"

REM pnpm bul: doğrudan veya corepack üzerinden
where pnpm >nul 2>nul
if %ERRORLEVEL%==0 (
  pnpm start
) else (
  corepack pnpm start
)

echo.
echo  Sunucu durdu. Bu pencereyi kapatabilirsiniz.
pause
