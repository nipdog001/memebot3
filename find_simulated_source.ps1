# find_simulated_source.ps1 - Find where the 100% win rate data is coming from
Write-Host "🔍 FINDING SIMULATED DATA SOURCE" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "`n🎯 Your dashboard shows IMPOSSIBLE results:" -ForegroundColor Yellow
Write-Host "• 100% win rate (no real system has this)" -ForegroundColor Red
Write-Host "• 50/50 wins, 0 losses (suspicious)" -ForegroundColor Red  
Write-Host "• Perfect profits on all meme coins" -ForegroundColor Red
Write-Host "• $1,070.37 total profit (too clean)" -ForegroundColor Red

Write-Host "`n🔍 SEARCHING FOR HARDCODED DATA..." -ForegroundColor Green
Write-Host "--------------------------------" -ForegroundColor DarkGray

# Search for the specific profit amount
Write-Host "1. Searching for profit amount $1,070.37..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include "*.js","*.json","*.ts","*.tsx" | Select-String -Pattern "1070|1,070" | ForEach-Object {
    Write-Host "   📁 $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor White
}

# Search for 100% win rate
Write-Host "`n2. Searching for 100% win rates..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include "*.js","*.json","*.ts","*.tsx" | Select-String -Pattern "100%|winRate.*100|win.*rate.*100" | ForEach-Object {
    Write-Host "   📁 $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor White
}

# Search for 50 trades
Write-Host "`n3. Searching for 50 trades..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include "*.js","*.json","*.ts","*.tsx" | Select-String -Pattern "50.*trad|totalTrades.*50|trades.*50" | ForEach-Object {
    Write-Host "   📁 $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor White
}

# Search for meme coin symbols
Write-Host "`n4. Searching for meme coin data..." -ForegroundColor Yellow
$memeCoins = @("FLOKI", "PEPE", "BONK", "SHIB", "MYRO", "DOGE", "WIF", "POPCAT")
foreach ($coin in $memeCoins) {
    $matches = Get-ChildItem -Recurse -Include "*.js","*.json","*.ts","*.tsx" | Select-String -Pattern "$coin.*USDT.*100" -List
    if ($matches) {
        Write-Host "   🪙 Found $coin with suspicious 100% data:" -ForegroundColor Red
        $matches | ForEach-Object {
            Write-Host "      📁 $($_.Filename)" -ForegroundColor White
        }
    }
}

# Search for simulation/mock patterns
Write-Host "`n5. Searching for simulation patterns..." -ForegroundColor Yellow
$patterns = @("simulat", "mock", "fake", "demo", "test.*trad")
foreach ($pattern in $patterns) {
    Get-ChildItem -Recurse -Include "*.js","*.json","*.ts","*.tsx" | Select-String -Pattern $pattern | ForEach-Object {
        Write-Host "   ⚠️ $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Yellow
    }
}

# Check for multiple server files
Write-Host "`n6. Checking for multiple servers..." -ForegroundColor Yellow
$serverFiles = @("server.js", "app.js", "main.js", "index.js", "enhanced-server.js", "dashboard-server.js")
foreach ($file in $serverFiles) {
    if (Test-Path $file) {
        Write-Host "   📄 Found server file: $file" -ForegroundColor White
        
        # Check if it contains trading logic
        $content = Get-Content $file -Raw
        if ($content -match "trad|profit|win|stats") {
            Write-Host "      🎯 Contains trading-related code!" -ForegroundColor Red
        }
    }
}

# Check JSON data files
Write-Host "`n7. Checking JSON data files..." -ForegroundColor Yellow
$jsonFiles = Get-ChildItem -Name "*.json" | Where-Object { $_ -match "stat|trad|data|user" }
foreach ($file in $jsonFiles) {
    Write-Host "   📄 Found data file: $file" -ForegroundColor White
    
    try {
        $jsonData = Get-Content $file | ConvertFrom-Json
        
        # Check for suspicious win rates
        if ($jsonData.winRate -eq 100 -or $jsonData.winRate -eq 1) {
            Write-Host "      🚨 FOUND 100% WIN RATE in $file!" -ForegroundColor Red
        }
        
        # Check for trade data
        if ($jsonData.trades -and $jsonData.trades.Count -gt 0) {
            $winCount = ($jsonData.trades | Where-Object { $_.profit -gt 0 }).Count
            $totalCount = $jsonData.trades.Count
            $winRate = if ($totalCount -gt 0) { ($winCount / $totalCount) * 100 } else { 0 }
            
            Write-Host "      📊 Win rate in $file`: $($winRate.ToString('F1'))%" -ForegroundColor $(if ($winRate -eq 100) { "Red" } else { "White" })
            
            if ($totalCount -eq 50) {
                Write-Host "      🎯 EXACTLY 50 trades in $file!" -ForegroundColor Red
            }
        }
        
        # Check for the specific profit amount
        if ($jsonData.totalProfit -eq 1070.37 -or $jsonData.profit -eq 1070.37) {
            Write-Host "      💰 FOUND EXACT PROFIT MATCH: $1,070.37 in $file!" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "      ⚠️ Could not parse $file as JSON" -ForegroundColor Gray
    }
}

Write-Host "`n🔍 CHECKING RUNNING PROCESSES..." -ForegroundColor Green
Write-Host "-------------------------------" -ForegroundColor DarkGray

# Check for running Node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes running:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID $($_.Id): $($_.ProcessName)" -ForegroundColor White
    }
    Write-Host "   💡 You might have multiple servers running!" -ForegroundColor Yellow
}

Write-Host "`n===============================" -ForegroundColor Cyan
Write-Host "🎯 INVESTIGATION RESULTS" -ForegroundColor Cyan  
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "`n💡 WHAT TO LOOK FOR:" -ForegroundColor Green
Write-Host "1. 🔍 Files containing '1070' or '1,070' (your exact profit)" -ForegroundColor White
Write-Host "2. 🔍 Files with 100% win rates hardcoded" -ForegroundColor White
Write-Host "3. 🔍 JSON files with exactly 50 trades" -ForegroundColor White
Write-Host "4. 🔍 Multiple server files running different systems" -ForegroundColor White
Write-Host "5. 🔍 Mock/simulation/demo mode enabled somewhere" -ForegroundColor White

Write-Host "`n🔧 NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Check the files flagged above" -ForegroundColor White
Write-Host "2. Look for hardcoded trading data" -ForegroundColor White  
Write-Host "3. Find which server your dashboard connects to" -ForegroundColor White
Write-Host "4. Disable simulation mode and connect to real engine" -ForegroundColor White

Write-Host "`n✅ Investigation complete!" -ForegroundColor Green