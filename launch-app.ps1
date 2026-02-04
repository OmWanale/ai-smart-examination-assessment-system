#!/usr/bin/env pwsh
Set-Location "C:\quiz-desktop-app\apps\desktop"
Write-Host "🚀 Launching Electron..." -ForegroundColor Green
try {
    & npx electron .
} catch {
    Write-Host "Error launching Electron: $_" -ForegroundColor Red
}
