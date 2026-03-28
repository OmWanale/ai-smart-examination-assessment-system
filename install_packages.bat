@echo off
echo ========================================
echo Installing PDF Quiz Generation Dependencies
echo ========================================
echo.
cd /d c:\quiz-desktop-app\apps\backend
echo Current directory: %CD%
echo.
echo Installing pdf-parse and mammoth...
call npm install pdf-parse mammoth --save
echo.
echo ========================================
echo Installation complete!
echo.
echo IMPORTANT: Restart your backend server
echo for changes to take effect.
echo ========================================
echo.
pause
