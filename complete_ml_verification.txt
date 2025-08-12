# complete_ml_verification.ps1 - One-command verification of entire ML system
param(
    [switch]$SkipExchangeConnection,
    [switch]$DetailedOutput,
    [string]$DatabasePath = "memebot.db"
)

Write-Host "🤖 MEME COIN TRADING AI - COMPLETE ML VERIFICATION" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Verifying ML models use real exchange data for paper trading..." -ForegroundColor Yellow
Write-Host ""

# Function to run Python script and capture output
function Invoke-PythonVerification {
    param([string]$ScriptName, [string]$Description)
    
    Write-Host "🔍 $Description" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    
    try {
        $output = python $ScriptName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host $output -ForegroundColor White
            return @{
                Success = $true
                Output = $output
            }
        } else {
            Write-Host "❌ Script failed with exit code $LASTEXITCODE" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            return @{
                Success = $false
                Output = $output
                Error = "Exit code $LASTEXITCODE"
            }
        }
    }
    catch {
        Write-Host "❌ Failed to run $ScriptName`: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Check if database exists
if (-not (Test-Path $DatabasePath)) {
    Write-Host "❌ Database not found at: $DatabasePath" -ForegroundColor Red
    Write-Host "Please ensure your trading bot database exists." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Database found: $DatabasePath" -ForegroundColor Green
Write-Host ""

# Create verification scripts if they don't exist
$verificationScripts = @{
    "ml_verification_suite.py" = "ML Data Source Verification"
    "ml_settings_verification.py" = "ML Settings & Configuration Verification"
}

$allScriptsExist = $true
foreach ($script in $verificationScripts.Keys) {
    if (-not (Test-Path $script)) {
        Write-Host "⚠️ Verification script missing: $script" -ForegroundColor Yellow
        $allScriptsExist = $false
    }
}

if (-not $allScriptsExist) {
    Write-Host ""
    Write-Host "📥 Creating verification scripts..." -ForegroundColor Yellow
    Write-Host "Please use the artifacts provided in the chat to create these files:" -ForegroundColor White
    foreach ($script in $verificationScripts.Keys) {
        if (-not (Test-Path $script)) {
            Write-Host "  • $script" -ForegroundColor White
        }
    }
    Write-Host ""
    Write-Host "Once created, run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 1: Verify ML Models are using real exchange data
Write-Host "STEP 1: VERIFYING ML MODELS USE REAL EXCHANGE DATA" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$dataSourceResult = Invoke-PythonVerification "ml_verification_suite.py" "Checking if ML models receive real market data"

if (-not $dataSourceResult.Success) {
    Write-Host ""
    Write-Host "⚠️ Data source verification had issues. Continuing with settings check..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# Step 2: Verify ML Settings and Configuration
Write-Host "STEP 2: VERIFYING ML SETTINGS & CONFIDENCE THRESHOLDS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$settingsResult = Invoke-PythonVerification "ml_settings_verification.py" "Checking ML model settings and confidence thresholds"

Write-Host ""
Write-Host ""

# Step 3: Quick Database Analysis
Write-Host "STEP 3: QUICK DATABASE ANALYSIS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

try {
    $dbAnalysis = python -c @"
import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect('$DatabasePath')
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

analysis = {
    'tables_found': tables,
    'analysis_timestamp': datetime.now().isoformat()
}

# Check for trades
trade_tables = ['paper_trades', 'trades', 'arbitrage_opportunities']
for table in trade_tables:
    if table in tables:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        analysis[f'{table}_count'] = count
        
        # Get recent trades
        try:
            cursor.execute(f'SELECT COUNT(*) FROM {table} WHERE timestamp > datetime(\"now\", \"-24 hours\")')
            recent_count = cursor.fetchone()[0]
            analysis[f'{table}_recent_24h'] = recent_count
        except:
            pass

# Check for ML models
if 'ml_models' in tables:
    cursor.execute('SELECT COUNT(*), COUNT(CASE WHEN is_active = 1 THEN 1 END) FROM ml_models')
    total_models, active_models = cursor.fetchone()
    analysis['ml_models_total'] = total_models
    analysis['ml_models_active'] = active_models

# Check for confidence scores in trades
for table in trade_tables:
    if table in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM {table} WHERE confidence_score IS NOT NULL')
            confidence_trades = cursor.fetchone()[0]
            analysis[f'{table}_with_confidence'] = confidence_trades
        except:
            pass

conn.close()
print(json.dumps(analysis, indent=2))
"@

    $dbData = $dbAnalysis | ConvertFrom-Json
    
    Write-Host "📊 Database Analysis Results:" -ForegroundColor White
    Write-Host "  • Tables found: $($dbData.tables_found.Count)" -ForegroundColor White
    
    foreach ($table in @('paper_trades', 'trades', 'arbitrage_opportunities')) {
        $countKey = "${table}_count"
        $recentKey = "${table}_recent_24h"
        $confidenceKey = "${table}_with_confidence"
        
        if ($dbData.$countKey) {
            Write-Host "  • $table`: $($dbData.$countKey) total" -ForegroundColor White
            if ($dbData.$recentKey) {
                Write-Host "    └─ $($dbData.$recentKey) in last 24 hours" -ForegroundColor Gray
            }
            if ($dbData.$confidenceKey) {
                Write-Host "    └─ $($dbData.$confidenceKey) with confidence scores" -ForegroundColor Gray
            }
        }
    }
    
    if ($dbData.ml_models_total) {
        Write-Host "  • ML Models: $($dbData.ml_models_active)/$($dbData.ml_models_total) active" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Database analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Step 4: Exchange Connection Test (optional)
if (-not $SkipExchangeConnection) {
    Write-Host "STEP 4: TESTING EXCHANGE CONNECTIONS" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    
    try {
        $exchangeTest = python -c @"
import ccxt
import asyncio
import json

async def test_exchanges():
    exchanges = {
        'kraken': ccxt.kraken(),
        'binanceus': ccxt.binanceus(),
        'cryptocom': ccxt.cryptocom()
    }
    
    results = {}
    for name, exchange in exchanges.items():
        try:
            await exchange.load_markets()
            ticker = await exchange.fetch_ticker('DOGE/USDT')
            results[name] = {
                'status': 'connected',
                'price': ticker['last'],
                'timestamp': ticker['timestamp']
            }
            await exchange.close()
        except Exception as e:
            results[name] = {
                'status': 'failed',
                'error': str(e)
            }
    
    return results

# Run async function
results = asyncio.run(test_exchanges())
print(json.dumps(results, indent=2))
"@
        
        $exchangeData = $exchangeTest | ConvertFrom-Json
        
        Write-Host "🔌 Exchange Connection Test:" -ForegroundColor White
        foreach ($exchange in $exchangeData.PSObject.Properties) {
            $name = $exchange.Name
            $data = $exchange.Value
            
            if ($data.status -eq 'connected') {
                Write-Host "  ✅ $name`: Connected (DOGE/USDT: `$$($data.price))" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $name`: $($data.error)" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "⚠️ Exchange connection test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "This is not critical for ML verification." -ForegroundColor Gray
    }
} else {
    Write-Host "STEP 4: SKIPPED - Exchange connection test" -ForegroundColor Gray
}

Write-Host ""
Write-Host ""

# Final Summary
Write-Host "🎯 FINAL ML VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$overallScore = 0
$maxScore = 100

# Score based on verification results
if ($dataSourceResult.Success) {
    $overallScore += 40
    Write-Host "✅ Data Source Verification: PASSED (+40 points)" -ForegroundColor Green
} else {
    Write-Host "❌ Data Source Verification: FAILED (+0 points)" -ForegroundColor Red
}

if ($settingsResult.Success) {
    $overallScore += 40
    Write-Host "✅ Settings Verification: PASSED (+40 points)" -ForegroundColor Green
} else {
    Write-Host "❌ Settings Verification: FAILED (+0 points)" -ForegroundColor Red
}

if ($dbData.ml_models_active -gt 0) {
    $overallScore += 20
    Write-Host "✅ Active ML Models: DETECTED (+20 points)" -ForegroundColor Green
} else {
    Write-Host "❌ Active ML Models: NOT DETECTED (+0 points)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 OVERALL ML SYSTEM SCORE: $overallScore/$maxScore" -ForegroundColor White

if ($overallScore -ge 80) {
    $verdict = "🚀 EXCELLENT"
    $color = "Green"
    $recommendation = "Your ML system is properly configured and using real exchange data!"
} elseif ($overallScore -ge 60) {
    $verdict = "✅ GOOD"
    $color = "Yellow"
    $recommendation = "ML system mostly functional, minor improvements recommended."
} elseif ($overallScore -ge 40) {
    $verdict = "⚠️ NEEDS WORK"
    $color = "Yellow"
    $recommendation = "Significant ML configuration issues detected."
} else {
    $verdict = "❌ CRITICAL ISSUES"
    $color = "Red"
    $recommendation = "Major ML system problems - may not be using real data."
}

Write-Host ""
Write-Host "VERDICT: $verdict" -ForegroundColor $color
Write-Host "RECOMMENDATION: $recommendation" -ForegroundColor $color

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan

if ($overallScore -ge 80) {
    Write-Host "  1. 🚀 Your system is ready for production deployment!" -ForegroundColor Green
    Write-Host "  2. 📊 Monitor ML model performance daily" -ForegroundColor White
    Write-Host "  3. 🎯 Fine-tune confidence thresholds based on results" -ForegroundColor White
    Write-Host "  4. 📈 Gradually increase position sizes as confidence grows" -ForegroundColor White
} elseif ($overallScore -ge 60) {
    Write-Host "  1. 🔧 Address any failed verification steps above" -ForegroundColor Yellow
    Write-Host "  2. 📊 Check ML model training data" -ForegroundColor White
    Write-Host "  3. 🎯 Verify confidence threshold implementation" -ForegroundColor White
    Write-Host "  4. 🧪 Test with small position sizes" -ForegroundColor White
} else {
    Write-Host "  1. ❌ Fix critical ML system issues identified above" -ForegroundColor Red
    Write-Host "  2. 🔍 Verify exchange connections are providing real data" -ForegroundColor Red
    Write-Host "  3. 🤖 Ensure ML models are properly configured and active" -ForegroundColor Red
    Write-Host "  4. 🎯 Implement confidence threshold system" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ ML Verification Complete!" -ForegroundColor Green
Write-Host "📁 Check individual verification logs above for detailed analysis." -ForegroundColor Gray

# Save summary to file
$summary = @{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    overall_score = $overallScore
    verdict = $verdict
    recommendation = $recommendation
    data_source_verification = $dataSourceResult.Success
    settings_verification = $settingsResult.Success
    database_analysis = $dbData
} | ConvertTo-Json -Depth 10

$summary | Out-File -FilePath "ml_verification_summary.json" -Encoding UTF8
Write-Host ""
Write-Host "💾 Summary saved to: ml_verification_summary.json" -ForegroundColor Gray