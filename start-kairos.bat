@echo off
REM ============================================================
REM  Kairos - Sigorta Uyusmazlik Takip - Baslatici
REM ============================================================
setlocal
cd /d "%~dp0"

REM .env.local yoksa kurulum yapilmamis demektir
if not exist ".env.local" (
  echo.
  echo  Kurulum bulunamadi. Once setup.bat dosyasini calistirin.
  echo.
  pause
  exit /b 1
)

echo.
echo  Kairos baslatiliyor... ^(bu pencereyi acik birakin^)
echo  Tarayici birkac saniye icinde acilacaktir.
echo.

REM Sunucu hazir olunca tarayiciyi ac (gecikmeli, ayri surec)
start "" /b cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"

REM pnpm bul: dogrudan veya corepack uzerinden
where pnpm >nul 2>nul
if %ERRORLEVEL%==0 (
  pnpm start
) else (
  corepack pnpm start
)

echo.
echo  Sunucu durdu. Bu pencereyi kapatabilirsiniz.
pause
