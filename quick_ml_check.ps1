# quick_ml_check.ps1 - Simple ML verification without complex syntax
Write-Host "🤖 QUICK ML SYSTEM VERIFICATION" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check if database exists
$dbFiles = @("memebot.db", "trading_bot.db", "bot.db", "data.db")
$foundDb = $null

foreach ($db in $dbFiles) {
    if (Test-Path $db) {
        $foundDb = $db
        Write-Host "✅ Database found: $db" -ForegroundColor Green
        break
    }
}

if (-not $foundDb) {
    Write-Host "❌ No database found. Checked: $($dbFiles -join ', ')" -ForegroundColor Red
    Write-Host "Please ensure your trading bot has created a database." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Check database tables
Write-Host "🔍 CHECKING DATABASE STRUCTURE" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor DarkGray

try {
    $tableCheck = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"'); tables = [row[0] for row in cursor.fetchall()]; print('TABLES:', ','.join(tables)); conn.close()"
    Write-Host $tableCheck -ForegroundColor White
} catch {
    Write-Host "❌ Could not read database tables" -ForegroundColor Red
}

Write-Host ""

# Step 2: Check for trades
Write-Host "📊 CHECKING TRADE DATA" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor DarkGray

$tradeQueries = @(
    @{table="paper_trades"; desc="Paper Trades"},
    @{table="trades"; desc="Trades"},
    @{table="arbitrage_opportunities"; desc="Arbitrage Opportunities"}
)

foreach ($query in $tradeQueries) {
    try {
        $count = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM $($query.table)'); print(cursor.fetchone()[0]); conn.close()" 2>$null
        if ($count -gt 0) {
            Write-Host "✅ $($query.desc): $count records" -ForegroundColor Green
            
            # Check for recent trades
            try {
                $recent = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM $($query.table) WHERE timestamp > datetime(\"now\", \"-24 hours\")'); print(cursor.fetchone()[0]); conn.close()" 2>$null
                if ($recent -gt 0) {
                    Write-Host "  └─ $recent trades in last 24 hours" -ForegroundColor Gray
                }
            } catch { }
            
            # Check for confidence scores
            try {
                $confidence = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM $($query.table) WHERE confidence_score IS NOT NULL'); print(cursor.fetchone()[0]); conn.close()" 2>$null
                if ($confidence -gt 0) {
                    Write-Host "  └─ $confidence trades with ML confidence scores" -ForegroundColor Cyan
                }
            } catch { }
        }
    } catch {
        Write-Host "⚠️ $($query.desc): Table not found or empty" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 3: Check for ML models
Write-Host "🤖 CHECKING ML MODELS" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor DarkGray

try {
    $modelCount = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM ml_models'); print(cursor.fetchone()[0]); conn.close()" 2>$null
    
    if ($modelCount -gt 0) {
        Write-Host "✅ ML Models found: $modelCount" -ForegroundColor Green
        
        # Check active models
        try {
            $active = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM ml_models WHERE is_active = 1'); print(cursor.fetchone()[0]); conn.close()" 2>$null
            Write-Host "  └─ Active models: $active" -ForegroundColor Cyan
        } catch { }
        
        # Check trained models
        try {
            $trained = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM ml_models WHERE last_trained IS NOT NULL'); print(cursor.fetchone()[0]); conn.close()" 2>$null
            Write-Host "  └─ Trained models: $trained" -ForegroundColor Cyan
        } catch { }
    } else {
        Write-Host "❌ No ML models found in database" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ ML models table not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test basic exchange connection
Write-Host "🔌 TESTING EXCHANGE CONNECTION" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor DarkGray

$exchanges = @("kraken", "binanceus", "cryptocom")
$connectedCount = 0

foreach ($exchange in $exchanges) {
    try {
        $result = python -c "import ccxt; exchange = ccxt.$exchange(); markets = exchange.load_markets(); print('OK')" 2>$null
        if ($result -eq "OK") {
            Write-Host "✅ $exchange`: Connected" -ForegroundColor Green
            $connectedCount++
        } else {
            Write-Host "❌ $exchange`: Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $exchange`: Connection error" -ForegroundColor Red
    }
}

Write-Host ""

# Step 5: Generate score and verdict
Write-Host "🎯 VERIFICATION RESULTS" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$score = 0

# Score database (20 points)
if ($foundDb) {
    $score += 20
    Write-Host "✅ Database: Found (+20 points)" -ForegroundColor Green
}

# Score trades (30 points)
try {
    $totalTrades = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM paper_trades'); print(cursor.fetchone()[0]); conn.close()" 2>$null
    if ($totalTrades -gt 100) {
        $score += 30
        Write-Host "✅ Trading Activity: $totalTrades trades (+30 points)" -ForegroundColor Green
    } elseif ($totalTrades -gt 0) {
        $score += 15
        Write-Host "⚠️ Trading Activity: $totalTrades trades (+15 points)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Trading Activity: No trades found (+0 points)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Trading Activity: Could not check (+0 points)" -ForegroundColor Red
}

# Score ML models (25 points)
try {
    $activeModels = python -c "import sqlite3; conn = sqlite3.connect('$foundDb'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM ml_models WHERE is_active = 1'); print(cursor.fetchone()[0]); conn.close()" 2>$null
    if ($activeModels -ge 3) {
        $score += 25
        Write-Host "✅ ML Models: $activeModels active (+25 points)" -ForegroundColor Green
    } elseif ($activeModels -gt 0) {
        $score += 10
        Write-Host "⚠️ ML Models: $activeModels active (+10 points)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ ML Models: None active (+0 points)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ML Models: Could not check (+0 points)" -ForegroundColor Red
}

# Score exchange connections (25 points)
if ($connectedCount -ge 2) {
    $score += 25
    Write-Host "✅ Exchange Connections: $connectedCount connected (+25 points)" -ForegroundColor Green
} elseif ($connectedCount -eq 1) {
    $score += 10
    Write-Host "⚠️ Exchange Connections: $connectedCount connected (+10 points)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Exchange Connections: None working (+0 points)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 TOTAL SCORE: $score/100" -ForegroundColor White

# Generate verdict
if ($score -ge 80) {
    Write-Host "🚀 VERDICT: EXCELLENT - Ready for production!" -ForegroundColor Green
    Write-Host "💡 Your ML system appears to be properly configured and using real data." -ForegroundColor Green
} elseif ($score -ge 60) {
    Write-Host "✅ VERDICT: GOOD - Minor improvements needed" -ForegroundColor Yellow
    Write-Host "💡 System mostly functional, address any red items above." -ForegroundColor Yellow
} elseif ($score -ge 40) {
    Write-Host "⚠️ VERDICT: NEEDS WORK - Significant issues" -ForegroundColor Yellow
    Write-Host "💡 Several components need fixing before production." -ForegroundColor Yellow
} else {
    Write-Host "❌ VERDICT: CRITICAL ISSUES - Major problems detected" -ForegroundColor Red
    Write-Host "💡 System requires significant work before deployment." -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan

if ($score -ge 80) {
    Write-Host "  1. ✅ System looks ready for production deployment" -ForegroundColor Green
    Write-Host "  2. 📊 Monitor ML model performance daily" -ForegroundColor White
    Write-Host "  3. 🎯 Start with small position sizes" -ForegroundColor White
} elseif ($score -ge 60) {
    Write-Host "  1. 🔧 Fix any red items shown above" -ForegroundColor Yellow
    Write-Host "  2. 🤖 Ensure all ML models are active and trained" -ForegroundColor White
    Write-Host "  3. 📊 Verify confidence threshold implementation" -ForegroundColor White
} else {
    Write-Host "  1. ❌ Address critical issues shown above" -ForegroundColor Red
    Write-Host "  2. 🔍 Check if your bot is actually running and trading" -ForegroundColor Red
    Write-Host "  3. 🤖 Verify ML models are configured and connected" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Quick verification complete!" -ForegroundColor Green

# Save results
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$results = @{
    timestamp = $timestamp
    score = $score
    database = $foundDb
    verdict = if ($score -ge 80) { "EXCELLENT" } elseif ($score -ge 60) { "GOOD" } elseif ($score -ge 40) { "NEEDS_WORK" } else { "CRITICAL" }
} | ConvertTo-Json

$results | Out-File -FilePath "ml_verification_$timestamp.json" -Encoding UTF8
Write-Host "💾 Results saved to: ml_verification_$timestamp.json" -ForegroundColor Gray