// debug_exchange_state.js - Debug why arbitrage detection isn't working
import 'dotenv/config';
import exchangeService from './server/services/exchangeService.js';

async function debugExchangeState() {
    console.log('🔍 DEBUGGING EXCHANGE SERVICE STATE');
    console.log('==================================');
    
    try {
        // Check 1: Service initialization state
        console.log('\n1. 📊 SERVICE STATE CHECK');
        console.log('-------------------------');
        console.log(`✅ Initialized: ${exchangeService.initialized}`);
        console.log(`✅ Real Data Validated: ${exchangeService.realDataValidated}`);
        console.log(`✅ Paper Trading Enabled: ${exchangeService.paperTradingEnabled}`);
        console.log(`✅ Enforce Real Data Only: ${exchangeService.enforceRealDataOnly}`);
        
        // Check 2: Real data cache status
        console.log('\n2. 💾 REAL DATA CACHE STATUS');
        console.log('----------------------------');
        console.log(`📊 Cache Size: ${exchangeService.realDataCache.size} price points`);
        
        if (exchangeService.realDataCache.size > 0) {
            console.log('📈 Recent Cache Entries:');
            let count = 0;
            for (const [key, data] of exchangeService.realDataCache) {
                if (count < 5) { // Show first 5 entries
                    const age = (Date.now() - data.timestamp) / 1000;
                    console.log(`   • ${key}: $${data.price?.toFixed(6)} (${age.toFixed(1)}s old)`);
                    count++;
                }
            }
        } else {
            console.log('❌ Cache is empty - this is the problem!');
        }
        
        // Check 3: Price update interval status
        console.log('\n3. 🔄 PRICE UPDATE STATUS');
        console.log('-------------------------');
        const intervalRunning = exchangeService.priceUpdateInterval !== null;
        console.log(`✅ Update Interval Running: ${intervalRunning}`);
        
        if (!intervalRunning) {
            console.log('❌ Price update interval not running!');
            console.log('🔧 Attempting to start price updates...');
            
            if (exchangeService.realDataValidated) {
                exchangeService.startRealDataUpdates();
                console.log('✅ Started real data updates');
            } else {
                console.log('❌ Cannot start updates - real data not validated');
            }
        }
        
        // Check 4: Manual price update test
        console.log('\n4. 🧪 MANUAL PRICE UPDATE TEST');
        console.log('------------------------------');
        
        if (!exchangeService.initialized) {
            console.log('🔄 Initializing exchange service...');
            await exchangeService.initialize();
        }
        
        if (exchangeService.realDataValidated) {
            console.log('🔄 Manually updating prices...');
            await exchangeService.updateRealTimePrices();
            
            // Check cache again after manual update
            console.log(`📊 Cache Size After Update: ${exchangeService.realDataCache.size}`);
            
            if (exchangeService.realDataCache.size > 0) {
                console.log('✅ Cache now has data!');
                
                // Now try to find arbitrage opportunities
                console.log('\n5. 💰 TESTING ARBITRAGE DETECTION');
                console.log('---------------------------------');
                
                const symbols = ['DOGE/USDT', 'SHIB/USDT', 'BTC/USDT'];
                
                for (const symbol of symbols) {
                    console.log(`\n🔍 Testing ${symbol}...`);
                    
                    try {
                        const opportunities = await exchangeService.findArbitrageOpportunities(symbol, 100);
                        console.log(`📊 Found ${opportunities.length} opportunities for ${symbol}`);
                        
                        if (opportunities.length > 0) {
                            const best = opportunities[0];
                            console.log(`🏆 Best: ${best.buyExchange} → ${best.sellExchange}`);
                            console.log(`💰 Profit: $${best.netProfit.toFixed(2)} (${best.profitPercent.toFixed(3)}%)`);
                            console.log(`📊 Data: ${best.isRealArbitrage ? 'VERIFIED REAL' : 'MIXED'}`);
                            console.log(`⏰ Age: ${((Date.now() - best.timestamp) / 1000).toFixed(1)}s`);
                        } else {
                            console.log('📭 No profitable opportunities (market efficient)');
                        }
                    } catch (error) {
                        console.log(`❌ Error testing ${symbol}: ${error.message}`);
                    }
                }
            } else {
                console.log('❌ Cache still empty after manual update');
                
                // Debug: Check exchange status
                const exchangeStatus = await exchangeService.getExchangeStatus();
                console.log('\n🔍 EXCHANGE STATUS DETAILS:');
                Object.entries(exchangeStatus).forEach(([id, status]) => {
                    console.log(`   ${status.connected ? '✅' : '❌'} ${id}: ${status.connected ? 'Connected' : 'Failed'}`);
                    if (status.error) console.log(`      Error: ${status.error}`);
                });
            }
        } else {
            console.log('❌ Real data validation failed');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('\n==================================');
    console.log('🎯 DEBUG COMPLETE');
    console.log('==================================');
}

// Auto-run if called directly
debugExchangeState().catch(console.error);