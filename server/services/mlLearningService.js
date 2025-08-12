// server/services/mlLearningService.js
import fs from 'fs/promises';
import path from 'path';

class MLLearningService {
    constructor() {
        this.learningData = {
            trades: [],
            marketConditions: [],
            modelPerformance: {},
            patterns: [],
            lastUpdate: null
        };
        this.dataPath = path.join(process.cwd(), 'ml_learning_data.json');
        this.isLearning = true;
        this.performanceThresholds = {
            minWinRate: 45,
            targetWinRate: 65,
            excellentWinRate: 75
        };
    }

    async initialize() {
        console.log('🧠 Initializing ML Learning Service...');
        await this.loadLearningData();
        
        // Set up periodic saves
        setInterval(() => this.saveLearningData(), 60000); // Save every minute
        
        // Set up periodic analysis
        setInterval(() => this.performPeriodicAnalysis(), 300000); // Analyze every 5 minutes
        
        console.log('✅ ML Learning Service initialized');
    }

    async loadLearningData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            this.learningData = JSON.parse(data);
            console.log(`📚 Loaded ${this.learningData.trades.length} historical trades for learning`);
        } catch (error) {
            console.log('📝 Creating new learning data file');
            await this.saveLearningData();
        }
    }

    async saveLearningData() {
        try {
            await fs.writeFile(this.dataPath, JSON.stringify(this.learningData, null, 2));
            this.learningData.lastUpdate = Date.now();
        } catch (error) {
            console.error('❌ Error saving learning data:', error);
        }
    }

    // Record trade with full market context
    async recordTradeForLearning(trade, marketSnapshot, prediction) {
        const learningRecord = {
            tradeId: trade.id,
            timestamp: Date.now(),
            symbol: trade.symbol,
            
            // Trade details
            expectedProfit: trade.expectedProfit,
            actualProfit: trade.netProfit,
            slippage: trade.slippage || 0,
            fillPercentage: trade.fillPercentage || 1.0,
            
            // Market conditions at time of trade
            marketSnapshot: {
                volatility: marketSnapshot.volatility,
                volume: marketSnapshot.volume,
                spread: marketSnapshot.spread,
                orderBookDepth: marketSnapshot.orderBookDepth,
                trend: marketSnapshot.trend,
                liquidity: marketSnapshot.liquidity
            },
            
            // ML prediction details
            prediction: {
                confidence: prediction.confidence,
                models: prediction.decidingModels,
                features: prediction.features
            },
            
            // Outcome analysis
            outcome: {
                success: trade.netProfit > 0,
                profitDelta: trade.netProfit - trade.expectedProfit,
                executionQuality: this.calculateExecutionQuality(trade),
                profitPercentage: (trade.netProfit / (trade.amount * trade.buyPrice)) * 100
            }
        };
        
        this.learningData.trades.push(learningRecord);
        
        // Keep only last 10000 trades
        if (this.learningData.trades.length > 10000) {
            this.learningData.trades = this.learningData.trades.slice(-10000);
        }
        
        // Update model performance
        this.updateModelPerformance(prediction.decidingModels, learningRecord.outcome);
        
        // Detect patterns
        await this.detectTradingPatterns();
        
        // Check for learning milestones
        this.checkLearningMilestones();
        
        console.log(`🧠 Recorded trade ${trade.id} for ML learning - Outcome: ${learningRecord.outcome.success ? 'WIN' : 'LOSS'} (${learningRecord.outcome.profitPercentage.toFixed(2)}%)`);
    }

    updateModelPerformance(models, outcome) {
        models.forEach(modelName => {
            if (!this.learningData.modelPerformance[modelName]) {
                this.learningData.modelPerformance[modelName] = {
                    trades: 0,
                    successes: 0,
                    totalProfit: 0,
                    avgConfidence: 0,
                    bestStreak: 0,
                    currentStreak: 0,
                    worstLoss: 0,
                    bestGain: 0
                };
            }
            
            const perf = this.learningData.modelPerformance[modelName];
            perf.trades++;
            
            if (outcome.success) {
                perf.successes++;
                perf.currentStreak++;
                perf.bestStreak = Math.max(perf.bestStreak, perf.currentStreak);
                perf.bestGain = Math.max(perf.bestGain, outcome.profitPercentage);
            } else {
                perf.currentStreak = 0;
                perf.worstLoss = Math.min(perf.worstLoss, outcome.profitPercentage);
            }
            
            perf.totalProfit += outcome.profitDelta;
            perf.winRate = (perf.successes / perf.trades) * 100;
            perf.avgProfit = perf.totalProfit / perf.trades;
        });
    }

    calculateExecutionQuality(trade) {
        // Calculate how well the trade was executed
        const slippageImpact = Math.abs(trade.slippage || 0);
        const fillQuality = trade.fillPercentage || 1.0;
        const profitAccuracy = trade.expectedProfit !== 0 ? 
            1 - Math.abs((trade.netProfit - trade.expectedProfit) / trade.expectedProfit) : 
            0.5;
        
        // Weighted quality score
        const quality = (profitAccuracy * 0.5) + (fillQuality * 0.3) + ((1 - slippageImpact) * 0.2);
        
        return Math.max(0, Math.min(1, quality));
    }

    async detectTradingPatterns() {
        // Analyze last 100 trades for patterns
        const recentTrades = this.learningData.trades.slice(-100);
        
        if (recentTrades.length < 20) return;
        
        // Pattern detection logic
        const patterns = {
            timeOfDay: this.analyzeTimePatterns(recentTrades),
            marketConditions: this.analyzeMarketConditionPatterns(recentTrades),
            symbolPerformance: this.analyzeSymbolPatterns(recentTrades),
            confidenceCorrelation: this.analyzeConfidenceCorrelation(recentTrades),
            volumeImpact: this.analyzeVolumeImpact(recentTrades)
        };
        
        this.learningData.patterns = patterns;
    }

    analyzeTimePatterns(trades) {
        // Group trades by hour and analyze success rates
        const hourlyStats = {};
        
        trades.forEach(trade => {
            const hour = new Date(trade.timestamp).getHours();
            if (!hourlyStats[hour]) {
                hourlyStats[hour] = { total: 0, successful: 0, totalProfit: 0 };
            }
            hourlyStats[hour].total++;
            if (trade.outcome.success) hourlyStats[hour].successful++;
            hourlyStats[hour].totalProfit += trade.outcome.profitDelta;
        });
        
        // Calculate win rates and identify best hours
        Object.keys(hourlyStats).forEach(hour => {
            hourlyStats[hour].winRate = (hourlyStats[hour].successful / hourlyStats[hour].total) * 100;
            hourlyStats[hour].avgProfit = hourlyStats[hour].totalProfit / hourlyStats[hour].total;
        });
        
        return hourlyStats;
    }

    analyzeMarketConditionPatterns(trades) {
        // Analyze which market conditions lead to successful trades
        const conditions = {
            highVolatility: { total: 0, successful: 0, totalProfit: 0 },
            lowVolatility: { total: 0, successful: 0, totalProfit: 0 },
            trending: { total: 0, successful: 0, totalProfit: 0 },
            ranging: { total: 0, successful: 0, totalProfit: 0 },
            highLiquidity: { total: 0, successful: 0, totalProfit: 0 },
            lowLiquidity: { total: 0, successful: 0, totalProfit: 0 }
        };
        
        trades.forEach(trade => {
            const volatility = trade.marketSnapshot.volatility;
            const trend = trade.marketSnapshot.trend;
            const liquidity = trade.marketSnapshot.liquidity;
            
            // Volatility analysis
            if (volatility > 0.02) {
                conditions.highVolatility.total++;
                if (trade.outcome.success) conditions.highVolatility.successful++;
                conditions.highVolatility.totalProfit += trade.outcome.profitDelta;
            } else {
                conditions.lowVolatility.total++;
                if (trade.outcome.success) conditions.lowVolatility.successful++;
                conditions.lowVolatility.totalProfit += trade.outcome.profitDelta;
            }
            
            // Trend analysis
            if (trend === 'strong_up' || trend === 'strong_down') {
                conditions.trending.total++;
                if (trade.outcome.success) conditions.trending.successful++;
                conditions.trending.totalProfit += trade.outcome.profitDelta;
            } else {
                conditions.ranging.total++;
                if (trade.outcome.success) conditions.ranging.successful++;
                conditions.ranging.totalProfit += trade.outcome.profitDelta;
            }
            
            // Liquidity analysis
            if (liquidity && liquidity.sufficient) {
                conditions.highLiquidity.total++;
                if (trade.outcome.success) conditions.highLiquidity.successful++;
                conditions.highLiquidity.totalProfit += trade.outcome.profitDelta;
            } else {
                conditions.lowLiquidity.total++;
                if (trade.outcome.success) conditions.lowLiquidity.successful++;
                conditions.lowLiquidity.totalProfit += trade.outcome.profitDelta;
            }
        });
        
        // Calculate win rates
        Object.keys(conditions).forEach(condition => {
            if (conditions[condition].total > 0) {
                conditions[condition].winRate = (conditions[condition].successful / conditions[condition].total) * 100;
                conditions[condition].avgProfit = conditions[condition].totalProfit / conditions[condition].total;
            }
        });
        
        return conditions;
    }

    analyzeSymbolPatterns(trades) {
        const symbolStats = {};
        
        trades.forEach(trade => {
            if (!symbolStats[trade.symbol]) {
                symbolStats[trade.symbol] = { 
                    total: 0, 
                    successful: 0, 
                    totalProfit: 0,
                    avgSlippage: 0,
                    bestProfit: 0,
                    worstLoss: 0
                };
            }
            
            const stats = symbolStats[trade.symbol];
            stats.total++;
            if (trade.outcome.success) stats.successful++;
            stats.totalProfit += trade.actualProfit;
            stats.avgSlippage = ((stats.avgSlippage * (stats.total - 1)) + trade.slippage) / stats.total;
            stats.bestProfit = Math.max(stats.bestProfit, trade.actualProfit);
            stats.worstLoss = Math.min(stats.worstLoss, trade.actualProfit);
        });
        
        // Calculate final metrics
        Object.keys(symbolStats).forEach(symbol => {
            const stats = symbolStats[symbol];
            stats.winRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
            stats.avgProfit = stats.total > 0 ? stats.totalProfit / stats.total : 0;
        });
        
        return symbolStats;
    }

    analyzeConfidenceCorrelation(trades) {
        // Analyze correlation between confidence and success
        const confidenceBuckets = {
            'low': { range: [0, 60], total: 0, successful: 0 },
            'medium': { range: [60, 75], total: 0, successful: 0 },
            'high': { range: [75, 85], total: 0, successful: 0 },
            'very_high': { range: [85, 100], total: 0, successful: 0 }
        };
        
        trades.forEach(trade => {
            const confidence = trade.prediction.confidence;
            
            Object.entries(confidenceBuckets).forEach(([bucket, data]) => {
                if (confidence >= data.range[0] && confidence < data.range[1]) {
                    data.total++;
                    if (trade.outcome.success) data.successful++;
                }
            });
        });
        
        // Calculate win rates
        Object.values(confidenceBuckets).forEach(bucket => {
            bucket.winRate = bucket.total > 0 ? (bucket.successful / bucket.total) * 100 : 0;
        });
        
        return confidenceBuckets;
    }

    analyzeVolumeImpact(trades) {
        // Analyze how volume affects trade success
        const volumeBuckets = {
            'very_low': { threshold: 10000, total: 0, successful: 0 },
            'low': { threshold: 50000, total: 0, successful: 0 },
            'medium': { threshold: 200000, total: 0, successful: 0 },
            'high': { threshold: 1000000, total: 0, successful: 0 },
            'very_high': { threshold: Infinity, total: 0, successful: 0 }
        };
        
        trades.forEach(trade => {
            const volume = trade.marketSnapshot.volume || 0;
            
            let assigned = false;
            Object.entries(volumeBuckets).forEach(([bucket, data]) => {
                if (!assigned && volume < data.threshold) {
                    data.total++;
                    if (trade.outcome.success) data.successful++;
                    assigned = true;
                }
            });
        });
        
        // Calculate win rates
        Object.values(volumeBuckets).forEach(bucket => {
            bucket.winRate = bucket.total > 0 ? (bucket.successful / bucket.total) * 100 : 0;
        });
        
        return volumeBuckets;
    }

    checkLearningMilestones() {
        const totalTrades = this.learningData.trades.length;
        const milestones = [100, 500, 1000, 5000, 10000];
        
        milestones.forEach(milestone => {
            if (totalTrades === milestone) {
                console.log(`🎯 ML Learning Milestone: ${milestone} trades analyzed!`);
                this.generateMilestoneReport(milestone);
            }
        });
    }

    generateMilestoneReport(milestone) {
        const insights = this.getLearningInsights();
        console.log(`\n📊 === ML LEARNING REPORT (${milestone} trades) ===`);
        
        // Model performance summary
        console.log('\n🤖 Model Performance:');
        Object.entries(insights.modelPerformance).forEach(([model, stats]) => {
            if (stats.trades > 10) {
                console.log(`   ${model}: ${stats.winRate.toFixed(1)}% win rate, $${stats.totalProfit.toFixed(2)} profit`);
            }
        });
        
        // Pattern insights
        if (insights.patterns) {
            console.log('\n📈 Key Patterns Discovered:');
            
            // Best trading hours
            const timePatterns = insights.patterns.timeOfDay;
            if (timePatterns) {
                const bestHours = Object.entries(timePatterns)
                    .filter(([_, stats]) => stats.total > 5)
                    .sort((a, b) => b[1].winRate - a[1].winRate)
                    .slice(0, 3);
                
                console.log('   Best trading hours:');
                bestHours.forEach(([hour, stats]) => {
                    console.log(`     ${hour}:00 - ${stats.winRate.toFixed(1)}% win rate`);
                });
            }
            
            // Market condition preferences
            const conditions = insights.patterns.marketConditions;
            if (conditions) {
                console.log('   Market condition performance:');
                Object.entries(conditions).forEach(([condition, stats]) => {
                    if (stats.total > 10) {
                        console.log(`     ${condition}: ${stats.winRate.toFixed(1)}% win rate`);
                    }
                });
            }
        }
        
        console.log('\n=====================================\n');
    }

    performPeriodicAnalysis() {
        // Run deeper analysis periodically
        const recentTrades = this.learningData.trades.slice(-500);
        if (recentTrades.length < 50) return;
        
        // Check for degrading performance
        const recentWinRate = recentTrades.filter(t => t.outcome.success).length / recentTrades.length * 100;
        const overallWinRate = this.learningData.trades.filter(t => t.outcome.success).length / this.learningData.trades.length * 100;
        
        if (recentWinRate < overallWinRate - 10) {
            console.log(`⚠️ ML Performance Alert: Recent win rate (${recentWinRate.toFixed(1)}%) is below average (${overallWinRate.toFixed(1)}%)`);
        }
        
        // Check for model drift
        this.detectModelDrift();
    }

    detectModelDrift() {
        // Compare recent model performance vs historical
        const recentWindow = 100;
        const recentTrades = this.learningData.trades.slice(-recentWindow);
        
        if (recentTrades.length < recentWindow) return;
        
        // Calculate recent model performance
        const recentModelStats = {};
        recentTrades.forEach(trade => {
            trade.prediction.models.forEach(model => {
                if (!recentModelStats[model]) {
                    recentModelStats[model] = { total: 0, successful: 0 };
                }
                recentModelStats[model].total++;
                if (trade.outcome.success) recentModelStats[model].successful++;
            });
        });
        
        // Compare with overall performance
        Object.entries(recentModelStats).forEach(([model, recentStats]) => {
            const overallStats = this.learningData.modelPerformance[model];
            if (overallStats && overallStats.trades > 100) {
                const recentWinRate = (recentStats.successful / recentStats.total) * 100;
                const drift = Math.abs(recentWinRate - overallStats.winRate);
                
                if (drift > 15) {
                    console.log(`🔄 Model Drift Detected: ${model} recent performance (${recentWinRate.toFixed(1)}%) differs from historical (${overallStats.winRate.toFixed(1)}%)`);
                }
            }
        });
    }

    // Get learning insights for ML models
    getLearningInsights() {
        return {
            totalTrades: this.learningData.trades.length,
            patterns: this.learningData.patterns,
            modelPerformance: this.learningData.modelPerformance,
            recommendations: this.generateRecommendations(),
            readinessScore: this.calculateReadinessScore()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Model performance recommendations
        Object.entries(this.learningData.modelPerformance).forEach(([model, stats]) => {
            if (stats.trades < 50) return; // Not enough data
            
            if (stats.winRate < this.performanceThresholds.minWinRate) {
                recommendations.push({
                    type: 'model_performance',
                    severity: 'high',
                    model: model,
                    message: `Model ${model} has low win rate (${stats.winRate.toFixed(1)}%). Consider retraining or reducing weight.`,
                    action: 'reduce_weight'
                });
            } else if (stats.winRate > this.performanceThresholds.excellentWinRate) {
                recommendations.push({
                    type: 'model_performance',
                    severity: 'info',
                    model: model,
                    message: `Model ${model} performing excellently (${stats.winRate.toFixed(1)}%). Consider increasing weight.`,
                    action: 'increase_weight'
                });
            }
            
            // Check for streaks
            if (stats.currentStreak < -5) {
                recommendations.push({
                    type: 'model_streak',
                    severity: 'medium',
                    model: model,
                    message: `Model ${model} on losing streak (${Math.abs(stats.currentStreak)} losses). Monitor closely.`,
                    action: 'monitor'
                });
            }
        });
        
        // Pattern-based recommendations
        if (this.learningData.patterns) {
            // Market condition recommendations
            const conditions = this.learningData.patterns.marketConditions;
            if (conditions) {
                if (conditions.highVolatility && conditions.highVolatility.winRate < 40 && conditions.highVolatility.total > 20) {
                    recommendations.push({
                        type: 'market_condition',
                        severity: 'high',
                        message: `Poor performance in high volatility (${conditions.highVolatility.winRate.toFixed(1)}%). Avoid trading during volatile periods.`,
                        action: 'adjust_strategy'
                    });
                }
                
                if (conditions.lowLiquidity && conditions.lowLiquidity.winRate < 45 && conditions.lowLiquidity.total > 20) {
                    recommendations.push({
                        type: 'market_condition',
                        severity: 'medium',
                        message: `Low win rate in illiquid markets (${conditions.lowLiquidity.winRate.toFixed(1)}%). Increase minimum liquidity threshold.`,
                        action: 'adjust_filters'
                    });
                }
            }
            
            // Time-based recommendations
            const timePatterns = this.learningData.patterns.timeOfDay;
            if (timePatterns) {
                const badHours = Object.entries(timePatterns)
                    .filter(([_, stats]) => stats.total > 10 && stats.winRate < 40)
                    .map(([hour, _]) => parseInt(hour));
                
                if (badHours.length > 0) {
                    recommendations.push({
                        type: 'time_pattern',
                        severity: 'medium',
                        message: `Poor performance during hours: ${badHours.join(', ')}:00. Consider avoiding these times.`,
                        action: 'time_filter'
                    });
                }
            }
            
            // Symbol recommendations
            const symbolPatterns = this.learningData.patterns.symbolPerformance;
            if (symbolPatterns) {
                Object.entries(symbolPatterns).forEach(([symbol, stats]) => {
                    if (stats.total > 20 && stats.winRate < 35) {
                        recommendations.push({
                            type: 'symbol_performance',
                            severity: 'high',
                            message: `Poor performance on ${symbol} (${stats.winRate.toFixed(1)}% win rate). Consider removing from active pairs.`,
                            action: 'remove_symbol',
                            symbol: symbol
                        });
                    }
                });
            }
        }
        
        // Overall recommendations
        const totalTrades = this.learningData.trades.length;
        if (totalTrades > 0) {
            const overallWinRate = this.learningData.trades.filter(t => t.outcome.success).length / totalTrades * 100;
            
            if (totalTrades > 500 && overallWinRate > this.performanceThresholds.targetWinRate) {
                recommendations.push({
                    type: 'readiness',
                    severity: 'info',
                    message: `System showing consistent performance (${overallWinRate.toFixed(1)}% win rate over ${totalTrades} trades). Consider increasing position sizes.`,
                    action: 'scale_up'
                });
            }
            
            if (totalTrades > 1000 && overallWinRate > this.performanceThresholds.excellentWinRate) {
                recommendations.push({
                    type: 'readiness',
                    severity: 'success',
                    message: `Excellent performance! Ready for live trading with small positions.`,
                    action: 'go_live'
                });
            }
        }
        
        return recommendations;
    }

    calculateReadinessScore() {
        // Calculate a 0-100 score for live trading readiness
        let score = 0;
        const weights = {
            tradeCount: 20,
            winRate: 30,
            consistency: 20,
            modelPerformance: 20,
            patternQuality: 10
        };
        
        // Trade count score (need at least 1000 trades)
        const tradeCount = this.learningData.trades.length;
        score += Math.min(tradeCount / 1000, 1) * weights.tradeCount;
        
        // Win rate score
        if (tradeCount > 100) {
            const winRate = this.learningData.trades.filter(t => t.outcome.success).length / tradeCount * 100;
            score += Math.min(winRate / this.performanceThresholds.targetWinRate, 1) * weights.winRate;
        }
        
        // Consistency score (low variance in performance)
        if (tradeCount > 200) {
            const chunks = [];
            for (let i = 0; i < this.learningData.trades.length; i += 50) {
                const chunk = this.learningData.trades.slice(i, i + 50);
                const chunkWinRate = chunk.filter(t => t.outcome.success).length / chunk.length;
                chunks.push(chunkWinRate);
            }
            
            const avgWinRate = chunks.reduce((a, b) => a + b) / chunks.length;
            const variance = chunks.reduce((sum, rate) => sum + Math.pow(rate - avgWinRate, 2), 0) / chunks.length;
            const consistency = 1 - Math.min(variance * 10, 1); // Lower variance = higher consistency
            
            score += consistency * weights.consistency;
        }
        
        // Model performance score
        const models = Object.values(this.learningData.modelPerformance);
        if (models.length > 0) {
            const avgModelWinRate = models
                .filter(m => m.trades > 50)
                .reduce((sum, m) => sum + m.winRate, 0) / models.length;
            
            score += Math.min(avgModelWinRate / this.performanceThresholds.targetWinRate, 1) * weights.modelPerformance;
        }
        
        // Pattern quality score
        if (this.learningData.patterns) {
            let patternScore = 0;
            let patternCount = 0;
            
            // Check if we've identified clear patterns
            if (this.learningData.patterns.timeOfDay) {
                const timeStats = Object.values(this.learningData.patterns.timeOfDay);
                const hasGoodHours = timeStats.some(s => s.total > 10 && s.winRate > 70);
                if (hasGoodHours) {
                    patternScore += 0.33;
                    patternCount++;
                }
            }
            
            if (this.learningData.patterns.marketConditions) {
                const conditions = Object.values(this.learningData.patterns.marketConditions);
                const hasGoodConditions = conditions.some(c => c.total > 20 && c.winRate > 65);
                if (hasGoodConditions) {
                    patternScore += 0.33;
                    patternCount++;
                }
            }
            
            if (this.learningData.patterns.symbolPerformance) {
                const symbols = Object.values(this.learningData.patterns.symbolPerformance);
                const hasGoodSymbols = symbols.some(s => s.total > 30 && s.winRate > 65);
                if (hasGoodSymbols) {
                    patternScore += 0.34;
                    patternCount++;
                }
            }
            
            score += (patternCount > 0 ? patternScore : 0) * weights.patternQuality;
        }
        
        return Math.round(score);
    }

    // Get model weight adjustments based on performance
    getModelWeightAdjustments() {
        const adjustments = {};
        
        Object.entries(this.learningData.modelPerformance).forEach(([model, stats]) => {
            if (stats.trades < 50) {
                adjustments[model] = 1.0; // No adjustment for insufficient data
                return;
            }
            
            // Calculate adjustment based on performance relative to target
            const performanceRatio = stats.winRate / this.performanceThresholds.targetWinRate;
            
            // Limit adjustments to reasonable range
            adjustments[model] = Math.max(0.5, Math.min(1.5, performanceRatio));
            
            // Extra boost for exceptional performance
            if (stats.winRate > this.performanceThresholds.excellentWinRate && stats.trades > 200) {
                adjustments[model] = Math.min(adjustments[model] * 1.2, 2.0);
            }
            
            // Penalty for poor recent performance
            if (stats.currentStreak < -5) {
                adjustments[model] *= 0.8;
            }
        });
        
        return adjustments;
    }
}

export default new MLLearningService();