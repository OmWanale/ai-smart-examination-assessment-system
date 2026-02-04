Set-Location "C:\quiz-desktop-app\apps\desktop"
Write-Host "🚀 Launching Electron app (detached)..." -ForegroundColor Green

# Start Electron as a background job that won't be killed by terminal
$job = Start-Job -ScriptBlock {
    Set-Location "C:\quiz-desktop-app\apps\desktop"
    npx electron .
}

Write-Host "✅ Electron started in background (Job ID: $($job.Id))" -ForegroundColor Green
Write-Host "Window should appear shortly..." -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop Electron:" -ForegroundColor Yellow
Write-Host "  Stop-Job $($job.Id); Remove-Job $($job.Id)" -ForegroundColor Gray
Write-Host "  Or: Stop-Process -Name electron -Force" -ForegroundColor Gray

# Wait a bit and show status
Start-Sleep -Seconds 5
Get-Process electron -ErrorAction SilentlyContinue | Select-Object ProcessName, Id
