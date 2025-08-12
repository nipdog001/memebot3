// debug_price_cache.js - See exactly what's in the price cache
import 'dotenv/config';
import exchangeService from './server/services/exchangeService.js';
import ccxtIntegration from './server/services/ccxtIntegration.js';

async function debugPriceCache() {
    console.log('🔍 DEBUGGING PRICE CACHE CONTENTS');
    console.log('=================================');
    
    try {
        // Initialize if needed
        if (!exchangeService.initialized) {
            await exchangeService.initialize();
        }
        
        // Check what's actually in the cache
        console.log('\n1. 💾 CURRENT CACHE CONTENTS');
        console.log('----------------------------');
        console.log(`Cache size: ${exchangeService.realDataCache.size} entries`);
        
        if (exchangeService.realDataCache.size > 0) {
            console.log('\n📊 Cache entries:');
            for (const [key, data] of exchangeService.realDataCache) {
                const age = (Date.now() - data.timestamp) / 1000;
                console.log(`   ${key}: $${data.price?.toFixed(6)} (${age.toFixed(1)}s old)`);
            }
        } else {
            console.log('❌ Cache is empty!');
        }
        
        // Check what symbols are available on each exchange
        console.log('\n2. 📈 AVAILABLE SYMBOLS PER EXCHANGE');
        console.log('------------------------------------');
        
        const connectionStatus = ccxtIntegration.getConnectionStatus();
        const memeCoins = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT'];
        
        for (const [exchangeId, status] of Object.entries(connectionStatus.exchanges)) {
            if (status.connected) {
                console.log(`\n🔌 ${exchangeId.toUpperCase()}:`);
                const availableSymbols = ccxtIntegration.getAvailableSymbols(exchangeId);
                console.log(`   Total symbols: ${availableSymbols.length}`);
                
                // Check which meme coins are available
                const availableMemeCoins = memeCoins.filter(symbol => 
                    availableSymbols.includes(symbol)
                );
                
                if (availableMemeCoins.length > 0) {
                    console.log(`   Meme coins: ${availableMemeCoins.join(', ')}`);
                } else {
                    console.log('   No meme coins found');
                    // Show first 10 available symbols as examples
                    console.log(`   Examples: ${availableSymbols.slice(0, 10).join(', ')}`);
                }
            }
        }
        
        // Find common symbols across exchanges
        console.log('\n3. 🎯 FINDING COMMON SYMBOLS');
        console.log('-----------------------------');
        
        const symbolsByExchange = {};
        for (const [exchangeId, status] of Object.entries(connectionStatus.exchanges)) {
            if (status.connected) {
                symbolsByExchange[exchangeId] = new Set(ccxtIntegration.getAvailableSymbols(exchangeId));
            }
        }
        
        // Find symbols available on at least 2 exchanges
        const allSymbols = new Set();
        Object.values(symbolsByExchange).forEach(symbols => {
            symbols.forEach(symbol => allSymbols.add(symbol));
        });
        
        const commonSymbols = [];
        for (const symbol of allSymbols) {
            const exchangesWithSymbol = Object.entries(symbolsByExchange)
                .filter(([_, symbols]) => symbols.has(symbol))
                .map(([exchange, _]) => exchange);
            
            if (exchangesWithSymbol.length >= 2) {
                commonSymbols.push({ symbol, exchanges: exchangesWithSymbol });
            }
        }
        
        console.log(`Found ${commonSymbols.length} symbols available on 2+ exchanges`);
        
        // Show top meme coins that are tradeable
        const tradeableMemeCoins = commonSymbols.filter(({symbol}) => 
            memeCoins.includes(symbol)
        );
        
        if (tradeableMemeCoins.length > 0) {
            console.log('\n✅ TRADEABLE MEME COINS:');
            tradeableMemeCoins.forEach(({symbol, exchanges}) => {
                console.log(`   ${symbol}: Available on ${exchanges.join(', ')}`);
            });
        } else {
            console.log('\n⚠️ No meme coins available on multiple exchanges');
            console.log('🔍 Checking major coins instead...');
            
            const majorCoins = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];
            const tradeableMajorCoins = commonSymbols.filter(({symbol}) => 
                majorCoins.includes(symbol)
            );
            
            console.log('\n✅ TRADEABLE MAJOR COINS:');
            tradeableMajorCoins.slice(0, 5).forEach(({symbol, exchanges}) => {
                console.log(`   ${symbol}: Available on ${exchanges.join(', ')}`);
            });
        }
        
        // Test fetching prices for a few common symbols
        console.log('\n4. 🧪 TESTING PRICE FETCHING');
        console.log('-----------------------------');
        
        const testSymbols = tradeableMemeCoins.length > 0 ? 
            tradeableMemeCoins.slice(0, 3).map(x => x.symbol) :
            commonSymbols.slice(0, 3).map(x => x.symbol);
        
        console.log(`Testing price fetches for: ${testSymbols.join(', ')}`);
        
        for (const symbol of testSymbols) {
            console.log(`\n🔍 Testing ${symbol}:`);
            
            const symbolData = commonSymbols.find(x => x.symbol === symbol);
            const availableExchanges = symbolData.exchanges;
            
            for (const exchangeId of availableExchanges.slice(0, 2)) { // Test first 2 exchanges
                try {
                    const ticker = await ccxtIntegration.fetchRealTicker(exchangeId, symbol, 1);
                    if (ticker && ticker.price > 0) {
                        console.log(`   ✅ ${exchangeId}: $${ticker.price.toFixed(6)}`);
                    } else {
                        console.log(`   ❌ ${exchangeId}: No valid price data`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${exchangeId}: ${error.message}`);
                }
            }
        }
        
        // Now populate cache with these working symbols
        console.log('\n5. 🔄 POPULATING CACHE WITH WORKING SYMBOLS');
        console.log('-------------------------------------------');
        
        // Force update with specific symbols
        await exchangeService.updateRealTimePrices();
        
        console.log(`\n📊 Cache after update: ${exchangeService.realDataCache.size} entries`);
        
        // Test arbitrage with a working symbol
        if (testSymbols.length > 0) {
            console.log('\n6. 💰 TESTING ARBITRAGE WITH WORKING SYMBOL');
            console.log('--------------------------------------------');
            
            for (const symbol of testSymbols.slice(0, 1)) { // Test just the first one
                console.log(`\n🔍 Testing arbitrage for ${symbol}...`);
                
                try {
                    const opportunities = await exchangeService.findArbitrageOpportunities(symbol, 100);
                    
                    if (opportunities.length > 0) {
                        console.log(`🎯 SUCCESS! Found ${opportunities.length} opportunities`);
                        const best = opportunities[0];
                        console.log(`🏆 Best: ${best.buyExchange} → ${best.sellExchange}`);
                        console.log(`💰 Profit: $${best.netProfit.toFixed(2)} (${best.profitPercent.toFixed(3)}%)`);
                        console.log(`📊 Data: ${best.isRealArbitrage ? 'VERIFIED REAL' : 'MIXED'}`);
                        break;
                    } else {
                        console.log('📭 No opportunities (market efficient)');
                    }
                } catch (error) {
                    console.log(`❌ Error: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('\n=================================');
    console.log('🎯 PRICE CACHE DEBUG COMPLETE');
    console.log('=================================');
}

debugPriceCache().catch(console.error);