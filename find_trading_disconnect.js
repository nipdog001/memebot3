// find_trading_disconnect.js - Find where simulated trading is happening
import fs from 'fs';
import path from 'path';

async function findTradingDisconnect() {
    console.log('🔍 FINDING THE SIMULATED TRADING SYSTEM');
    console.log('=====================================');
    
    // 1. Check for multiple trading engines or servers
    console.log('\n1. 📁 SCANNING FOR TRADING SYSTEMS');
    console.log('----------------------------------');
    
    const filesToCheck = [
        'server.js',
        'app.js', 
        'main.js',
        'index.js',
        'enhanced-server.js',
        'dashboard-server.js',
        'trading-server.js'
    ];
    
    const foundFiles = [];
    for (const file of filesToCheck) {
        if (fs.existsSync(file)) {
            foundFiles.push(file);
            console.log(`✅ Found: ${file}`);
        }
    }
    
    if (foundFiles.length === 0) {
        console.log('❌ No main server files found in root directory');
    }
    
    // 2. Check server directory structure
    console.log('\n2. 📂 CHECKING SERVER DIRECTORY');
    console.log('-------------------------------');
    
    if (fs.existsSync('server')) {
        const serverFiles = fs.readdirSync('server', { withFileTypes: true });
        serverFiles.forEach(file => {
            if (file.isFile() && file.name.endsWith('.js')) {
                console.log(`📄 server/${file.name}`);
            } else if (file.isDirectory()) {
                console.log(`📁 server/${file.name}/`);
                try {
                    const subFiles = fs.readdirSync(`server/${file.name}`);
                    subFiles.forEach(subFile => {
                        if (subFile.endsWith('.js')) {
                            console.log(`   📄 ${subFile}`);
                        }
                    });
                } catch (error) {
                    console.log(`   ❌ Could not read server/${file.name}`);
                }
            }
        });
    } else {
        console.log('❌ No server directory found');
    }
    
    // 3. Search for simulated trading patterns
    console.log('\n3. 🔍 SEARCHING FOR SIMULATED TRADING PATTERNS');
    console.log('----------------------------------------------');
    
    const suspiciousPatterns = [
        'simulat',
        'mock',
        'fake',
        'demo',
        'test.*trad',
        '100.*win',
        'perfect.*rate',
        'paper.*trad.*mock'
    ];
    
    const searchFiles = [
        ...foundFiles,
        'server/enhanced-server.js',
        'server/dashboard-server.js', 
        'server/services/exchangeService.js',
        'server/services/mlTradingEngine.js',
        'src/App.tsx',
        'src/components/TradingStats.tsx'
    ];
    
    for (const file of searchFiles) {
        if (fs.existsSync(file)) {
            console.log(`\n🔍 Analyzing ${file}:`);
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const pattern of suspiciousPatterns) {
                    const regex = new RegExp(pattern, 'gi');
                    const matches = content.match(regex);
                    if (matches) {
                        console.log(`   ⚠️ Found suspicious pattern "${pattern}": ${matches.length} occurrences`);
                        
                        // Show context around matches
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            if (regex.test(line)) {
                                console.log(`      Line ${index + 1}: ${line.trim()}`);
                            }
                        });
                    }
                }
                
                // Check for hardcoded win rates
                if (content.includes('100%') || content.includes('winRate: 100') || content.includes('winRate = 100')) {
                    console.log(`   🚨 FOUND 100% WIN RATE HARDCODED!`);
                }
                
                // Check for fake profit generation
                if (content.includes('Math.random') && (content.includes('profit') || content.includes('trade'))) {
                    console.log(`   🚨 FOUND RANDOM PROFIT GENERATION!`);
                }
                
            } catch (error) {
                console.log(`   ❌ Could not read ${file}`);
            }
        }
    }
    
    // 4. Check database connections
    console.log('\n4. 🗄️ CHECKING DATABASE CONNECTIONS');
    console.log('-----------------------------------');
    
    const dbFiles = [
        'stats.json',
        'userState.json', 
        'tradingData.json',
        'mockData.json',
        'simulatedTrades.json'
    ];
    
    for (const dbFile of dbFiles) {
        if (fs.existsSync(dbFile)) {
            console.log(`📄 Found data file: ${dbFile}`);
            try {
                const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
                
                if (data.trades && Array.isArray(data.trades)) {
                    const winRate = data.trades.filter(t => t.profit > 0).length / data.trades.length * 100;
                    console.log(`   📊 Win rate in ${dbFile}: ${winRate.toFixed(1)}%`);
                    
                    if (winRate === 100) {
                        console.log(`   🚨 SUSPICIOUS: 100% win rate in ${dbFile}!`);
                    }
                }
                
                if (data.winRate === 100 || data.winRate === 1) {
                    console.log(`   🚨 FOUND HARDCODED 100% WIN RATE in ${dbFile}!`);
                }
                
            } catch (error) {
                console.log(`   ⚠️ Could not parse ${dbFile} as JSON`);
            }
        }
    }
    
    // 5. Check for environment variables indicating demo mode
    console.log('\n5. 🔧 CHECKING ENVIRONMENT VARIABLES');
    console.log('------------------------------------');
    
    const demoVars = [
        'DEMO_MODE',
        'SIMULATION_MODE', 
        'MOCK_TRADING',
        'PAPER_TRADING',
        'TEST_MODE'
    ];
    
    demoVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`⚠️ ${varName}: ${value}`);
        }
    });
    
    // 6. Look for the actual trading data source
    console.log('\n6. 📊 IDENTIFYING TRADING DATA SOURCE');
    console.log('------------------------------------');
    
    console.log('Your dashboard shows:');
    console.log('• 50 trades total');
    console.log('• 100% win rate');  
    console.log('• $1,070.37 profit');
    console.log('• PostgreSQL database indicator');
    console.log('');
    console.log('This data is coming from somewhere. Let\'s find it...');
    
    // 7. Provide investigation commands
    console.log('\n7. 🔍 INVESTIGATION COMMANDS');
    console.log('----------------------------');
    
    console.log('Run these commands to find the source:');
    console.log('');
    console.log('# Search for 100% win rate in all files:');
    console.log('grep -r "100%" . --include="*.js" --include="*.json"');
    console.log('');
    console.log('# Search for the specific profit amount:');
    console.log('grep -r "1070" . --include="*.js" --include="*.json"'); 
    console.log('grep -r "1,070" . --include="*.js" --include="*.json"');
    console.log('');
    console.log('# Search for 50 trades:');
    console.log('grep -r "\\"50\\"" . --include="*.js" --include="*.json"');
    console.log('');
    console.log('# Find all trading-related endpoints:');
    console.log('grep -r "api.*trad" . --include="*.js"');
    console.log('grep -r "trades" . --include="*.js" | head -20');
    
    console.log('\n=====================================');
    console.log('🎯 INVESTIGATION COMPLETE');
    console.log('=====================================');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Run the grep commands above to find hardcoded data');
    console.log('2. Check if you have multiple servers running');
    console.log('3. Verify which database your dashboard connects to');
    console.log('4. Look for demo/simulation mode settings');
}

findTradingDisconnect().catch(console.error);