# Club Reservation System - Quick Start Script
# This script starts a local HTTP server to run the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Club Reservation System - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
$pythonInstalled = $false
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python") {
        Write-Host "✓ Python detected: $pythonVersion" -ForegroundColor Green
        $pythonInstalled = $true
    }
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Yellow
}

# Check if Node.js is installed
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v") {
        Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Yellow
}

Write-Host ""

# Check if Supabase is configured
$supabaseConfigured = $false
$supabaseClientPath = Join-Path $PSScriptRoot "supabaseClient.js"
if (Test-Path $supabaseClientPath) {
    $content = Get-Content $supabaseClientPath -Raw
    if ($content -notmatch "YOUR_SUPABASE_URL" -and $content -notmatch "YOUR_SUPABASE_ANON_KEY") {
        Write-Host "✓ Supabase appears to be configured" -ForegroundColor Green
        $supabaseConfigured = $true
    } else {
        Write-Host "⚠ WARNING: Supabase is NOT configured!" -ForegroundColor Red
        Write-Host "  Please follow the instructions in SUPABASE_SETUP_GUIDE.md" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Do you want to continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit
        }
    }
}

Write-Host ""
Write-Host "Starting local HTTP server..." -ForegroundColor Cyan
Write-Host ""

# Start server based on available tools
if ($pythonInstalled) {
    Write-Host "Using Python HTTP Server" -ForegroundColor Green
    Write-Host "Server running at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Login page: http://localhost:8000/login.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    python -m http.server 8000
} elseif ($nodeInstalled) {
    Write-Host "Using Node.js HTTP Server" -ForegroundColor Green
    Write-Host "Installing http-server (if not already installed)..." -ForegroundColor Yellow
    npm install -g http-server 2>&1 | Out-Null
    Write-Host "Server running at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Login page: http://localhost:8000/login.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    http-server -p 8000
} else {
    Write-Host "ERROR: Neither Python nor Node.js is installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  - Python 3: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "  - Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use VS Code Live Server extension:" -ForegroundColor Yellow
    Write-Host "  1. Install 'Live Server' extension in VS Code" -ForegroundColor White
    Write-Host "  2. Right-click on login.html" -ForegroundColor White
    Write-Host "  3. Select 'Open with Live Server'" -ForegroundColor White
    Write-Host ""
    pause
}
