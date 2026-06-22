@echo off
setlocal
cd /d "%~dp0"
set "APPDIR=%~dp0"
set "DEV_OUT=%APPDIR%dev-server.out.log"
set "DEV_ERR=%APPDIR%dev-server.err.log"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--hostname','127.0.0.1') -WorkingDirectory '%APPDIR%' -WindowStyle Hidden -RedirectStandardOutput '%DEV_OUT%' -RedirectStandardError '%DEV_ERR%' | Out-Null"
echo Dev server is starting on http://127.0.0.1:3000
