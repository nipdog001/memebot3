// verify_ml_real_data.js - Comprehensive verification for Node.js ML trading system
import exchangeService from './server/services/exchangeService.js';
import realDataTracker from './server/services/realDataTracker.js';
import mlTradingEngine from './server/services/mlTradingEngine.js';
import ccxtIntegration from './server/services/ccxtIntegration.js';

class MLSystemVerifier {
    constructor() {
        this.verificationResults = {
            score: 0,
            maxScore: 100,
            checks: {},
            verdict: '',
            issues: [],
            recommendations: []
        };
    }

    async runCompleteVerification() {
        console.log('🤖 MEME COIN TRADING AI - COMPREHENSIVE ML VERIFICATION');
        console.log('='.repeat(65));
        console.log('Verifying ML models use REAL exchange data for paper trading...\n');

        try {
            // 1. Verify CCXT Integration (25 points)
            await this.verifyCCXTIntegration();
            
            // 2. Verify Real Data Enforcement (25 points)
            await this.verifyRealDataEnforcement();
            
            // 3. Verify ML Trading Engine (25 points) 
            await this.verifyMLTradingEngine();
            
            // 4. Verify Paper Trading with Real Data (25 points)
            await this.verifyPaperTradingRealData();
            
            // Generate final verdict
            this.generateFinalVerdict();
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            this.verificationResults.issues.push(`Critical error: ${error.message}`);
        }

        return this.verificationResults;
    }

    async verifyCCXTIntegration() {
        console.log('1. 🔌 VERIFYING CCXT EXCHANGE INTEGRATION');
        console.log('-'.repeat(45));
        
        let points = 0;

        try {
            // Check if CCXT integration is initialized
            const connectionStatus = ccxtIntegration.getConnectionStatus();
            
            console.log(`📊 CCXT Status: ${connectionStatus.isInitialized ? 'Initialized' : 'Not Initialized'}`);
            console.log(`📊 Connected Exchanges: ${connectionStatus.connectedCount}/${connectionStatus.totalExchanges}`);
            
            if (connectionStatus.isInitialized) {
                points += 10;
                console.log('✅ CCXT Integration: Initialized (+10 points)');
            } else {
                console.log('❌ CCXT Integration: Not initialized (+0 points)');
                this.verificationResults.issues.push('CCXT integration not initialized');
            }

            // Check individual exchange connections
            for (const [exchangeId, status] of Object.entries(connectionStatus.exchanges)) {
                const statusIcon = status.connected ? '✅' : '❌';
                const apiKeyStatus = status.hasApiKeys ? 'API Keys Set' : 'No API Keys';
                console.log(`${statusIcon} ${exchangeId}: ${status.connected ? 'Connected' : 'Failed'} (${apiKeyStatus})`);
                
                if (status.connected && status.hasApiKeys) {
                    points += 3; // 3 points per real connection
                }
                
                if (status.error) {
                    console.log(`   Error: ${status.error}`);
                    this.verificationResults.issues.push(`${exchangeId}: ${status.error}`);
                }
            }

            // Test real data fetching
            console.log('\n🧪 Testing Real Data Fetching...');
            if (connectionStatus.connectedCount > 0) {
                const connectedExchange = Object.entries(connectionStatus.exchanges)
                    .find(([_, status]) => status.connected)?.[0];
                
                if (connectedExchange) {
                    try {
                        const testTicker = await ccxtIntegration.fetchRealTicker(connectedExchange, 'BTC/USDT');
                        if (testTicker && testTicker.isRealData && testTicker.price > 0) {
                            points += 7;
                            console.log(`✅ Real Data Test: BTC/USDT = $${testTicker.price.toLocaleString()} (${connectedExchange})`);
                            console.log(`✅ Data Source: ${testTicker.dataSource} (+7 points)`);
                        } else {
                            console.log('❌ Real Data Test: Failed to get valid ticker data');
                            this.verificationResults.issues.push('Real data fetching failed');
                        }
                    } catch (error) {
                        console.log(`❌ Real Data Test: ${error.message}`);
                        this.verificationResults.issues.push(`Real data test failed: ${error.message}`);
                    }
                }
            }

            this.verificationResults.checks.ccxtIntegration = {
                points,
                maxPoints: 25,
                status: points >= 20 ? 'EXCELLENT' : points >= 15 ? 'GOOD' : points >= 10 ? 'FAIR' : 'POOR'
            };

        } catch (error) {
            console.log(`❌ CCXT Verification Error: ${error.message}`);
            this.verificationResults.issues.push(`CCXT verification failed: ${error.message}`);
        }

        console.log(`📊 CCXT Integration Score: ${this.verificationResults.checks.ccxtIntegration?.points || 0}/25\n`);
        this.verificationResults.score += this.verificationResults.checks.ccxtIntegration?.points || 0;
    }

    async verifyRealDataEnforcement() {
        console.log('2. 🛡️ VERIFYING REAL DATA ENFORCEMENT');
        console.log('-'.repeat(40));
        
        let points = 0;

        try {
            // Check enforceRealDataOnly setting
            if (exchangeService.enforceRealDataOnly) {
                points += 10;
                console.log('✅ Real Data Enforcement: ENABLED (+10 points)');
            } else {
                console.log('❌ Real Data Enforcement: DISABLED (+0 points)');
                this.verificationResults.issues.push('Real data enforcement is disabled');
            }

            // Check if real data validation is active
            console.log('\n🔍 Testing Real Data Validation...');
            const isValidated = await realDataTracker.validateRealDataConnections();
            
            if (isValidated) {
                points += 10;
                console.log('✅ Real Data Validation: PASSED (+10 points)');
                
                // Check exchange health status
                const healthReport = realDataTracker.getSystemHealthReport();
                const validatedExchanges = Object.entries(healthReport.exchangeHealth)
                    .filter(([_, health]) => health.status === 'REAL_DATA_CONFIRMED');
                
                console.log(`✅ Validated Exchanges: ${validatedExchanges.length}`);
                validatedExchanges.forEach(([id, health]) => {
                    console.log(`   • ${id}: ${health.sampleSymbol} = $${health.samplePrice?.toLocaleString()}`);
                });
                
                if (validatedExchanges.length >= 2) {
                    points += 5;
                    console.log('✅ Multiple Real Data Sources: Available (+5 points)');
                } else {
                    console.log('⚠️ Limited Real Data Sources: Only 1 exchange validated');
                    this.verificationResults.issues.push('Only 1 exchange validated for real data');
                }
            } else {
                console.log('❌ Real Data Validation: FAILED (+0 points)');
                this.verificationResults.issues.push('Real data validation failed');
            }

            this.verificationResults.checks.realDataEnforcement = {
                points,
                maxPoints: 25,
                status: points >= 20 ? 'EXCELLENT' : points >= 15 ? 'GOOD' : points >= 10 ? 'FAIR' : 'POOR'
            };

        } catch (error) {
            console.log(`❌ Real Data Enforcement Error: ${error.message}`);
            this.verificationResults.issues.push(`Real data enforcement check failed: ${error.message}`);
        }

        console.log(`📊 Real Data Enforcement Score: ${this.verificationResults.checks.realDataEnforcement?.points || 0}/25\n`);
        this.verificationResults.score += this.verificationResults.checks.realDataEnforcement?.points || 0;
    }

    async verifyMLTradingEngine() {
        console.log('3. 🧠 VERIFYING ML TRADING ENGINE');
        console.log('-'.repeat(35));
        
        let points = 0;

        try {
            // Check ML models configuration
            const models = mlTradingEngine.models;
            if (models && models.length >= 5) {
                points += 10;
                console.log(`✅ ML Models: ${models.length} models configured (+10 points)`);
                console.log('📋 Model List:');
                models.forEach(model => {
                    console.log(`   • ${model.name}: ${model.accuracy}% accuracy (weight: ${model.weight})`);
                });
            } else {
                console.log(`❌ ML Models: Only ${models?.length || 0} models found (+0 points)`);
                this.verificationResults.issues.push('Insufficient ML models configured');
            }

            // Check confidence threshold system
            const threshold = mlTradingEngine.confidenceThreshold;
            if (threshold >= 50 && threshold <= 95) {
                points += 5;
                console.log(`✅ Confidence Threshold: ${threshold}% (valid range) (+5 points)`);
            } else {
                console.log(`❌ Confidence Threshold: ${threshold}% (invalid range) (+0 points)`);
                this.verificationResults.issues.push(`Invalid confidence threshold: ${threshold}%`);
            }

            // Check ML statistics and data source tracking
            const stats = mlTradingEngine.getStatistics();
            console.log('\n📊 ML Engine Statistics:');
            console.log(`   Total Trades: ${stats.totalTrades}`);
            console.log(`   Real Data Trades: ${stats.realDataTrades}`);
            console.log(`   Mixed Data Trades: ${stats.mixedDataTrades}`);
            console.log(`   Win Rate: ${stats.winRate.toFixed(1)}%`);
            
            if (stats.totalTrades > 0) {
                points += 5;
                console.log('✅ ML Trading History: Found trade records (+5 points)');
                
                const realDataPercentage = (stats.realDataTrades / stats.totalTrades) * 100;
                if (realDataPercentage >= 80) {
                    points += 5;
                    console.log(`✅ Real Data Usage: ${realDataPercentage.toFixed(1)}% (+5 points)`);
                } else {
                    console.log(`⚠️ Real Data Usage: ${realDataPercentage.toFixed(1)}% (below 80%)`);
                    this.verificationResults.issues.push(`Low real data usage: ${realDataPercentage.toFixed(1)}%`);
                }
            } else {
                console.log('⚠️ ML Trading History: No trades found');
                this.verificationResults.recommendations.push('Run ML trading to generate trade history');
            }

            this.verificationResults.checks.mlTradingEngine = {
                points,
                maxPoints: 25,
                status: points >= 20 ? 'EXCELLENT' : points >= 15 ? 'GOOD' : points >= 10 ? 'FAIR' : 'POOR'
            };

        } catch (error) {
            console.log(`❌ ML Trading Engine Error: ${error.message}`);
            this.verificationResults.issues.push(`ML trading engine check failed: ${error.message}`);
        }

        console.log(`📊 ML Trading Engine Score: ${this.verificationResults.checks.mlTradingEngine?.points || 0}/25\n`);
        this.verificationResults.score += this.verificationResults.checks.mlTradingEngine?.points || 0;
    }

    async verifyPaperTradingRealData() {
        console.log('4. 📈 VERIFYING PAPER TRADING WITH REAL DATA');
        console.log('-'.repeat(45));
        
        let points = 0;

        try {
            // Test arbitrage opportunity detection with real data
            console.log('🔍 Testing Arbitrage Detection with Real Data...');
            
            const testSymbol = 'DOGE/USDT';
            const testAmount = 100;
            
            const opportunities = await exchangeService.findArbitrageOpportunities(testSymbol, testAmount);
            
            if (opportunities && Array.isArray(opportunities)) {
                points += 10;
                console.log(`✅ Arbitrage Detection: Working (${opportunities.length} opportunities found) (+10 points)`);
                
                if (opportunities.length > 0) {
                    const bestOpp = opportunities[0];
                    console.log(`📊 Best Opportunity: ${bestOpp.symbol}`);
                    console.log(`   Buy: ${bestOpp.buyExchange} @ $${bestOpp.buyPrice.toFixed(6)}`);
                    console.log(`   Sell: ${bestOpp.sellExchange} @ $${bestOpp.sellPrice.toFixed(6)}`);
                    console.log(`   Profit: $${bestOpp.netProfit.toFixed(2)} (${bestOpp.profitPercent.toFixed(3)}%)`);
                    console.log(`   Data Source: ${bestOpp.isRealArbitrage ? 'VERIFIED REAL' : 'MIXED'}`);
                    
                    if (bestOpp.isRealArbitrage) {
                        points += 10;
                        console.log('✅ Data Source: VERIFIED REAL DATA (+10 points)');
                    } else {
                        console.log('⚠️ Data Source: Mixed or unverified data');
                        this.verificationResults.issues.push('Arbitrage using non-verified data');
                    }
                } else {
                    console.log('📭 No arbitrage opportunities found (market efficient)');
                    points += 5; // Still good - means market is efficient
                }
            } else {
                console.log('❌ Arbitrage Detection: Failed (+0 points)');
                this.verificationResults.issues.push('Arbitrage detection not working');
            }

            // Test paper trade execution
            console.log('\n🧪 Testing Paper Trade Execution...');
            
            if (opportunities && opportunities.length > 0) {
                try {
                    const testTrade = await exchangeService.executePaperTrade(opportunities[0]);
                    
                    if (testTrade) {
                        points += 5;
                        console.log(`✅ Paper Trade Execution: SUCCESS (+5 points)`);
                        console.log(`   Trade ID: ${testTrade.id}`);
                        console.log(`   Profit: $${testTrade.netProfit.toFixed(2)}`);
                        console.log(`   ML Confidence: ${(testTrade.mlConfidence * 100).toFixed(1)}%`);
                        console.log(`   Data Source: ${testTrade.dataSource}`);
                        
                        if (testTrade.dataSource === 'VERIFIED_REAL') {
                            console.log('✅ Trade used VERIFIED REAL data');
                        } else {
                            console.log('⚠️ Trade used unverified data source');
                            this.verificationResults.issues.push('Paper trade used unverified data');
                        }
                    } else {
                        console.log('❌ Paper Trade Execution: FAILED');
                        this.verificationResults.issues.push('Paper trade execution failed');
                    }
                } catch (error) {
                    console.log(`❌ Paper Trade Error: ${error.message}`);
                    this.verificationResults.issues.push(`Paper trade error: ${error.message}`);
                }
            } else {
                console.log('⚠️ Skipping paper trade test (no opportunities)');
            }

            this.verificationResults.checks.paperTradingRealData = {
                points,
                maxPoints: 25,
                status: points >= 20 ? 'EXCELLENT' : points >= 15 ? 'GOOD' : points >= 10 ? 'FAIR' : 'POOR'
            };

        } catch (error) {
            console.log(`❌ Paper Trading Verification Error: ${error.message}`);
            this.verificationResults.issues.push(`Paper trading verification failed: ${error.message}`);
        }

        console.log(`📊 Paper Trading Score: ${this.verificationResults.checks.paperTradingRealData?.points || 0}/25\n`);
        this.verificationResults.score += this.verificationResults.checks.paperTradingRealData?.points || 0;
    }

    generateFinalVerdict() {
        console.log('='.repeat(65));
        console.log('🎯 FINAL ML SYSTEM VERIFICATION RESULTS');
        console.log('='.repeat(65));
        
        console.log(`📊 OVERALL SCORE: ${this.verificationResults.score}/${this.verificationResults.maxScore}`);
        
        // Individual component scores
        Object.entries(this.verificationResults.checks).forEach(([component, check]) => {
            const statusIcon = check.status === 'EXCELLENT' ? '🟢' : 
                             check.status === 'GOOD' ? '🟡' : 
                             check.status === 'FAIR' ? '🟠' : '🔴';
            console.log(`${statusIcon} ${component}: ${check.points}/${check.maxPoints} (${check.status})`);
        });

        // Generate verdict
        if (this.verificationResults.score >= 85) {
            this.verificationResults.verdict = '🚀 EXCELLENT - ML system using real data, ready for production!';
        } else if (this.verificationResults.score >= 70) {
            this.verificationResults.verdict = '✅ GOOD - ML system mostly functional with real data';
        } else if (this.verificationResults.score >= 50) {
            this.verificationResults.verdict = '⚠️ NEEDS WORK - Some real data integration but issues detected';
        } else {
            this.verificationResults.verdict = '❌ CRITICAL - Major issues with real data integration';
        }

        console.log(`\n${this.verificationResults.verdict}`);

        // Issues and recommendations
        if (this.verificationResults.issues.length > 0) {
            console.log('\n❌ ISSUES DETECTED:');
            this.verificationResults.issues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue}`);
            });
        }

        if (this.verificationResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.verificationResults.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        }

        // Next steps
        console.log('\n📋 NEXT STEPS:');
        if (this.verificationResults.score >= 85) {
            console.log('   1. 🚀 Your ML system is production-ready!');
            console.log('   2. 📊 Start with small position sizes for live trading');
            console.log('   3. 📈 Monitor ML performance and adjust thresholds');
            console.log('   4. 🔄 Set up automated model retraining');
        } else if (this.verificationResults.score >= 70) {
            console.log('   1. 🔧 Address the issues listed above');
            console.log('   2. 🤖 Ensure all ML models are properly trained');
            console.log('   3. 📊 Verify all exchanges are providing real data');
            console.log('   4. 🧪 Run more test trades to validate system');
        } else {
            console.log('   1. ❌ Fix critical issues with real data integration');
            console.log('   2. 🔍 Check API keys and exchange connections');
            console.log('   3. 🤖 Verify ML model configuration');
            console.log('   4. 📊 Test individual components step by step');
        }

        console.log('\n✅ ML System Verification Complete!');
        return this.verificationResults;
    }
}

// Auto-run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const verifier = new MLSystemVerifier();
    
    console.log('🔍 Starting comprehensive ML system verification...');
    console.log('This will verify your ML models are using real exchange data.\n');
    
    try {
        await verifier.runCompleteVerification();
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

export default MLSystemVerifier;