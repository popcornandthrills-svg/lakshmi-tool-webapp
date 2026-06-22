@echo off
setlocal
cd /d "%~dp0"
set "APPDIR=%~dp0"
set "APP_PORT=3000"
set "APP_LOG=%APPDIR%cloudflare-app.log"
set "APP_ERR=%APPDIR%cloudflare-app.err.log"
set "TUNNEL_LOG=%APPDIR%cloudflare-tunnel.log"
set "TUNNEL_ERR=%APPDIR%cloudflare-tunnel.err.log"
set "CLOUDFLARED_EXE=%APPDIR%cloudflared.exe"

echo Stopping stale Next.js and Cloudflare tunnel processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-Process node,cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo Building the app first...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Location '%APPDIR%'; if (Test-Path '.next') { Remove-Item -LiteralPath '.next' -Recurse -Force }"
call npm.cmd run build
if errorlevel 1 (
  echo Build failed. Check the output above.
  pause
  exit /b 1
)

echo Starting production Next.js on http://127.0.0.1:%APP_PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','start','--','--hostname','127.0.0.1','--port','%APP_PORT%') -WorkingDirectory '%APPDIR%' -WindowStyle Hidden -RedirectStandardOutput '%APP_LOG%' -RedirectStandardError '%APP_ERR%' | Out-Null"

echo Waiting for the app to become ready...
for /L %%i in (1,1,45) do (
  curl -fsS http://127.0.0.1:%APP_PORT%/api/health >nul 2>nul
  if not errorlevel 1 goto app_ready
  powershell -NoProfile -Command "Start-Sleep -Seconds 1" >nul 2>nul
)

echo The local server did not respond at http://127.0.0.1:%APP_PORT%.
echo Check %APP_LOG% and %APP_ERR%.
pause
exit /b 1

:app_ready
echo Local app is ready.

if not exist "%CLOUDFLARED_EXE%" (
  where cloudflared >nul 2>nul
  if errorlevel 1 (
    echo cloudflared was not found.
    echo The app is still running locally at http://127.0.0.1:%APP_PORT%
    pause
    exit /b 1
  )
  set "CLOUDFLARED_EXE=cloudflared"
)

echo Starting Cloudflare Tunnel...
echo.
echo If the tunnel starts correctly, Cloudflare will print a public trycloudflare.com URL.
echo Keep this window open while you collect feedback.
echo.
"%CLOUDFLARED_EXE%" tunnel --url http://127.0.0.1:%APP_PORT% --protocol http2 --logfile "%TUNNEL_LOG%"
