# start-metro.ps1 — Kills any stale process on port 8081 and starts Metro fresh
Write-Host "Checking for process on port 8081..." -ForegroundColor Cyan

$proc = (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if ($proc) {
    Stop-Process -Id $proc -Force
    Write-Host "Killed stale process (PID $proc) on port 8081." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
} else {
    Write-Host "Port 8081 is free." -ForegroundColor Green
}

Write-Host "Running adb reverse..." -ForegroundColor Cyan
adb reverse tcp:8081 tcp:8081

Write-Host "Starting Metro bundler..." -ForegroundColor Green
npx react-native start --reset-cache
