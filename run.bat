@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo Starting backend and frontend...
echo Press Ctrl+C to stop both.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$backendDir='%BACKEND_DIR%';" ^
  "$frontendDir='%FRONTEND_DIR%';" ^
  "$backendCmd = if (Test-Path (Join-Path $backendDir '.venv\Scripts\activate.bat')) { 'cd /d \"' + $backendDir + '\" && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000' } elseif (Test-Path (Join-Path $backendDir 'venv\Scripts\activate.bat')) { 'cd /d \"' + $backendDir + '\" && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000' } else { 'cd /d \"' + $backendDir + '\" && uvicorn main:app --reload --port 8000' };" ^
  "$frontendCmd = 'cd /d \"' + $frontendDir + '\" && npm run dev';" ^
  "$backend = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $backendCmd -PassThru;" ^
  "$frontend = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $frontendCmd -PassThru;" ^
  "Write-Host ('Backend PID: ' + $backend.Id);" ^
  "Write-Host ('Frontend PID: ' + $frontend.Id);" ^
  "try { Wait-Process -Id $backend.Id, $frontend.Id } finally {" ^
  "  foreach ($p in @($backend, $frontend)) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }" ^
  "}"

endlocal
