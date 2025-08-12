// quick_arbitrage_fix.js - Get arbitrage detection working immediately
import 'dotenv/config';
import exchangeService from './server/services/exchangeService.js';

async function quickArbitrageFix() {
    console.log('🔧 QUICK ARBITRAGE FIX');
    console.log('======================');
    
    try {
        // Step 1: Initialize if not already done
        if (!exchangeService.initialized) {
            console.log('🔄 Initializing exchange service...');
            await exchangeService.initialize();
        }
        
        console.log(`✅ Service initialized: ${exchangeService.initialized}`);
        console.log(`✅ Real data validated: ${exchangeService.realDataValidated}`);
        
        // Step 2: Force price updates to populate cache
        console.log('\n🔄 FORCING PRICE UPDATES...');
        console.log('---------------------------');
        
        if (exchangeService.realDataValidated) {
            // Manual price update to populate cache
            await exchangeService.updateRealTimePrices();
            console.log(`📊 Cache populated: ${exchangeService.realDataCache.size} price points`);
            
            // Wait a moment for data to settle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start the automatic updates if not running
            if (!exchangeService.priceUpdateInterval) {
                exchangeService.startRealDataUpdates();
                console.log('✅ Started automatic price updates');
            }
            
            // Step 3: Test arbitrage detection
            console.log('\n💰 TESTING ARBITRAGE DETECTION');
            console.log('------------------------------');
            
            const testSymbols = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT'];
            
            for (const symbol of testSymbols) {
                console.log(`\n🔍 Checking ${symbol} arbitrage...`);
                
                try {
                    const opportunities = await exchangeService.findArbitrageOpportunities(symbol, 100);
                    
                    if (opportunities.length > 0) {
                        console.log(`🎯 Found ${opportunities.length} opportunities!`);
                        
                        // Show best opportunity
                        const best = opportunities[0];
                        console.log(`🏆 BEST OPPORTUNITY:`);
                        console.log(`   Symbol: ${best.symbol}`);
                        console.log(`   Buy: ${best.buyExchange} @ $${best.buyPrice.toFixed(6)}`);
                        console.log(`   Sell: ${best.sellExchange} @ $${best.sellPrice.toFixed(6)}`);
                        console.log(`   Profit: $${best.netProfit.toFixed(2)} (${best.profitPercent.toFixed(3)}%)`);
                        console.log(`   Data: ${best.isRealArbitrage ? '✅ VERIFIED REAL' : '⚠️ MIXED'}`);
                        console.log(`   Validation: ${best.validation ? '✅ PASSED' : '❌ FAILED'}`);
                        
                        // Test paper trade execution
                        console.log('\n🧪 TESTING PAPER TRADE EXECUTION...');
                        try {
                            const trade = await exchangeService.executePaperTrade(best);
                            if (trade) {
                                console.log(`✅ PAPER TRADE EXECUTED:`);
                                console.log(`   Trade ID: ${trade.id}`);
                                console.log(`   Actual Profit: $${trade.actualProfit.toFixed(2)}`);
                                console.log(`   ML Confidence: ${(trade.mlConfidence * 100).toFixed(1)}%`);
                                console.log(`   Success: ${trade.executionSuccess ? '✅ YES' : '❌ NO'}`);
                                console.log(`   Data Source: ${trade.dataSource}`);
                            }
                        } catch (tradeError) {
                            console.log(`❌ Paper trade failed: ${tradeError.message}`);
                        }
                        
                        break; // Stop after first successful test
                        
                    } else {
                        console.log('📭 No opportunities found (market efficient)');
                    }
                    
                } catch (error) {
                    console.log(`❌ Error with ${symbol}: ${error.message}`);
                    
                    // If we still get the "no validated real data" error, 
                    // there might be a state persistence issue
                    if (error.message.includes('no validated real data')) {
                        console.log('🔄 Re-validating real data connections...');
                        exchangeService.realDataValidated = await exchangeService.realDataValidated || 
                            (await import('./server/services/realDataTracker.js')).default.validateRealDataConnections();
                        console.log(`✅ Re-validation result: ${exchangeService.realDataValidated}`);
                    }
                }
            }
            
        } else {
            console.log('❌ Real data validation failed - cannot test arbitrage');
        }
        
        // Step 4: Show current system status
        console.log('\n📊 FINAL SYSTEM STATUS');
        console.log('----------------------');
        const dataStats = exchangeService.getDataSourceStats();
        console.log(`✅ Validated Exchanges: ${dataStats.validatedExchanges.length}`);
        console.log(`✅ Real Data Percentage: ${dataStats.realDataPercentage}%`);
        console.log(`✅ Price Cache Size: ${dataStats.totalPrices}`);
        console.log(`✅ Quality Score: ${dataStats.dataQualityScore}/100`);
        
    } catch (error) {
        console.error('❌ Quick fix failed:', error);
        
        // Additional debugging info
        console.log('\n🔍 DEBUG INFO:');
        console.log(`Service State: initialized=${exchangeService.initialized}, validated=${exchangeService.realDataValidated}`);
        console.log(`Cache Size: ${exchangeService.realDataCache?.size || 0}`);
        console.log(`Update Interval: ${exchangeService.priceUpdateInterval ? 'Running' : 'Stopped'}`);
    }
    
    console.log('\n======================');
    console.log('🎯 QUICK FIX COMPLETE');
    console.log('======================');
}

// Run the fix
quickArbitrageFix().catch(console.error);