# setup-ml-enhancements.ps1
# PowerShell script to set up ML learning enhancements

Write-Host "🚀 Setting up ML Trading Enhancements..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Not in project directory. Please run from your project root." -ForegroundColor Red
    exit 1
}

# Step 1: Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "server/services" | Out-Null
New-Item -ItemType Directory -Force -Path "scripts" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green

# Step 2: Create .env file if it doesn't exist
Write-Host "`n📝 Setting up environment variables..." -ForegroundColor Yellow
$envPath = ".env"
if (-not (Test-Path $envPath)) {
    @"
# Exchange API Keys (Use sandbox/testnet keys first!)
COINBASE_API_KEY=
COINBASE_API_SECRET=

KRAKEN_API_KEY=
KRAKEN_API_SECRET=

BINANCEUS_API_KEY=
BINANCEUS_API_SECRET=

CRYPTOCOM_API_KEY=
CRYPTOCOM_API_SECRET=

# Trading Configuration
NODE_ENV=production
PAPER_TRADING=true
ML_LEARNING_ENABLED=true
REAL_DATA_VALIDATION=strict

# Server Configuration
PORT=3001
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ Created .env file - Please add your API keys!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Step 3: Check for required files
Write-Host "`n🔍 Checking for required service files..." -ForegroundColor Yellow
$requiredFiles = @(
    "server/services/ccxtIntegration.js",
    "server/services/exchangeService.js",
    "server/services/realDataTracker.js",
    "server/services/mlTradingEngine.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n⚠️  Some required files are missing. Make sure you have all the service files." -ForegroundColor Yellow
}

# Step 4: Create ML Learning Service file
Write-Host "`n📝 Creating ML Learning Service..." -ForegroundColor Yellow
$mlServicePath = "server/services/mlLearningService.js"
if (-not (Test-Path $mlServicePath)) {
    Write-Host "   Creating mlLearningService.js..." -ForegroundColor Gray
    Write-Host "   ⚠️  Please copy the ML Learning Service code from the artifact to:" -ForegroundColor Yellow
    Write-Host "   $mlServicePath" -ForegroundColor Cyan
    New-Item -ItemType File -Path $mlServicePath -Force | Out-Null
}

# Step 5: Create verification script
Write-Host "`n📝 Creating verification script..." -ForegroundColor Yellow
$verifyPath = "scripts/verifyMLSetup.js"
if (-not (Test-Path $verifyPath)) {
    Write-Host "   Creating verifyMLSetup.js..." -ForegroundColor Gray
    Write-Host "   ⚠️  Please copy the verification script code from the artifact to:" -ForegroundColor Yellow
    Write-Host "   $verifyPath" -ForegroundColor Cyan
    New-Item -ItemType File -Path $verifyPath -Force | Out-Null
}

# Step 6: Install any missing dependencies
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredDeps = @("ccxt", "dotenv", "express", "cors", "ws")

$missingDeps = @()
foreach ($dep in $requiredDeps) {
    if (-not ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep)) {
        $missingDeps += $dep
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host "   Installing missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Gray
    npm install $missingDeps
} else {
    Write-Host "✅ All required dependencies installed" -ForegroundColor Green
}

# Step 7: Create a test runner script
Write-Host "`n📝 Creating test runner script..." -ForegroundColor Yellow
$testRunnerPath = "test-ml-setup.ps1"
@'
# Test ML Setup Script
Write-Host "🧪 Testing ML Setup..." -ForegroundColor Cyan

# Run verification
Write-Host "`nRunning verification script..." -ForegroundColor Yellow
node scripts/verifyMLSetup.js

# Start server in test mode
Write-Host "`n🚀 Starting server in test mode..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray

$env:NODE_ENV = "production"
$env:PAPER_TRADING = "true"
$env:ML_LEARNING_ENABLED = "true"
$env:REAL_DATA_VALIDATION = "strict"

npm run dev
'@ | Out-File -FilePath $testRunnerPath -Encoding UTF8

Write-Host "✅ Created test runner script" -ForegroundColor Green

# Step 8: Final instructions
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add the ML Learning Service code to: server/services/mlLearningService.js" -ForegroundColor White
Write-Host "2. Add the verification script code to: scripts/verifyMLSetup.js" -ForegroundColor White
Write-Host "3. Update your existing service files with the enhancement code" -ForegroundColor White
Write-Host "4. Add your exchange API keys to .env file" -ForegroundColor White
Write-Host "5. Run verification: node scripts/verifyMLSetup.js" -ForegroundColor White
Write-Host "6. Start testing: .\test-ml-setup.ps1" -ForegroundColor White

Write-Host "`n💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Verify setup:  " -NoNewline -ForegroundColor Gray
Write-Host "node scripts/verifyMLSetup.js" -ForegroundColor Cyan
Write-Host "  Test ML setup: " -NoNewline -ForegroundColor Gray
Write-Host ".\test-ml-setup.ps1" -ForegroundColor Cyan
Write-Host "  Start server:  " -NoNewline -ForegroundColor Gray
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "  View ML data:  " -NoNewline -ForegroundColor Gray
Write-Host "Get-Content ml_learning_data.json | ConvertFrom-Json | ConvertTo-Json -Depth 10" -ForegroundColor Cyan

Write-Host "`n🚀 Happy trading!" -ForegroundColor Green