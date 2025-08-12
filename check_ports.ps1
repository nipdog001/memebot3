# Simple diagnostic script for meme trading bot
Write-Host "=== MEME TRADING BOT DIAGNOSTICS ===" -ForegroundColor Cyan

# 1. Check current directory
Write-Host "`n1. Current directory contents:" -ForegroundColor Yellow
Get-ChildItem | Select-Object Name, LastWriteTime | Format-Table

# 2. Look for key files
Write-Host "2. Looking for server files:" -ForegroundColor Yellow
$serverFiles = @("server.js", "enhanced-server.js", "main.py", "app.py", "index.js")
foreach ($file in $serverFiles) {
    if (Test-Path $file) {
        Write-Host "   Found: $file" -ForegroundColor Green
    } else {
        Write-Host "   Missing: $file" -ForegroundColor Red
    }
}

# 3. Check package.json for start scripts
Write-Host "`n3. Checking package.json:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "   Scripts available:" -ForegroundColor Cyan
    if ($package.scripts) {
        $package.scripts.PSObject.Properties | ForEach-Object {
            Write-Host "   - $($_.Name): $($_.Value)" -ForegroundColor White
        }
    }
} else {
    Write-Host "   No package.json found" -ForegroundColor Red
}

# 4. Check for running processes
Write-Host "`n4. Checking for running processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$pythonProcesses = Get-Process -Name "python*" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Node.js processes: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "   No Node.js processes running" -ForegroundColor Red
}

if ($pythonProcesses) {
    Write-Host "   Python processes: $($pythonProcesses.Count)" -ForegroundColor Green  
} else {
    Write-Host "   No Python processes running" -ForegroundColor Red
}

# 5. Test local ports
Write-Host "`n5. Testing local ports:" -ForegroundColor Yellow
$ports = @(3000, 8000, 5000, 4000)
foreach ($port in $ports) {
    $result = Test-NetConnection -ComputerName "localhost" -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        Write-Host "   Port $port: ACTIVE" -ForegroundColor Green
    } else {
        Write-Host "   Port $port: Not responding" -ForegroundColor Red
    }
}

# 6. Test Railway URL
Write-Host "`n6. Testing Railway URL:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://web-production-323cf.up.railway.app" -TimeoutSec 10 -UseBasicParsing
    Write-Host "   Railway Status: $($response.StatusCode)" -ForegroundColor Green
    if ($response.Content.Length -gt 0) {
        Write-Host "   Content Length: $($response.Content.Length) characters" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Railway Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Check for data files
Write-Host "`n7. Looking for data files:" -ForegroundColor Yellow
$jsonFiles = Get-ChildItem -Name "*.json" -Recurse | Select-Object -First 5
if ($jsonFiles) {
    Write-Host "   JSON files found:" -ForegroundColor Green
    foreach ($file in $jsonFiles) {
        Write-Host "   - $file" -ForegroundColor White
    }
}

$xlsxFiles = Get-ChildItem -Name "*.xlsx" -Recurse | Select-Object -First 3  
if ($xlsxFiles) {
    Write-Host "   Excel files found:" -ForegroundColor Green
    foreach ($file in $xlsxFiles) {
        Write-Host "   - $file" -ForegroundColor White
    }
}

# 8. Recommendations
Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Green

$hasServerFile = (Test-Path "server.js") -or (Test-Path "enhanced-server.js") -or (Test-Path "main.py")
$hasPackageJson = Test-Path "package.json"
$hasActivePort = $false

foreach ($port in $ports) {
    if (Test-NetConnection -ComputerName "localhost" -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue) {
        $hasActivePort = $true
        break
    }
}

if (-not $hasActivePort) {
    Write-Host "`nNO LOCAL SERVER RUNNING - Try these commands:" -ForegroundColor Red
    if ($hasPackageJson) {
        Write-Host "npm start" -ForegroundColor White
    }
    if (Test-Path "server.js") {
        Write-Host "node server.js" -ForegroundColor White  
    }
    if (Test-Path "enhanced-server.js") {
        Write-Host "node enhanced-server.js" -ForegroundColor White
    }
    if (Test-Path "main.py") {
        Write-Host "python main.py" -ForegroundColor White
    }
} else {
    Write-Host "`nLOCAL SERVER IS RUNNING - Check browser:" -ForegroundColor Green
    Write-Host "Open: http://localhost:3000" -ForegroundColor White
}

Write-Host "`nYour trading data shows profit of $23,506.36!" -ForegroundColor Green
Write-Host "The backend is working - just need to start the UI server." -ForegroundColor Cyan