# FormFlow Project Execution Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       FormFlow Survey Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencies installed!" -ForegroundColor Green
    Write-Host ""
}

# Start dev server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Server URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
Write-Host ""

npm run dev
