import exchangeService from './exchangeService.js';

class MLTradingEngine {
    constructor() {
        this.isActive = false;
        this.confidenceThreshold = 75;
        this.tradingInterval = null;
        this.statistics = {
            totalTrades: 0,
            successfulTrades: 0,
            totalProfit: 0,
            averageConfidence: 0
        };
        this.onTradeExecuted = null;
        
        // ML Models with realistic performance
        this.models = [
            { name: 'Linear Regression', accuracy: 72.5, weight: 1.0 },
            { name: 'Polynomial Regression', accuracy: 75.1, weight: 1.2 },
            { name: 'Moving Average', accuracy: 68.3, weight: 0.8 },
            { name: 'RSI Momentum', accuracy: 79.2, weight: 1.5 },
            { name: 'Bollinger Bands', accuracy: 81.7, weight: 1.8 },
            { name: 'MACD Signal', accuracy: 77.8, weight: 1.3 },
            { name: 'LSTM Neural Network', accuracy: 85.4, weight: 2.0 },
            { name: 'Ensemble Meta-Model', accuracy: 91.3, weight: 2.5 }
        ];
    }

    setThreshold(threshold) {
        this.confidenceThreshold = Math.max(50, Math.min(95, threshold));
        console.log(`🧠 ML confidence threshold set to ${this.confidenceThreshold}%`);
        return this.confidenceThreshold;
    }

    async startAutoTrading(interval = 30000) {
        if (this.isActive) {
            return { success: false, message: 'Auto trading is already active' };
        }

        this.isActive = true;
        console.log('🤖 Starting ML auto trading...');

        this.tradingInterval = setInterval(async () => {
            try {
                await this.executeTradingCycle();
            } catch (error) {
                console.error('❌ Error in trading cycle:', error);
            }
        }, interval);

        return {
            success: true,
            message: 'ML auto trading started',
            interval: interval,
            threshold: this.confidenceThreshold
        };
    }

    stopAutoTrading() {
        if (!this.isActive) {
            return { success: false, message: 'Auto trading is not active' };
        }

        this.isActive = false;
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
            this.tradingInterval = null;
        }

        console.log('⏹️ ML auto trading stopped');
        return { success: true, message: 'ML auto trading stopped' };
    }

    async executeTradingCycle() {
        try {
            // Get arbitrage opportunities
            // Get all available trading pairs from exchanges
            const symbols = await this.getAvailableTradingPairs();
            const tradeAmount = 1000; // $1000 per trade
            
            console.log(`🤖 ML trading cycle started with ${symbols.length} trading pairs`);
            
            for (const symbol of symbols) {
                const opportunities = await exchangeService.findArbitrageOpportunities(symbol, tradeAmount);
                
                if (opportunities.length > 0) {
                    console.log(`🔍 Found ${opportunities.length} arbitrage opportunities for ${symbol}`);
                }
                
                for (const opportunity of opportunities.slice(0, 1)) { // Take best opportunity
                    const analysis = await this.analyzeOpportunity(opportunity);
                    
                    if (analysis.shouldTrade && analysis.confidence >= this.confidenceThreshold) {
                        console.log(`🧠 ML analysis recommends trade with ${analysis.confidence.toFixed(1)}% confidence`);
                        await this.executeTrade(opportunity, analysis);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in trading cycle:', error);
        }
    }
    
    async getAvailableTradingPairs() {
        try {
            // Get all exchanges
            const exchangeStatus = await exchangeService.getExchangeStatus();
            const connectedExchanges = Object.entries(exchangeStatus)
                .filter(([_, data]) => data.connected)
                .map(([id, _]) => id);
            
            if (connectedExchanges.length === 0) {
                console.log('⚠️ No connected exchanges found, using default pairs');
                return ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'];
            }
            
            // Get available pairs from first connected exchange
            const exchangeId = connectedExchanges[0];
            const exchange = this.exchanges.get(exchangeId)?.instance;
            
            if (!exchange) {
                console.log('⚠️ Exchange instance not found, using default pairs');
                return ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'];
            }
            
            try {
                // Load markets from exchange
                const markets = await exchange.loadMarkets();
                
                // Filter for USDT pairs that are likely meme coins
                const memeCoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MYRO', 'POPCAT', 'MEME', 'TURBO'];
                const tradingPairs = Object.keys(markets)
                    .filter(symbol => symbol.endsWith('/USDT'))
                    .filter(symbol => {
                        const base = symbol.split('/')[0];
                        return memeCoins.includes(base) || 
                               base.length <= 5 || // Short names are often meme coins
                               Math.random() < 0.1; // Include some random pairs for diversity
                    });
                
                console.log(`📊 Found ${tradingPairs.length} trading pairs from ${exchangeId}`);
                return tradingPairs.length > 0 ? 
                    tradingPairs : 
                    ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'];
            } catch (error) {
                console.error(`❌ Error loading markets from ${exchangeId}:`, error.message);
                return ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'];
            }
        } catch (error) {
            console.error('❌ Error getting available trading pairs:', error);
            return ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'];
        }
    }

    async analyzeOpportunity(opportunity) {
        // Simulate ML analysis
        const marketData = {
            symbol: opportunity.symbol,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice,
            profitPercent: opportunity.profitPercent,
            volume: Math.random() * 1000000 + 100000,
            volatility: Math.random() * 0.1 + 0.05,
            trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
        };

        // Calculate confidence based on multiple factors
        let confidence = 0;
        let decidingModels = [];

        // Each model contributes to the decision
        for (const model of this.models) {
            const modelConfidence = this.calculateModelConfidence(model, marketData, opportunity);
            confidence += modelConfidence * model.weight;
            
            if (modelConfidence > 70) {
                decidingModels.push(model.name);
            }
        }

        // Normalize confidence
        const totalWeight = this.models.reduce((sum, model) => sum + model.weight, 0);
        confidence = Math.min(95, confidence / totalWeight);

        // Risk assessment
        const riskFactors = {
            profitMargin: opportunity.profitPercent > 0.5 ? 1.0 : 0.8,
            marketVolatility: marketData.volatility < 0.08 ? 1.0 : 0.9,
            liquidityRisk: marketData.volume > 500000 ? 1.0 : 0.85
        };

        const riskAdjustedConfidence = confidence * Object.values(riskFactors).reduce((a, b) => a * b, 1);

        return {
            confidence: riskAdjustedConfidence,
            shouldTrade: riskAdjustedConfidence >= this.confidenceThreshold && opportunity.netProfit > 5,
            decidingModels,
            riskFactors,
            marketData,
            recommendation: riskAdjustedConfidence >= this.confidenceThreshold ? 'BUY' : 'HOLD'
        };
    }

    calculateModelConfidence(model, marketData, opportunity) {
        // Simulate different model behaviors
        let confidence = model.accuracy;

        // Adjust based on market conditions
        if (model.name.includes('Neural') || model.name.includes('Ensemble')) {
            // Advanced models perform better in volatile markets
            confidence += marketData.volatility * 100;
        }

        if (model.name.includes('Moving Average') || model.name.includes('MACD')) {
            // Trend-following models
            confidence += marketData.trend === 'bullish' ? 5 : -5;
        }

        if (model.name.includes('RSI') || model.name.includes('Bollinger')) {
            // Mean reversion models
            confidence += opportunity.profitPercent > 1.0 ? 10 : 0;
        }

        // Add some randomness to simulate real ML uncertainty
        confidence += (Math.random() - 0.5) * 10;

        return Math.max(50, Math.min(95, confidence));
    }

    async executeTrade(opportunity, analysis) {
        try {
            // Execute paper trade
            const tradeData = {
                ...opportunity,
                mlConfidence: analysis.confidence / 100,
                decidingModels: analysis.decidingModels,
                positionSize: 2.0 // 2% position size
            };

            const trade = await exchangeService.executePaperTrade(tradeData);

            // Update statistics
            this.statistics.totalTrades++;
            if (trade.netProfit > 0) {
                this.statistics.successfulTrades++;
            }
            this.statistics.totalProfit += trade.netProfit;
            this.statistics.averageConfidence = 
                (this.statistics.averageConfidence * (this.statistics.totalTrades - 1) + analysis.confidence) / 
                this.statistics.totalTrades;

            console.log(`🤖 ML Trade executed: ${trade.symbol} - Confidence: ${analysis.confidence.toFixed(1)}% - Profit: $${trade.netProfit.toFixed(2)}`);

            // Call callback if provided
            if (this.onTradeExecuted) {
                this.onTradeExecuted({
                    trade,
                    mlAnalysis: analysis
                });
            }

            return trade;
        } catch (error) {
            console.error('❌ Error executing ML trade:', error);
            throw error;
        }
    }

    getStatistics() {
        return {
            ...this.statistics,
            isActive: this.isActive,
            confidenceThreshold: this.confidenceThreshold,
            winRate: this.statistics.totalTrades > 0 ? 
                (this.statistics.successfulTrades / this.statistics.totalTrades) * 100 : 0
        };
    }
}

export default new MLTradingEngine();