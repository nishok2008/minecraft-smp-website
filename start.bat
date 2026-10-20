@echo off
title NISHOK-SMP
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo Starting NISHOK-SMP at http://127.0.0.1:5173/
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:5173/'"
call npm run dev
goto :eof

:error
echo.
echo Something went wrong while installing dependencies.
pause
