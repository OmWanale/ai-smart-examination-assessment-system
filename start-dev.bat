@echo off
REM Start Electron + React dev with flickering fixes
REM This script handles port management and proper environment setup

cd /d "%~dp0apps\frontend"
set PORT=3000
set BROWSER=none
set FAST_REFRESH=false

echo Starting React dev server on port 3000...
start /B cmd /c "npm start"

echo Waiting for React to start...
timeout /t 8 /nobreak

echo Starting Electron...
cd /d "%~dp0apps\desktop"
npm run electron:dev

pause
