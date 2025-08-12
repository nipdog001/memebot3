// diagnose.js - Run this immediately to check your production setup
import dotenv from 'dotenv';
import ccxt from 'ccxt';

dotenv.config();

console.log('\n🔍 PRODUCTION DIAGNOSTICS - MEME COIN TRADING BOT');
console.log('=================================================\n');

// 1. Environment Check
console.log('1️⃣ ENVIRONMENT VARIABLES CHECK:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'} ${process.env.NODE_ENV === 'production' ? '✅' : '❌ CRITICAL: Must be "production"'}`);
console.log(`   Port: ${process.env.PORT || 'NOT SET'}`);

// 2. API Keys Check
console.log('\n2️⃣ API KEYS STATUS:');
const exchanges = [
    { name: 'Coinbase', keyVar: 'COINBASE_API_KEY', secretVar: 'COINBASE_API_SECRET', extra: 'COINBASE_PASSPHRASE' },
    { name: 'Kraken', keyVar: 'KRAKEN_API_KEY', secretVar: 'KRAKEN_API_SECRET' },
    { name: 'Binance.US', keyVar: 'BINANCEUS_API_KEY', secretVar: 'BINANCEUS_API_SECRET' },
    { name: 'Crypto.com', keyVar: 'CRYPTOCOM_API_KEY', secretVar: 'CRYPTOCOM_API_SECRET' }
];

let hasAnyKeys = false;
exchanges.forEach(ex => {
    const hasKey = !!process.env[ex.keyVar];
    const hasSecret = !!process.env[ex.secretVar];
    const hasExtra = ex.extra ? !!process.env[ex.extra] : true;
    const isComplete = hasKey && hasSecret && hasExtra;
    
    if (isComplete) hasAnyKeys = true;
    
    console.log(`   ${ex.name}: ${isComplete ? '✅ Complete' : '❌ Missing'}`);
    if (!isComplete) {
        if (!hasKey) console.log(`      - Missing: ${ex.keyVar}`);
        if (!hasSecret) console.log(`      - Missing: ${ex.secretVar}`);
        if (ex.extra && !hasExtra) console.log(`      - Missing: ${ex.extra}`);
    }
});

// 3. Quick Exchange Connection Test
console.log('\n3️⃣ TESTING REAL EXCHANGE CONNECTIONS:');

async function testExchange(exchangeId, ExchangeClass, credentials) {
    try {
        console.log(`\n   Testing ${exchangeId}...`);
        
        // Check if credentials exist
        if (!credentials.apiKey || !credentials.secret) {
            console.log(`   ❌ ${exchangeId}: No API credentials`);
            return false;
        }
        
        // Create exchange instance
        const exchange = new ExchangeClass({
            ...credentials,
            enableRateLimit: true,
            timeout: 10000,
            // CRITICAL: Force production mode
            sandbox: false,
            test: false
        });
        
        // Log exchange mode
        console.log(`   - Sandbox mode: ${exchange.urls.test ? 'YES ⚠️' : 'NO ✅'}`);
        
        // Try to load markets
        const markets = await exchange.loadMarkets();
        console.log(`   ✅ ${exchangeId}: Connected! (${Object.keys(markets).length} markets)`);
        
        // Try to fetch a real ticker
        try {
            const ticker = await exchange.fetchTicker('BTC/USDT');
            console.log(`   - BTC Price: $${ticker.last.toFixed(2)} (REAL DATA ✅)`);
            return true;
        } catch (e) {
            console.log(`   - Ticker fetch failed: ${e.message}`);
        }
        
    } catch (error) {
        console.log(`   ❌ ${exchangeId}: ${error.message}`);
        return false;
    }
}

// Test each exchange
let connectedCount = 0;

if (process.env.COINBASE_API_KEY) {
    const connected = await testExchange('coinbase', ccxt.coinbasepro, {
        apiKey: process.env.COINBASE_API_KEY,
        secret: process.env.COINBASE_API_SECRET,
        password: process.env.COINBASE_PASSPHRASE
    });
    if (connected) connectedCount++;
}

if (process.env.KRAKEN_API_KEY) {
    const connected = await testExchange('kraken', ccxt.kraken, {
        apiKey: process.env.KRAKEN_API_KEY,
        secret: process.env.KRAKEN_API_SECRET
    });
    if (connected) connectedCount++;
}

if (process.env.BINANCEUS_API_KEY) {
    const connected = await testExchange('binanceus', ccxt.binanceus, {
        apiKey: process.env.BINANCEUS_API_KEY,
        secret: process.env.BINANCEUS_API_SECRET
    });
    if (connected) connectedCount++;
}

// 4. Final Diagnosis
console.log('\n4️⃣ DIAGNOSIS SUMMARY:');
console.log('====================');

const issues = [];

if (process.env.NODE_ENV !== 'production') {
    issues.push('❌ NODE_ENV is not set to "production" - THIS IS CRITICAL!');
}

if (!hasAnyKeys) {
    issues.push('❌ No API keys found - system will use simulated data');
}

if (connectedCount === 0 && hasAnyKeys) {
    issues.push('❌ Have API keys but no successful connections - check credentials');
}

if (issues.length === 0) {
    console.log('✅ System configured correctly for REAL trading!');
    console.log(`✅ Connected to ${connectedCount} real exchanges`);
    console.log('✅ Should be using REAL market data');
} else {
    console.log('⚠️ ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n📋 TO FIX:');
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('   1. Set NODE_ENV=production in Railway:');
        console.log('      railway variables set NODE_ENV=production');
    }
    
    if (!hasAnyKeys) {
        console.log('   2. Add your API keys to Railway:');
        console.log('      railway variables set COINBASE_API_KEY=your_key');
        console.log('      railway variables set COINBASE_API_SECRET=your_secret');
        console.log('      (repeat for all exchanges)');
    }
}

console.log('\n5️⃣ CHECKING CODE FOR SIMULATION OVERRIDES:');

// Check for common code issues
import { readFileSync } from 'fs';

try {
    // Check exchangeService.js
    const exchangeServiceCode = readFileSync('./server/services/exchangeService.js', 'utf8');
    
    if (exchangeServiceCode.includes('enforceRealDataOnly = false')) {
        console.log('   ⚠️ exchangeService.js has enforceRealDataOnly = false');
    }
    
    if (exchangeServiceCode.includes('paperTradingEnabled = true')) {
        console.log('   ✅ Paper trading is enabled (good for safety)');
    }
    
    // Check for hardcoded simulation
    if (exchangeServiceCode.includes('return this.generateSimulatedPrice')) {
        console.log('   ⚠️ Found simulated price generation code active');
    }
    
} catch (e) {
    console.log('   Could not read service files');
}

console.log('\n✨ Run this on Railway with: railway run node diagnose.js');
process.exit(0);