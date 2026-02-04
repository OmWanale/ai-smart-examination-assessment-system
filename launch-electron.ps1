Set-Location "C:\quiz-desktop-app\apps\desktop"
Write-Host "🚀 Launching Electron app..." -ForegroundColor Green
Write-Host "Frontend build path: $(Get-Location)\..\..\frontend\build" -ForegroundColor Gray
npx electron . 2>&1
