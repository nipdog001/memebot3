// quick_test.js - Quick verification script for your ML trading system
import exchangeService from './server/services/exchangeService.js';
import realDataTracker from './server/services/realDataTracker.js';
import mlTradingEngine from './server/services/mlTradingEngine.js';

async function quickSystemTest() {
    console.log('🤖 QUICK ML SYSTEM TEST - Real Data Verification');
    console.log('='.repeat(55));
    
    let score = 0;
    
    try {
        // Test 1: Check if system enforces real data
        console.log('\n1. 🛡️ CHECKING REAL DATA ENFORCEMENT');
        console.log('-'.repeat(35));
        
        if (exchangeService.enforceRealDataOnly) {
            score += 25;
            console.log('✅ Real Data Enforcement: ENABLED (+25 points)');
        } else {
            console.log('❌ Real Data Enforcement: DISABLED (+0 points)');
        }
        
        // Test 2: Initialize and validate connections
        console.log('\n2. 🔌 INITIALIZING EXCHANGE CONNECTIONS');
        console.log('-'.repeat(35));
        
        await exchangeService.initialize();
        
        if (exchangeService.initialized) {
            score += 20;
            console.log('✅ Exchange Service: Initialized (+20 points)');
            
            if (exchangeService.realDataValidated) {
                score += 15;
                console.log('✅ Real Data: VALIDATED (+15 points)');
            } else {
                console.log('❌ Real Data: NOT VALIDATED (+0 points)');
            }
        } else {
            console.log('❌ Exchange Service: Failed to initialize (+0 points)');
        }
        
        // Test 3: Check data source statistics
        console.log('\n3. 📊 CHECKING DATA SOURCES');
        console.log('-'.repeat(25));
        
        const dataStats = exchangeService.getDataSourceStats();
        console.log(`📈 Real Data Percentage: ${dataStats.realDataPercentage}%`);
        console.log(`🔌 Validated Exchanges: ${dataStats.validatedExchanges.join(', ')}`);
        console.log(`📊 Total Price Points: ${dataStats.totalPrices}`);
        console.log(`⭐ Data Quality Score: ${dataStats.dataQualityScore}/100`);
        
        if (dataStats.realDataPercentage === '100') {
            score += 20;
            console.log('✅ Data Quality: 100% REAL DATA (+20 points)');
        } else if (dataStats.realDataPercentage >= '80') {
            score += 15;
            console.log(`✅ Data Quality: ${dataStats.realDataPercentage}% real data (+15 points)`);
        } else {
            console.log(`⚠️ Data Quality: Only ${dataStats.realDataPercentage}% real data`);
        }
        
        // Test 4: Test ML trading functionality
        console.log('\n4. 🧠 TESTING ML TRADING ENGINE');
        console.log('-'.repeat(30));
        
        const mlStats = mlTradingEngine.getStatistics();
        console.log(`🤖 ML Models: ${mlTradingEngine.models.length} configured`);
        console.log(`🎯 Confidence Threshold: ${mlTradingEngine.confidenceThreshold}%`);
        console.log(`📊 Total Trades: ${mlStats.totalTrades}`);
        console.log(`📈 Real Data Trades: ${mlStats.realDataTrades}`);
        
        if (mlTradingEngine.models.length >= 5) {
            score += 10;
            console.log('✅ ML Models: Multiple models configured (+10 points)');
        } else {
            console.log('⚠️ ML Models: Limited model configuration');
        }
        
        // Test 5: Quick arbitrage test
        console.log('\n5. 💰 TESTING ARBITRAGE DETECTION');
        console.log('-'.repeat(32));
        
        if (exchangeService.realDataValidated) {
            try {
                const opportunities = await exchangeService.findArbitrageOpportunities('DOGE/USDT', 100);
                
                if (opportunities && Array.isArray(opportunities)) {
                    score += 10;
                    console.log(`✅ Arbitrage Detection: Working (${opportunities.length} opportunities) (+10 points)`);
                    
                    if (opportunities.length > 0) {
                        const best = opportunities[0];
                        console.log(`🏆 Best: ${best.buyExchange} → ${best.sellExchange}`);
                        console.log(`💰 Profit: $${best.netProfit.toFixed(2)} (${best.profitPercent.toFixed(3)}%)`);
                        console.log(`📊 Data: ${best.isRealArbitrage ? 'VERIFIED REAL' : 'MIXED'}`);
                    } else {
                        console.log('📭 No opportunities (market efficient)');
                    }
                } else {
                    console.log('❌ Arbitrage Detection: Failed');
                }
            } catch (error) {
                console.log(`❌ Arbitrage Test Error: ${error.message}`);
            }
        } else {
            console.log('⚠️ Skipping arbitrage test (no validated real data)');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    // Final Results
    console.log('\n' + '='.repeat(55));
    console.log('🎯 QUICK TEST RESULTS');
    console.log('='.repeat(55));
    console.log(`📊 SCORE: ${score}/100`);
    
    if (score >= 85) {
        console.log('🚀 VERDICT: EXCELLENT - ML system using real data!');
        console.log('✅ Ready for production deployment');
    } else if (score >= 70) {
        console.log('✅ VERDICT: GOOD - System mostly functional');
        console.log('⚠️ Minor improvements recommended');
    } else if (score >= 50) {
        console.log('⚠️ VERDICT: NEEDS WORK - Some issues detected');
        console.log('🔧 Address configuration problems');
    } else {
        console.log('❌ VERDICT: CRITICAL ISSUES - Major problems');
        console.log('🚨 System overhaul required');
    }
    
    console.log('\n💡 NEXT STEPS:');
    if (score >= 85) {
        console.log('  1. 🚀 System is ready for production!');
        console.log('  2. 📊 Start with small position sizes');
        console.log('  3. 📈 Monitor ML performance daily');
    } else {
        console.log('  1. 🔧 Check API keys and exchange connections');
        console.log('  2. 🤖 Verify ML model configuration');
        console.log('  3. 📊 Ensure real data validation is working');
    }
    
    console.log('\n✅ Quick test complete!');
    return score;
}

// Run the test
quickSystemTest().catch(console.error);