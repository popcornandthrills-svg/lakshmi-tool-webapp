@echo off
setlocal
cd /d "%~dp0"
set "APPDIR=%~dp0"
set "APP_LOG=%APPDIR%ngrok-app.log"
set "NGROK_URL_LOG=%APPDIR%ngrok-url.log"
set "STATUS_LOG=%APPDIR%ngrok-status.log"
set "NGROK_EXE=%APPDIR%_ngrok\ngrok.exe"
set "APP_PORT=3000"

> "%STATUS_LOG%" echo [%date% %time%] Starting launcher
echo Stopping stale webapp processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-Process node,ngrok -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Stopped {1} pid={2}' -f (Get-Date), $_.ProcessName, $_.Id) }"

echo Building the app first...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Build started' -f (Get-Date))"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Location '%APPDIR%'; if (Test-Path '.next') { Remove-Item -LiteralPath '.next' -Recurse -Force }"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Location '%APPDIR%'; npm.cmd run build" > "%APPDIR%ngrok-build.log" 2> "%APPDIR%ngrok-build.err.log"
if errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Build failed' -f (Get-Date))"
  echo Build failed. Check %APPDIR%ngrok-build.err.log for details.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Build completed' -f (Get-Date))"

echo Starting production server on http://127.0.0.1:%APP_PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Starting production server' -f (Get-Date))"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','start','--','--hostname','127.0.0.1','--port','%APP_PORT%') -WorkingDirectory '%APPDIR%' -WindowStyle Hidden -RedirectStandardOutput '%APPDIR%ngrok-app.log' -RedirectStandardError '%APPDIR%ngrok-app.err.log' | Out-Null"

echo Waiting for the app to become ready...
for /L %%i in (1,1,30) do (
  curl -fsS http://127.0.0.1:%APP_PORT%/api/health >nul 2>nul
  if not errorlevel 1 goto app_ready
  powershell -NoProfile -Command "Start-Sleep -Seconds 1" >nul 2>nul
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] App health check failed' -f (Get-Date))"
echo The local server did not respond at http://127.0.0.1:%APP_PORT%.
echo Check %APP_LOG% for the startup error.
pause
exit /b 1

:app_ready
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] App health check passed' -f (Get-Date))"

echo Local app is ready at http://127.0.0.1:%APP_PORT%

if not exist "%NGROK_EXE%" (
  echo ngrok.exe was not found at %NGROK_EXE%.
  echo Place ngrok.exe in the _ngrok folder and run this file again.
  pause
  exit /b 1
)

echo Starting ngrok tunnel...
echo.
echo The latest forwarding URL will be written to %NGROK_URL_LOG%.
echo Keep this window open while you collect feedback.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Content -LiteralPath '%STATUS_LOG%' -Value ('[{0}] Starting ngrok tunnel' -f (Get-Date))"
powershell -NoProfile -ExecutionPolicy Bypass -File "%APPDIR%scripts\launch-ngrok.ps1" ^
  -NgrokExe "%NGROK_EXE%" ^
  -TargetUrl "http://127.0.0.1:%APP_PORT%" ^
  -UrlLog "%NGROK_URL_LOG%" ^
  -OutLog "%APPDIR%ngrok.out.log" ^
  -ErrLog "%APPDIR%ngrok.err.log" ^
  -StatusLog "%STATUS_LOG%"

echo.
echo Recent launcher status:
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-Content -LiteralPath '%STATUS_LOG%' -Tail 12"
echo.
echo Final ngrok URL:
type "%NGROK_URL_LOG%"
echo.
pause
