# run_ml_check.ps1 - Simple script to run ML verification
Write-Host "🤖 RUNNING ML SYSTEM VERIFICATION..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if simple_db_check.py exists
if (-not (Test-Path "simple_db_check.py")) {
    Write-Host "❌ simple_db_check.py not found!" -ForegroundColor Red
    Write-Host "Please create this file using the Python script provided in the chat." -ForegroundColor Yellow
    exit 1
}

# Run the verification
Write-Host "🔍 Running ML verification..." -ForegroundColor Yellow
Write-Host ""

try {
    python simple_db_check.py
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Verification completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Verification completed with warnings." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error running verification: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Check the output above for your ML system status." -ForegroundColor Gray