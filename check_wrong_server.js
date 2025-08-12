// check_server.js - Check what's in the root server.js file
import fs from 'fs';

function checkServerFiles() {
    console.log('🔍 CHECKING SERVER FILES');
    console.log('========================');
    
    // Check root server.js
    console.log('\n1. 📄 CHECKING ROOT server.js');
    console.log('-----------------------------');
    
    if (fs.existsSync('server.js')) {
        console.log('✅ Found server.js in root');
        
        try {
            const content = fs.readFileSync('server.js', 'utf8');
            
            // Check for suspicious patterns
            const suspiciousPatterns = [
                '100%',
                'winRate.*100',
                '1070',
                'mock',
                'demo',
                'fake',
                'simulat',
                'totalTrades.*50'
            ];
            
            console.log('\n🔍 Scanning for suspicious patterns:');
            suspiciousPatterns.forEach(pattern => {
                const regex = new RegExp(pattern, 'gi');
                const matches = content.match(regex);
                if (matches) {
                    console.log(`   ⚠️ Found "${pattern}": ${matches.length} occurrence(s)`);
                    
                    // Show context
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (regex.test(line)) {
                            console.log(`      Line ${index + 1}: ${line.trim()}`);
                        }
                    });
                }
            });
            
            // Check what port it runs on
            const portMatch = content.match(/port.*(\d{4})/i);
            if (portMatch) {
                console.log(`\n📍 Root server.js runs on port: ${portMatch[1]}`);
            }
            
            // Check if it has trading endpoints
            if (content.includes('/api/stats') || content.includes('/api/trading')) {
                console.log('🎯 Contains trading API endpoints');
            }
            
        } catch (error) {
            console.log(`❌ Could not read server.js: ${error.message}`);
        }
    } else {
        console.log('❌ No server.js found in root');
    }
    
    // Check enhanced server
    console.log('\n2. 📄 CHECKING server/enhanced-server.js');
    console.log('----------------------------------------');
    
    if (fs.existsSync('server/enhanced-server.js')) {
        console.log('✅ Found server/enhanced-server.js');
        
        try {
            const content = fs.readFileSync('server/enhanced-server.js', 'utf8');
            
            // Check what it imports
            const imports = content.match(/import.*from.*['\"].*['\"];?/g);
            if (imports) {
                console.log('\n📦 Imports:');
                imports.slice(0, 10).forEach(imp => {
                    console.log(`   ${imp}`);
                    
                    // Check if it imports your exchange service
                    if (imp.includes('exchangeService') || imp.includes('mlTradingEngine')) {
                        console.log('      🎯 This imports your REAL trading system!');
                    }
                });
            }
            
            // Check what port it runs on
            const portMatch = content.match(/port.*(\d{4})/i);
            if (portMatch) {
                console.log(`\n📍 Enhanced server runs on port: ${portMatch[1]}`);
            }
            
            // Check for real vs fake patterns
            if (content.includes('exchangeService') || content.includes('ccxtIntegration')) {
                console.log('✅ Contains REAL exchange integration!');
            }
            
            if (content.includes('mock') || content.includes('demo') || content.includes('fake')) {
                console.log('⚠️  Also contains some mock/demo code');
            }
            
        } catch (error) {
            console.log(`❌ Could not read server/enhanced-server.js: ${error.message}`);
        }
    } else {
        console.log('❌ No server/enhanced-server.js found');
    }
    
    // Check what's running and on what port
    console.log('\n3. 🔍 WHICH SERVER SHOULD YOU USE?');
    console.log('----------------------------------');
    
    console.log('Based on your package.json scripts:');
    console.log('   "start": "node server/enhanced-server.js"');
    console.log('   "server": "node server/enhanced-server.js"');
    console.log('');
    console.log('✅ You should be running: server/enhanced-server.js');
    console.log('❌ You might be running: server.js (wrong one!)');
    
    console.log('\n4. 🎯 RECOMMENDED ACTIONS');
    console.log('-------------------------');
    console.log('1. Stop all Node processes: Get-Process node | Stop-Process -Force');
    console.log('2. Start the correct server: npm run start');
    console.log('3. Or directly: node server/enhanced-server.js');
    console.log('4. Check your dashboard shows realistic results (some losses)');
    console.log('5. If still showing 100% win rate, check what port your dashboard connects to');
}

checkServerFiles();