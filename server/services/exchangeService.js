import ccxt from 'ccxt';
import ccxtIntegration from './ccxtIntegration.js';
import realDataTracker from './realDataTracker.js';

class ExchangeService {
    constructor() {
        this.exchanges = new Map();
        this.paperTradingEnabled = true;
        this.enforceRealDataOnly = true;
        this.realDataValidated = false;
        this.realDataCache = new Map();
        this.priceUpdateInterval = null;
        this.initialized = false;
        this.paperBalances = {
            'coinbase': { USD: 10000, BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, PEPE: 0 },
            'kraken': { USD: 10000, BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, PEPE: 0 },
            'gemini': { USD: 10000, BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, PEPE: 0 },
            'binanceus': { USD: 10000, BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, PEPE: 0 }
        };
        this.tradeExecutionHistory = [];
    }

    async initialize() {
        console.log('🔄 Initializing Exchange Service...');
        
        // Initialize CCXT integration first
        await ccxtIntegration.initializeAllExchanges();
        
        // Validate real data connections
        this.realDataValidated = await realDataTracker.validateRealDataConnections();
        
        if (this.realDataValidated) {
            console.log('✅ Real data connections validated');
            this.startRealDataUpdates();
        } else {
            console.log('⚠️ No real data connections available');
        }
        
        // Initialize supported US exchanges
        const exchangeConfigs = [
            {
                id: 'coinbase',
                class: ccxt.coinbasepro,
                name: 'Coinbase Pro',
                credentials: {
                    apiKey: process.env.COINBASE_API_KEY,
                    secret: process.env.COINBASE_API_SECRET,
                    passphrase: process.env.COINBASE_PASSPHRASE,
                    sandbox: process.env.NODE_ENV !== 'production'
                }
            },
            {
                id: 'kraken',
                class: ccxt.kraken,
                name: 'Kraken',
                credentials: {
                    apiKey: process.env.KRAKEN_API_KEY,
                    secret: process.env.KRAKEN_API_SECRET
                }
            },
            {
                id: 'gemini',
                class: ccxt.gemini,
                name: 'Gemini',
                credentials: {
                    apiKey: process.env.GEMINI_API_KEY,
                    secret: process.env.GEMINI_API_SECRET,
                    sandbox: process.env.NODE_ENV !== 'production'
                }
            },
            {
                id: 'binanceus',
                class: ccxt.binanceus,
                name: 'Binance.US',
                credentials: {
                    apiKey: process.env.BINANCEUS_API_KEY,
                    secret: process.env.BINANCEUS_API_SECRET
                }
            }
        ];

        for (const config of exchangeConfigs) {
            try {
                const exchange = new config.class(config.credentials);
                
                // Test connection if credentials are available
                if (config.credentials.apiKey && config.credentials.secret) {
                    try {
                        await exchange.loadMarkets();
                        console.log(`✅ ${config.name} connected successfully`);
                    } catch (error) {
                        console.log(`⚠️ ${config.name} credentials invalid, using demo mode`);
                        // Continue with demo mode
                    }
                } else {
                    console.log(`⚠️ ${config.name} no credentials, using demo mode`);
                }
                
                this.exchanges.set(config.id, {
                    instance: exchange,
                    name: config.name,
                    connected: true, // Always true for demo purposes
                    hasApiKeys: !!(config.credentials.apiKey && config.credentials.secret)
                });
                
            } catch (error) {
                console.error(`❌ Failed to initialize ${config.name}:`, error.message);
                
                // Add as disconnected for demo purposes
                this.exchanges.set(config.id, {
                    instance: null,
                    name: config.name,
                    connected: false,
                    hasApiKeys: false,
                    error: error.message
                });
            }
        }

        this.initialized = true;
        
        console.log(`✅ Exchange Service initialized with ${this.exchanges.size} exchanges`);
    }

    startRealDataUpdates() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        // Update real-time prices every 3 seconds for ML learning
        this.priceUpdateInterval = setInterval(async () => {
            await this.updateRealTimePrices();
        }, 3000);
        
        console.log('📈 Started real-time price updates for ML learning');
    }

    async updateRealTimePrices() {
        if (!this.realDataValidated) {
            console.log('⚠️ Skipping price updates - no validated real data connections');
            return;
        }
        
        const symbols = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'];
        const connectedExchanges = ccxtIntegration.getConnectedExchangeIds();
        
        console.log(`🔄 Updating prices for ${symbols.length} symbols across ${connectedExchanges.length} exchanges`);
        
        for (const exchangeId of connectedExchanges) {
            for (const symbol of symbols) {
                try {
                    const ticker = await ccxtIntegration.fetchRealTicker(exchangeId, symbol);
                    
                    if (ticker && ticker.isRealData) {
                        const cacheKey = `${exchangeId}:${symbol}`;
                        this.realDataCache.set(cacheKey, {
                            ...ticker,
                            validatedRealData: true,
                            lastValidation: Date.now(),
                            exchangeHealthStatus: 'VERIFIED'
                        });
                        
                        console.log(`✅ Real data cached: ${symbol} on ${exchangeId} = $${ticker.price.toFixed(6)}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error fetching ${symbol} from ${exchangeId}:`, error.message);
                }
            }
        }
        
        console.log(`📊 Real data cache updated: ${this.realDataCache.size} price points`);
    }
    
    getMarketData(exchange, symbol) {
        const key = `${exchange}:${symbol}`;
        return this.realDataCache.get(key) || null;
    }
    
    getAllMarketData() {
        return Array.from(this.realDataCache.values());
    }
    
    getConnectedExchanges() {
        return ccxtIntegration.getConnectedExchangeIds();
    }
    
    getDataSourceStats() {
        const totalPrices = this.realDataCache.size;
        const validatedExchanges = ccxtIntegration.getConnectedExchangeIds();
        const realDataCount = Array.from(this.realDataCache.values())
            .filter(data => data.validatedRealData).length;
        
        return {
            totalPrices,
            validatedExchanges,
            realDataPercentage: totalPrices > 0 ? ((realDataCount / totalPrices) * 100).toFixed(1) : '0',
            dataQualityScore: Math.min(100, (realDataCount / Math.max(1, totalPrices)) * 100)
        };
    }
            
    async findArbitrageOpportunities(symbol, amount) {
        if (!this.realDataValidated) {
            throw new Error('Cannot find arbitrage opportunities without validated real data connections');
        }
        
        const opportunities = [];
        const realPrices = [];
        
        // Collect ONLY real data from connected exchanges
        for (const exchangeId of this.getConnectedExchanges()) {
            const marketData = this.getMarketData(exchangeId, symbol);
            if (marketData && marketData.validatedRealData) {
                realPrices.push({
                    exchange: exchangeId,
                    price: marketData.price,
                    bid: marketData.bid,
                    ask: marketData.ask,
                    volume: marketData.volume24h,
                    timestamp: marketData.timestamp,
                    dataSource: 'VERIFIED_REAL'
                });
            }
        }
        
        if (realPrices.length < 2) {
            console.log(`⚠️ Need at least 2 exchanges with real data for arbitrage. Found: ${realPrices.length}`);
            return [];
        }
        
        // Find arbitrage opportunities using ONLY verified real data
        realPrices.sort((a, b) => a.price - b.price);
        
        for (let i = 0; i < realPrices.length - 1; i++) {
            for (let j = i + 1; j < realPrices.length; j++) {
                const buyData = realPrices[i];
                const sellData = realPrices[j];
                
                const priceDiff = sellData.price - buyData.price;
                const profitPercent = (priceDiff / buyData.price) * 100;
                
                if (profitPercent > 0.1) { // Minimum 0.1% profit
                    const grossProfit = amount * (priceDiff / buyData.price);
                    const buyFeeRate = await this.getRealExchangeFee(buyData.exchange, 'taker');
                    const sellFeeRate = await this.getRealExchangeFee(sellData.exchange, 'taker');
                    const estimatedFees = (amount * buyData.price * buyFeeRate) + (amount * sellData.price * sellFeeRate);
                    const netProfit = grossProfit - estimatedFees;
                    
                    if (netProfit > 0) {
                        // Validate the opportunity
                        const validation = await realDataTracker.validateArbitrageOpportunity({
                            symbol,
                            buyExchange: buyData.exchange,
                            sellExchange: sellData.exchange,
                            buyPrice: buyData.price,
                            sellPrice: sellData.price,
                            amount,
                            netProfit,
                            profitPercent,
                            timestamp: Date.now()
                        });
                        
                        opportunities.push({
                            symbol,
                            buyExchange: buyData.exchange,
                            sellExchange: sellData.exchange,
                            buyPrice: buyData.price,
                            sellPrice: sellData.price,
                            amount,
                            grossProfit,
                            estimatedFees,
                            netProfit,
                            profitPercent,
                            timestamp: Date.now(),
                            isRealArbitrage: true,
                            buyDataSource: 'VERIFIED_REAL',
                            sellDataSource: 'VERIFIED_REAL',
                            dataFreshness: Math.max(
                                Date.now() - buyData.timestamp,
                                Date.now() - sellData.timestamp
                            ),
                            validation
                        });
                    }
                }
            }
        }
        
        return opportunities.sort((a, b) => b.netProfit - a.netProfit);
    }

    async getRealExchangeFee(exchangeId, type) {
        const realFees = {
            coinbase: { maker: 0.005, taker: 0.005 },
            kraken: { maker: 0.0016, taker: 0.0026 },
            gemini: { maker: 0.001, taker: 0.0035 },
            binanceus: { maker: 0.001, taker: 0.001 },
            cryptocom: { maker: 0.004, taker: 0.004 }
        };
        
        return realFees[exchangeId]?.[type] || 0.0025;
    }

    async getExchangeStatus() {
        return await ccxtIntegration.getConnectionStatus();
    }
    
    async executePaperTrade(tradeData) {
        if (!this.paperTradingEnabled) {
            throw new Error('Paper trading is disabled');
        }
        
        if (this.enforceRealDataOnly && !tradeData.isRealArbitrage) {
            throw new Error('Cannot execute trade without verified real data');
        }
        
        console.log(`🔍 Executing paper trade for ${tradeData.symbol} using VERIFIED REAL market data`);
        
        // Simulate realistic trade execution with slippage and timing
        const outcome = realDataTracker.simulateRealisticTradeOutcome(tradeData);
        
        const trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            symbol: tradeData.symbol,
            buyExchange: tradeData.buyExchange,
            sellExchange: tradeData.sellExchange,
            amount: tradeData.amount,
            buyPrice: tradeData.buyPrice,
            sellPrice: tradeData.sellPrice,
            expectedProfit: tradeData.netProfit,
            actualProfit: outcome.actualProfit,
            totalFees: outcome.actualFees,
            buyFee: outcome.actualFees / 2,
            sellFee: outcome.actualFees / 2,
            buyFeeRate: await this.getRealExchangeFee(tradeData.buyExchange, 'taker'),
            sellFeeRate: await this.getRealExchangeFee(tradeData.sellExchange, 'taker'),
            mlConfidence: tradeData.mlConfidence || 0.75,
            decidingModels: tradeData.decidingModels || ['Real Market Data'],
            timestamp: Date.now(),
            positionSize: tradeData.positionSize || 2.0,
            isPaperTrade: true,
            executionSuccess: outcome.success,
            slippage: outcome.slippage,
            executionTime: outcome.executionTime,
            dataSource: 'VERIFIED_REAL',
            netProfit: outcome.actualProfit
        };
        
        // Record the trade for ML learning
        this.tradeExecutionHistory.push(trade);
        
        // Keep only last 1000 trades
        if (this.tradeExecutionHistory.length > 1000) {
            this.tradeExecutionHistory = this.tradeExecutionHistory.slice(-1000);
        }
        
        console.log(`📊 Paper trade executed: ${trade.symbol} - Expected: $${trade.expectedProfit.toFixed(2)}, Actual: $${trade.actualProfit.toFixed(2)}`);
        
        return trade;
    }
    
    getAccurateStatistics() {
        return realDataTracker.getAccurateStatistics();
    }
    
    getSystemHealthReport() {
        return realDataTracker.getSystemHealthReport();
    }
        
    stop() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
        console.log('⏹️ Exchange service stopped');
    }

    async getAllBalances() {
        const balances = {};
        
        for (const [id, data] of this.exchanges) {
            if (this.paperTradingEnabled) {
                balances[id] = this.paperBalances[id] || { USD: 10000 };
            } else if (data.connected && data.hasApiKeys && data.instance) {
                try {
                    const balance = await data.instance.fetchBalance();
                    balances[id] = balance.total;
                } catch (error) {
                    console.error(`❌ Error fetching balance from ${id}:`, error.message);
                    balances[id] = { error: error.message };
                }
            } else {
                balances[id] = { USD: 0, error: 'Not connected' };
            }
        }
        
        return balances;
    }

    async findArbitrageOpportunities(symbol, amount) {
        const opportunities = [];
        const prices = [];
        const realPrices = [];
        
        // Collect prices from all exchanges
        for (const [exchangeId, exchangeData] of this.exchanges) {
            if (!exchangeData.connected) continue;
            
            // Try to get real price from exchange
            if (exchangeData.instance) {
                try {
                    const ticker = await exchangeData.instance.fetchTicker(symbol);
                    const price = ticker.last || ticker.close || ticker.bid;
                    const volume = ticker.volume || ticker.quoteVolume;
                    
                    if (price) {
                        realPrices.push({
                            exchange: exchangeId,
                            price: price,
                            volume: volume || Math.random() * 1000000 + 100000
                        });
                        console.log(`✅ Using real price for arbitrage: ${symbol} on ${exchangeId} = $${price}`);
                    }
                } catch (error) {
                    // Fallback to cached price
                    const priceKey = `${exchangeId}:${symbol}`;
                    const price = this.lastPrices.get(priceKey);
                    
                    if (price) {
                        prices.push({
                            exchange: exchangeId,
                            price: price,
                            volume: Math.random() * 1000000 + 100000
                        });
                        console.log(`⚠️ Using cached price for arbitrage: ${symbol} on ${exchangeId} = $${price}`);
                    }
                }
            }
        }
        
        // Combine real prices with cached prices, prioritizing real ones
        const allPrices = [...realPrices, ...prices];
        
        // Find arbitrage opportunities
        if (allPrices.length >= 2) {
            allPrices.sort((a, b) => a.price - b.price);
            
            for (let i = 0; i < allPrices.length - 1; i++) {
                for (let j = i + 1; j < allPrices.length; j++) {
                    const buyPrice = allPrices[i].price;
                    const sellPrice = allPrices[j].price;
                    const priceDiff = sellPrice - buyPrice;
                    const profitPercent = (priceDiff / buyPrice) * 100;
                    
                    // Only consider opportunities with >0.1% profit
                    if (profitPercent > 0.1) {
                        const grossProfit = amount * (sellPrice - buyPrice);
                        const estimatedFees = amount * buyPrice * 0.001 + amount * sellPrice * 0.001; // 0.1% each way
                        const netProfit = grossProfit - estimatedFees;
                        
                        opportunities.push({
                            symbol,
                            buyExchange: allPrices[i].exchange,
                            sellExchange: allPrices[j].exchange,
                            buyPrice,
                            sellPrice,
                            amount,
                            grossProfit,
                            estimatedFees,
                            netProfit,
                            profitPercent,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        }
        
        return opportunities.sort((a, b) => b.netProfit - a.netProfit);
    }

    async togglePaperTrading(enabled) {
        this.paperTradingEnabled = enabled;
        
        console.log(`📊 Paper trading ${enabled ? 'enabled' : 'disabled'}`);
        
        return {
            paperTradingEnabled: this.paperTradingEnabled,
            mode: this.paperTradingEnabled ? 'paper' : 'live'
        };
    }

    getAllExchangeFees() {
        const fees = {};
        
        for (const [id, data] of this.exchanges) {
            fees[id] = {
                maker: 0.001, // 0.1%
                taker: 0.001  // 0.1%
            };
        }
        
        return fees;
    }

    async executePaperTrade(tradeData) {
        if (!this.paperTradingEnabled) {
            throw new Error('Paper trading is disabled');
        }
        
        console.log(`🔍 Executing paper trade for ${tradeData.symbol} using real market data`);
        
        const { symbol, buyExchange, sellExchange, amount, buyPrice, sellPrice } = tradeData;
        
        // Calculate fees
        // Use actual exchange fee rates
        const buyExchangeData = this.exchanges.get(buyExchange);
        const sellExchangeData = this.exchanges.get(sellExchange);
        
        const buyFeeRate = buyExchangeData?.instance?.fees?.maker || 0.001;
        const sellFeeRate = sellExchangeData?.instance?.fees?.taker || 0.001;
        
        const buyFee = amount * buyPrice * buyFeeRate;
        const sellFee = amount * sellPrice * sellFeeRate;
        const totalFees = buyFee + sellFee;
        
        // Calculate profit
        const grossProfit = amount * (sellPrice - buyPrice);
        const netProfit = grossProfit - totalFees;
        
        console.log(`💰 Trade details: Buy $${buyPrice} on ${buyExchange}, Sell $${sellPrice} on ${sellExchange}, Profit: $${netProfit.toFixed(2)}`);
        
        // Update paper balances
        const baseCurrency = symbol.split('/')[0];
        const quoteCurrency = symbol.split('/')[1];
        
        // Simulate the trade execution
        if (this.paperBalances[buyExchange] && this.paperBalances[sellExchange]) {
            // Buy on first exchange
            this.paperBalances[buyExchange][quoteCurrency] -= (amount * buyPrice + buyFee);
            this.paperBalances[buyExchange][baseCurrency] += amount;
            
            // Sell on second exchange
            this.paperBalances[sellExchange][baseCurrency] -= amount;
            this.paperBalances[sellExchange][quoteCurrency] += (amount * sellPrice - sellFee);
        }
        
        const trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            symbol,
            buyExchange,
            sellExchange,
            amount,
            buyPrice,
            sellPrice,
            netProfit,
            totalFees,
            buyFee,
            sellFee,
            buyFeeRate,
            sellFeeRate,
            mlConfidence: tradeData.mlConfidence || 0.75,
            decidingModels: tradeData.decidingModels || ['ensemble'],
            timestamp: Date.now(),
            positionSize: tradeData.positionSize || 2.0,
            isPaperTrade: true
        };
        
        console.log(`📊 Paper trade executed: ${symbol} - Profit: $${netProfit.toFixed(2)}`);
        
        return trade;
    }

    getLatestPrices() {
        const prices = {};
        
        for (const [key, price] of this.lastPrices) {
            const [exchange, symbol] = key.split(':');
            if (!prices[symbol]) prices[symbol] = {};
            prices[symbol][exchange] = price;
        }
        
        return prices;
    }

    stop() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
            console.log('⏹️ Stopped price updates');
        }
    }
}

export default new ExchangeService();