// node_finder.js - Find simulated data source using Node.js
import fs from 'fs';
import path from 'path';

function findSimulatedData() {
    console.log('🔍 FINDING SIMULATED DATA SOURCE');
    console.log('================================');
    
    console.log('\n🚨 Your dashboard shows IMPOSSIBLE results:');
    console.log('• 100% win rate (no real system has this)');
    console.log('• 50 trades with 0 losses');  
    console.log('• $1,070.37 total profit');
    console.log('• Perfect profits on all meme coins');
    
    // 1. Search for exact profit amount
    console.log('\n1. 💰 SEARCHING FOR EXACT PROFIT AMOUNT (1070)');
    console.log('-----------------------------------------------');
    
    searchInFiles('1070', ['.js', '.json', '.ts', '.tsx']);
    
    // 2. Search for 100% win rate
    console.log('\n2. 🎯 SEARCHING FOR 100% WIN RATES');
    console.log('----------------------------------');
    
    searchInFiles('100%', ['.js', '.json', '.ts', '.tsx']);
    searchInFiles('winRate.*100', ['.js', '.json'], true); // regex
    
    // 3. Search for 50 trades
    console.log('\n3. 📊 SEARCHING FOR 50 TRADES');
    console.log('-----------------------------');
    
    searchInFiles('50.*trade', ['.js', '.json'], true); // regex
    searchInFiles('"totalTrades": 50', ['.json']);
    
    // 4. Check specific JSON data files
    console.log('\n4. 📄 CHECKING JSON DATA FILES');
    console.log('------------------------------');
    
    const suspiciousFiles = [
        'stats.json',
        'userState.json', 
        'tradingData.json',
        'mockData.json',
        'dashboard-data.json',
        'trading-stats.json'
    ];
    
    suspiciousFiles.forEach(filename => {
        if (fs.existsSync(filename)) {
            console.log(`📁 Found: ${filename}`);
            try {
                const content = fs.readFileSync(filename, 'utf8');
                const data = JSON.parse(content);
                
                // Check for suspicious patterns
                if (data.totalProfit === 1070.37 || data.profit === 1070.37) {
                    console.log(`   🚨 EXACT PROFIT MATCH: $1,070.37 in ${filename}!`);
                }
                
                if (data.winRate === 100 || data.winRate === 1) {
                    console.log(`   🚨 100% WIN RATE in ${filename}!`);
                }
                
                if (data.totalTrades === 50) {
                    console.log(`   🚨 EXACTLY 50 TRADES in ${filename}!`);
                }
                
                if (data.trades && Array.isArray(data.trades)) {
                    const winCount = data.trades.filter(t => t.profit > 0).length;
                    const winRate = (winCount / data.trades.length) * 100;
                    console.log(`   📊 Win rate: ${winRate.toFixed(1)}% (${winCount}/${data.trades.length})`);
                    
                    if (winRate === 100) {
                        console.log(`   🚨 PERFECT WIN RATE DETECTED!`);
                    }
                }
                
            } catch (error) {
                console.log(`   ⚠️ Could not parse ${filename}: ${error.message}`);
            }
        }
    });
    
    // 5. Find all server files
    console.log('\n5. 🖥️ CHECKING SERVER FILES');
    console.log('---------------------------');
    
    const serverFiles = [
        'server.js',
        'app.js', 
        'main.js',
        'index.js',
        'enhanced-server.js',
        'dashboard-server.js'
    ];
    
    serverFiles.forEach(filename => {
        if (fs.existsSync(filename)) {
            console.log(`📄 Found: ${filename}`);
            
            const content = fs.readFileSync(filename, 'utf8');
            
            // Check for simulation keywords
            const suspiciousKeywords = ['mock', 'demo', 'simulat', 'fake', 'test.*trad'];
            suspiciousKeywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                if (regex.test(content)) {
                    console.log(`   ⚠️ Contains "${keyword}" - possible simulation`);
                }
            });
            
            // Check for hardcoded 100%
            if (content.includes('100%') || content.includes('winRate: 100')) {
                console.log(`   🚨 Contains hardcoded 100% win rate!`);
            }
        }
    });
    
    // 6. Check package.json for scripts
    console.log('\n6. 📦 CHECKING PACKAGE.JSON SCRIPTS');
    console.log('-----------------------------------');
    
    if (fs.existsSync('package.json')) {
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (pkg.scripts) {
                console.log('Available scripts:');
                Object.entries(pkg.scripts).forEach(([name, script]) => {
                    console.log(`   ${name}: ${script}`);
                    if (script.includes('demo') || script.includes('mock') || script.includes('test')) {
                        console.log(`      ⚠️ This might be a simulation script!`);
                    }
                });
            }
        } catch (error) {
            console.log('Could not parse package.json');
        }
    }
    
    console.log('\n================================');
    console.log('🎯 INVESTIGATION RESULTS');
    console.log('================================');
    
    console.log('\n💡 WHAT TO DO NEXT:');
    console.log('1. Check files flagged with 🚨 above');
    console.log('2. Look for hardcoded profit/win rate data');
    console.log('3. Find which server your dashboard connects to');
    console.log('4. Stop simulation server and use real trading engine');
    
    console.log('\n🔧 COMMON FIXES:');
    console.log('• Delete/rename JSON files with fake data');
    console.log('• Change dashboard API endpoints from /mock-* to real endpoints');
    console.log('• Set DEMO_MODE=false in environment variables');
    console.log('• Connect dashboard to your working exchange service');
}

function searchInFiles(searchTerm, extensions, isRegex = false) {
    try {
        const files = getAllFiles('.', extensions);
        let foundAny = false;
        
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                let matches = false;
                
                if (isRegex) {
                    const regex = new RegExp(searchTerm, 'gi');
                    matches = regex.test(content);
                } else {
                    matches = content.toLowerCase().includes(searchTerm.toLowerCase());
                }
                
                if (matches) {
                    console.log(`   🚨 FOUND in ${file}`);
                    
                    // Show the line with context
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        let lineMatches = false;
                        
                        if (isRegex) {
                            const regex = new RegExp(searchTerm, 'gi');
                            lineMatches = regex.test(line);
                        } else {
                            lineMatches = line.toLowerCase().includes(searchTerm.toLowerCase());
                        }
                        
                        if (lineMatches) {
                            console.log(`      Line ${index + 1}: ${line.trim()}`);
                        }
                    });
                    foundAny = true;
                }
            } catch (error) {
                // Skip files that can't be read
            }
        });
        
        if (!foundAny) {
            console.log(`   No matches found for "${searchTerm}"`);
        }
    } catch (error) {
        console.log(`   Error searching for "${searchTerm}": ${error.message}`);
    }
}

function getAllFiles(dir, extensions) {
    let files = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    files = files.concat(getAllFiles(fullPath, extensions));
                } else if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip files/directories that can't be accessed
            }
        });
    } catch (error) {
        // Skip directories that can't be read
    }
    
    return files;
}

// Run the search
findSimulatedData();