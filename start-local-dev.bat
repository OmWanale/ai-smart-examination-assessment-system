@echo off
echo ========================================
echo ClassynAI Local Development Startup
echo ========================================
echo.
echo This script starts the local backend server
echo with all routes including PDF quiz generation.
echo.
echo Make sure MongoDB is running!
echo.

:: Start backend in a new window
echo Starting backend server...
start "ClassynAI Backend" cmd /k "cd /d c:\quiz-desktop-app\apps\backend && node src/server.js"

echo.
echo Backend starting on http://localhost:5000
echo.
echo You can now run the frontend separately, or use
echo the Electron app with development settings.
echo.
pause
