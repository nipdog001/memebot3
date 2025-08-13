// server/services/ccxtIntegration.js - COMPLETE FIXED VERSION
import ccxt from 'ccxt';

class CCXTIntegration {
    constructor() {
        this.exchanges = {};
        this.isInitialized = false;
        this.connectionStatus = {};
        this.marketCache = {};
        this.lastPriceUpdate = {};
    }

    async initializeAllExchanges() {
        console.log('🔄 Initializing all US exchanges with CCXT...');
        
        const exchangeConfigs = [
            {
                id: 'coinbase',
                name: 'Coinbase',
                class: ccxt.coinbase,
                credentials: {
                    apiKey: process.env.COINBASE_API_KEY,
                    secret: process.env.COINBASE_API_SECRET,
                    // No passphrase for v3 API
                    sandbox: false,
                    options: {
                        apiVersion: 'v3'
                    }
                }
            },
            {
                id: 'kraken',
                name: 'Kraken',
                class: ccxt.kraken,
                credentials: {
                    apiKey: process.env.KRAKEN_API_KEY,
                    secret: process.env.KRAKEN_API_SECRET
                }
            },
            {
                id: 'binanceus',
                name: 'Binance.US',
                class: ccxt.binanceus,
                credentials: {
                    apiKey: process.env.BINANCEUS_API_KEY,
                    secret: process.env.BINANCEUS_API_SECRET
                }
            },
            {
                id: 'cryptocom',
                name: 'Crypto.com',
                class: ccxt.cryptocom,
                credentials: {
                    apiKey: process.env.CRYPTOCOM_API_KEY,
                    secret: process.env.CRYPTOCOM_API_SECRET
                }
            }
        ];

        for (const config of exchangeConfigs) {
            await this.initializeExchange(config.id, config.credentials, config.class, config.name);
        }
        
        this.isInitialized = true;
        console.log(`✅ CCXT Integration initialized with ${Object.keys(this.exchanges).length} exchanges`);
        return this.getConnectionStatus();
    }

    async initializeExchange(exchangeId, credentials, ExchangeClass, exchangeName) {
        try {
            // Check if we have the required credentials
            const hasRequiredCredentials = credentials.apiKey && credentials.secret;
            if (!hasRequiredCredentials) {
                console.warn(`⚠️ ${exchangeName}: Missing API credentials, will skip real data`);
                this.connectionStatus[exchangeId] = {
                    connected: false,
                    error: 'Missing API credentials - add to .env file',
                    hasApiKeys: false
                };
                return null; // Skip this exchange
            }

            // Create exchange configuration
            const exchangeConfig = {
                apiKey: credentials.apiKey,
                secret: credentials.secret,
                enableRateLimit: true,
                timeout: 30000,
                rateLimit: 1000,
                options: {
                    adjustForTimeDifference: true,
                    recvWindow: 10000,
                    ...credentials.options
                }
            };

            // Add password/passphrase only if it exists and not Coinbase v3
            if (credentials.password && exchangeId !== 'coinbase') {
                exchangeConfig.password = credentials.password;
            }

            // Set sandbox mode if specified
            if (credentials.sandbox !== undefined) {
                exchangeConfig.sandbox = credentials.sandbox;
            }

            const exchange = new ExchangeClass(exchangeConfig);

            // Test connection by loading markets
            console.log(`🔄 Testing connection to ${exchangeName}...`);
            
            try {
                const markets = await exchange.loadMarkets();
                
                // Test with a real ticker fetch
                const testTicker = await exchange.fetchTicker('BTC/USDT');
                if (!testTicker || !testTicker.last) {
                    throw new Error('Invalid ticker response');
                }
                
                console.log(`✅ ${exchangeName}: Real data test successful (BTC = $${testTicker.last.toLocaleString()})`);
            } catch (testError) {
                console.error(`❌ ${exchangeName}: Real data test failed - ${testError.message}`);
                
                // Still try to load markets for basic functionality
                const markets = await exchange.loadMarkets();
                console.warn(`⚠️ ${exchangeName}: Connected but real data may be limited`);
            }
            
            // Store exchange and market data
            this.exchanges[exchangeId] = exchange;
            this.marketCache[exchangeId] = await exchange.loadMarkets();
            this.connectionStatus[exchangeId] = {
                connected: true,
                hasApiKeys: true,
                marketCount: Object.keys(this.marketCache[exchangeId]).length,
                lastConnected: Date.now()
            };
            
            console.log(`✅ ${exchangeName}: Connected successfully (${Object.keys(this.marketCache[exchangeId]).length} markets)`);
            return exchange;
            
        } catch (error) {
            console.error(`❌ ${exchangeName}: Connection failed -`, error.message);
            
            // Handle specific error types
            if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('Request blocked')) {
                console.warn(`⚠️ ${exchangeName}: Access forbidden - check API credentials and IP whitelist`);
                this.connectionStatus[exchangeId] = {
                    connected: false,
                    error: 'Access forbidden - check API credentials and IP restrictions',
                    hasApiKeys: !!(credentials.apiKey && credentials.secret),
                    lastAttempt: Date.now()
                };
                return null;
            }
            
            if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                console.warn(`⚠️ ${exchangeName}: Network connectivity issue`);
                this.connectionStatus[exchangeId] = {
                    connected: false,
                    error: 'Network connectivity issue',
                    hasApiKeys: !!(credentials.apiKey && credentials.secret),
                    lastAttempt: Date.now()
                };
                return null;
            }
            
            // Special handling for common errors
            if (exchangeId === 'coinbase' && error.message.includes('401')) {
                console.error('🔑 Coinbase authentication failed. Check:');
                console.error('   - Using Coinbase (not Pro) API keys');
                console.error('   - API Key format is correct');
                console.error('   - API Secret is complete');
                console.error('   - No passphrase needed for v3');
            }
            
            this.connectionStatus[exchangeId] = {
                connected: false,
                error: error.message,
                hasApiKeys: !!(credentials.apiKey && credentials.secret),
                lastAttempt: Date.now()
            };
            return null;
        }
    }

    async fetchRealTicker(exchangeId, symbol, maxRetries = 3) {
        const exchange = this.exchanges[exchangeId];
        if (!exchange) {
            console.warn(`❌ Exchange ${exchangeId} not available for ${symbol}`);
            return null;
        }
        
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const ticker = await exchange.fetchTicker(symbol);
                
                // Update last successful price update time
                this.lastPriceUpdate[`${exchangeId}:${symbol}`] = Date.now();
                
                return {
                    symbol,
                    exchange: exchangeId,
                    price: ticker.last || ticker.close,
                    bid: ticker.bid,
                    ask: ticker.ask,
                    volume24h: ticker.quoteVolume || ticker.baseVolume,
                    change24h: ticker.percentage,
                    timestamp: ticker.timestamp || Date.now(),
                    isRealData: true,
                    dataSource: 'CCXT_REAL'
                };
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${attempt}/${maxRetries}: Error fetching ${symbol} from ${exchangeId}:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        console.error(`❌ Failed to fetch ${symbol} from ${exchangeId} after ${maxRetries} attempts:`, lastError?.message);
        return null;
    }

    async fetchMultipleTickers(exchangeId, symbols) {
        const exchange = this.exchanges[exchangeId];
        if (!exchange) return {};
        
        try {
            // Some exchanges support fetching multiple tickers at once
            if (exchange.has['fetchTickers'] && exchangeId !== 'cryptocom') {
                const tickers = await exchange.fetchTickers(symbols);
                const result = {};
                
                for (const [symbol, ticker] of Object.entries(tickers)) {
                    if (symbols.includes(symbol)) {
                        result[symbol] = {
                            symbol,
                            exchange: exchangeId,
                            price: ticker.last || ticker.close,
                            bid: ticker.bid,
                            ask: ticker.ask,
                            volume24h: ticker.quoteVolume || ticker.baseVolume,
                            change24h: ticker.percentage,
                            timestamp: ticker.timestamp || Date.now(),
                            isRealData: true,
                            dataSource: 'CCXT_REAL_BATCH'
                        };
                    }
                }
                return result;
            } else {
                // Fallback to individual ticker fetches
                const result = {};
                for (const symbol of symbols) {
                    const ticker = await this.fetchRealTicker(exchangeId, symbol, 1);
                    if (ticker) {
                        result[symbol] = ticker;
                    }
                }
                return result;
            }
        } catch (error) {
            console.error(`❌ Error fetching multiple tickers from ${exchangeId}:`, error.message);
            return {};
        }
    }

    getAvailableSymbols(exchangeId) {
        const markets = this.marketCache[exchangeId];
        if (!markets) return [];
        
        // Filter for USDT pairs and common meme coins
        return Object.keys(markets).filter(symbol => {
            const market = markets[symbol];
            return market.active && 
                   symbol.endsWith('/USDT') && 
                   market.spot !== false; // Allow undefined or true
        });
    }

    getAllAvailableSymbols() {
        const allSymbols = new Set();
        
        for (const exchangeId of Object.keys(this.exchanges)) {
            const symbols = this.getAvailableSymbols(exchangeId);
            symbols.forEach(symbol => allSymbols.add(symbol));
        }
        
        return Array.from(allSymbols);
    }

    getConnectionStatus() {
        return {
            isInitialized: this.isInitialized,
            exchanges: { ...this.connectionStatus },
            connectedCount: Object.values(this.connectionStatus).filter(status => status.connected).length,
            totalExchanges: Object.keys(this.connectionStatus).length
        };
    }

    async testConnection(exchangeId) {
        const exchange = this.exchanges[exchangeId];
        if (!exchange) return false;
        
        try {
            // Test with a simple ticker fetch
            await exchange.fetchTicker('BTC/USDT');
            this.connectionStatus[exchangeId].lastTested = Date.now();
            return true;
        } catch (error) {
            console.error(`❌ Connection test failed for ${exchangeId}:`, error.message);
            return false;
        }
    }

    getExchange(exchangeId) {
        return this.exchanges[exchangeId] || null;
    }

    isExchangeConnected(exchangeId) {
        return this.connectionStatus[exchangeId]?.connected || false;
    }

    // Method to check if any exchanges are connected
    hasAnyConnection() {
        return Object.values(this.connectionStatus).some(status => status.connected);
    }

    // Get connected exchange IDs
    getConnectedExchangeIds() {
        return Object.entries(this.connectionStatus)
            .filter(([_, status]) => status.connected)
            .map(([id, _]) => id);
    }
}

// Create singleton instance
const ccxtIntegration = new CCXTIntegration();
export default ccxtIntegration;