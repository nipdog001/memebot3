# run_postgres_verification.ps1 - PostgreSQL ML verification runner
Write-Host "🐘 POSTGRESQL ML SYSTEM VERIFICATION" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Python and psycopg2
Write-Host "🔍 Checking requirements..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python first." -ForegroundColor Red
    exit 1
}

# Check psycopg2
try {
    python -c "import psycopg2; print('psycopg2 version:', psycopg2.__version__)" 2>$null
    Write-Host "✅ psycopg2: Available" -ForegroundColor Green
} catch {
    Write-Host "⚠️ psycopg2 not found. Installing..." -ForegroundColor Yellow
    try {
        pip install psycopg2-binary
        Write-Host "✅ psycopg2-binary installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install psycopg2. You may need to install it manually:" -ForegroundColor Red
        Write-Host "   pip install psycopg2-binary" -ForegroundColor White
        exit 1
    }
}

Write-Host ""

# Check for database connection
Write-Host "🔌 Checking database connection..." -ForegroundColor Yellow

$envVars = @("DATABASE_URL", "POSTGRES_URL", "DB_URL", "RAILWAY_POSTGRES_URL")
$foundConnection = $false

foreach ($var in $envVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ Found database connection: $var" -ForegroundColor Green
        $foundConnection = $true
        break
    }
}

if (-not $foundConnection) {
    Write-Host "⚠️ No database URL found in environment variables." -ForegroundColor Yellow
    Write-Host "Checking individual connection parameters..." -ForegroundColor Gray
    
    $individualVars = @("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_PORT")
    $foundIndividual = $false
    
    foreach ($var in $individualVars) {
        $value = [System.Environment]::GetEnvironmentVariable($var)
        if ($value) {
            Write-Host "✅ Found $var" -ForegroundColor Green
            $foundIndividual = $true
        }
    }
    
    if (-not $foundIndividual) {
        Write-Host ""
        Write-Host "❌ No PostgreSQL connection details found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please set one of these environment variables:" -ForegroundColor Yellow
        Write-Host "  • DATABASE_URL=postgresql://user:pass@host:port/dbname" -ForegroundColor White
        Write-Host "  • POSTGRES_URL=postgresql://user:pass@host:port/dbname" -ForegroundColor White
        Write-Host ""
        Write-Host "Or individual variables:" -ForegroundColor Yellow
        Write-Host "  • DB_HOST=your-host" -ForegroundColor White
        Write-Host "  • DB_NAME=your-database" -ForegroundColor White
        Write-Host "  • DB_USER=your-username" -ForegroundColor White
        Write-Host "  • DB_PASSWORD=your-password" -ForegroundColor White
        Write-Host "  • DB_PORT=5432" -ForegroundColor White
        Write-Host ""
        Write-Host "For Railway, get your database URL from:" -ForegroundColor Cyan
        Write-Host "  railway variables" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

Write-Host ""

# Check if verification script exists
if (-not (Test-Path "postgres_ml_verification.py")) {
    Write-Host "❌ postgres_ml_verification.py not found!" -ForegroundColor Red
    Write-Host "Please create this file using the PostgreSQL script provided." -ForegroundColor Yellow
    exit 1
}

# Run verification
Write-Host "🚀 Running PostgreSQL ML verification..." -ForegroundColor Green
Write-Host ""

try {
    python postgres_ml_verification.py
    Write-Host ""
    Write-Host "✅ Verification completed!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Check the output above for your ML system analysis." -ForegroundColor Gray