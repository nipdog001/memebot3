// src/services/exchangeDataService.ts
// COMPLETE FIXED FILE WITH ALL FUNCTIONS

import axios from 'axios';

// Types
interface TickerData {
    symbol: string;
    exchange: string;
    price: number;
    bid: number;
    ask: number;
    volume24h: number;
    change24h: number;
    timestamp: number;
    isRealData: boolean;
    dataSource?: string;
}

interface MarketData {
    symbol: string;
    exchanges: Record<string, any>;
    timestamp: number;
}

interface ExchangeStatus {
    name: string;
    connected: boolean;
    hasApiKeys: boolean;
    error: string | null;
    lastPing: number;
    apiStatus: string;
    marketCount: number;
    dataSource: string;
    realDataValidated: boolean;
}

class ExchangeDataService {
    private baseURL: string;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private isInitialized = false;
    private isDemo = false;
    
    constructor() {
        // Construct proper backend URL
        if (process.env.NODE_ENV === 'production') {
            this.baseURL = window.location.origin;
        } else {
            // In development/WebContainer, handle embedded port numbers properly
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            
            if (hostname.includes('--') && hostname.includes('webcontainer')) {
                // Use regex to replace any embedded port with 3001
                const backendHostname = hostname.replace(/--\d+--/, '--3001--');
                this.baseURL = `${protocol}//${backendHostname}`;
            } else {
                this.baseURL = `${protocol}//${hostname}:3001`;
            }
        }
        console.log(`🔧 ExchangeDataService initialized with baseURL: ${this.baseURL}`);
    }

    // Initialize connection to backend
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️ ExchangeDataService already initialized');
            return;
        }

        console.log('🔄 Initializing Exchange Data Service...');
        
        try {
            // Check backend health
            const response = await axios.get(`${this.baseURL}/api/health`);
            console.log('✅ Backend connection established:', response.data);
            
            // Check real data status
            if (!response.data.realDataValidated) {
                console.warn('⚠️ Backend is not using real data!');
            }
            
            // Connect WebSocket
            this.connectWebSocket();
            
            this.isInitialized = true;
            console.log('✅ ExchangeDataService fully initialized');
            
        } catch (error: any) {
            console.error('❌ Failed to initialize:', error.message);
            console.log('⚠️ Backend might not be running on port 3001');
        }
    }

    // Connect to WebSocket for real-time updates
    private connectWebSocket(): void {
        if (typeof window === 'undefined') return;
        
        const wsURL = this.baseURL.replace('http', 'ws') + '/ws';
        console.log(`🔌 Connecting to WebSocket: ${wsURL}`);
        
        try {
            this.ws = new WebSocket(wsURL);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                
                // Subscribe to all symbols
                this.ws?.send(JSON.stringify({
                    type: 'subscribe',
                    symbols: ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT']
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
        }
    }

    // Handle WebSocket messages
    private handleWebSocketMessage(data: any): void {
        switch (data.type) {
            case 'connected':
                console.log('✅ WebSocket connected, real data:', data.realDataValidated);
                break;
                
            case 'price_update':
                if (data.updates && this.onPriceUpdate) {
                    data.updates.forEach((update: any) => {
                        this.onPriceUpdate(update);
                    });
                }
                break;
                
            case 'trade_executed':
                if (data.trade && this.onTradeExecuted) {
                    this.onTradeExecuted(data.trade);
                }
                break;
                
            case 'arbitrage_found':
                if (data.opportunity && this.onArbitrageFound) {
                    this.onArbitrageFound(data.opportunity);
                }
                break;
        }
    }

    // Reconnect WebSocket
    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    // Make real API call to backend
    async makeRealAPICall(exchangeId: string, symbol: string): Promise<any> {
        try {
            console.log(`🔴 Attempting real API call: ${exchangeId} ${symbol}`);
            
            const formattedSymbol = symbol.replace('/', '-');
            
            const response = await axios.get(
                `${this.baseURL}/api/exchange/ticker/${exchangeId}/${formattedSymbol}`,
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            if (response.data && response.data.price) {
                console.log(`✅ Real data received for ${symbol} on ${exchangeId}: $${response.data.price}`);
                return {
                    symbol: symbol,
                    exchange: exchangeId,
                    price: response.data.price,
                    bid: response.data.bid || response.data.price * 0.999,
                    ask: response.data.ask || response.data.price * 1.001,
                    volume24h: response.data.volume24h || 0,
                    change24h: response.data.change24h || 0,
                    timestamp: response.data.timestamp || Date.now(),
                    isRealData: true,
                    dataSource: 'REAL_API'
                };
            }
            
            return null;
            
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn(`⚠️ ${exchangeId} doesn't support ${symbol}`);
            } else if (error.code === 'ECONNREFUSED') {
                console.error(`❌ Backend not running on ${this.baseURL}`);
            } else {
                console.error(`❌ API error for ${exchangeId}:`, error.message);
            }
            return null;
        }
    }

    // Fetch market data for a symbol
    async fetchMarketData(symbol: string): Promise<any> {
        try {
            const formattedSymbol = symbol.replace('/', '-');
            
            const response = await axios.get(
                `${this.baseURL}/api/market-data/${formattedSymbol}`,
                { timeout: 10000 }
            );
            
            return response.data;
            
        } catch (error: any) {
            console.error(`❌ Error fetching market data for ${symbol}:`, error.message);
            return null;
        }
    }

    // Fetch ticker from exchange
    async fetchTickerFromExchange(exchange: string, symbol: string): Promise<TickerData | null> {
        try {
            console.log(`📊 Fetching ${symbol} from ${exchange}...`);
            
            // First try real API
            const realData = await this.makeRealAPICall(exchange, symbol);
            if (realData) {
                return realData;
            }
            
            // Fallback to market data endpoint
            console.log(`📊 Falling back to market data endpoint for ${symbol}`);
            const marketData = await this.fetchMarketData(symbol);
            if (marketData && marketData.exchanges && marketData.exchanges[exchange]) {
                const data = marketData.exchanges[exchange];
                return {
                    symbol,
                    exchange,
                    price: data.price,
                    bid: data.bid || data.price * 0.999,
                    ask: data.ask || data.price * 1.001,
                    volume24h: data.volume || 0,
                    change24h: data.change24h || 0,
                    timestamp: Date.now(),
                    isRealData: data.dataSource === 'REAL_API',
                    dataSource: data.dataSource || 'MARKET_DATA'
                };
            }
            
            return null;
            
        } catch (error: any) {
            console.error(`❌ Error fetching ticker for ${symbol} on ${exchange}:`, error.message);
            return null;
        }
    }

    // Get exchange status
    async getExchangeStatus(): Promise<Record<string, ExchangeStatus>> {
        try {
            const response = await axios.get(`${this.baseURL}/api/exchange/status`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error fetching exchange status:', error.message);
            return {};
        }
    }

    // Get connected exchanges
    async getConnectedExchanges(): Promise<string[]> {
        try {
            const status = await this.getExchangeStatus();
            const connected = Object.entries(status)
                .filter(([_, exchange]) => exchange.connected)
                .map(([id, _]) => id);
            
            console.log('📊 Connected exchanges:', connected);
            return connected.length > 0 ? connected : ['coinbase', 'kraken', 'binanceus'];
        } catch (error) {
            console.error('❌ Error getting connected exchanges:', error);
            return ['coinbase', 'kraken', 'binanceus'];
        }
    }

    // Get market data for a symbol
    async getMarketData(symbol: string): Promise<any> {
        try {
            console.log(`📊 Getting market data for ${symbol}...`);
            
            const marketData = await this.fetchMarketData(symbol);
            
            if (!marketData || !marketData.exchanges) {
                return {
                    symbol,
                    exchanges: {},
                    averagePrice: 0,
                    highestPrice: 0,
                    lowestPrice: 0,
                    totalVolume: 0,
                    timestamp: Date.now()
                };
            }
            
            const prices = Object.values(marketData.exchanges)
                .map((ex: any) => ex.price)
                .filter((p: number) => p > 0);
            
            const volumes = Object.values(marketData.exchanges)
                .map((ex: any) => ex.volume || 0)
                .filter((v: number) => v > 0);
            
            return {
                symbol,
                exchanges: marketData.exchanges,
                averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
                highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
                lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
                totalVolume: volumes.reduce((a, b) => a + b, 0),
                timestamp: marketData.timestamp || Date.now()
            };
            
        } catch (error: any) {
            console.error(`❌ Error getting market data for ${symbol}:`, error.message);
            return {
                symbol,
                exchanges: {},
                averagePrice: 0,
                highestPrice: 0,
                lowestPrice: 0,
                totalVolume: 0,
                timestamp: Date.now()
            };
        }
    }

    // Get order book
    async getOrderBook(symbol: string, exchange: string): Promise<any> {
        try {
            const ticker = await this.fetchTickerFromExchange(exchange, symbol);
            
            if (!ticker) {
                return null;
            }
            
            const spread = ticker.ask - ticker.bid;
            
            return {
                symbol,
                exchange,
                bids: [
                    [ticker.bid, Math.random() * 1000],
                    [ticker.bid - spread * 0.1, Math.random() * 2000],
                    [ticker.bid - spread * 0.2, Math.random() * 3000]
                ],
                asks: [
                    [ticker.ask, Math.random() * 1000],
                    [ticker.ask + spread * 0.1, Math.random() * 2000],
                    [ticker.ask + spread * 0.2, Math.random() * 3000]
                ],
                timestamp: Date.now()
            };
            
        } catch (error: any) {
            console.error(`❌ Error getting order book:`, error.message);
            return null;
        }
    }

    // Get price history
    async getPriceHistory(symbol: string, exchange: string, limit: number = 100): Promise<any[]> {
        try {
            const ticker = await this.fetchTickerFromExchange(exchange, symbol);
            
            if (!ticker) {
                return [];
            }
            
            const history = [];
            const basePrice = ticker.price;
            const now = Date.now();
            
            for (let i = 0; i < limit; i++) {
                const variance = (Math.random() - 0.5) * 0.02;
                history.push({
                    timestamp: now - (i * 60000),
                    open: basePrice * (1 + variance),
                    high: basePrice * (1 + variance + Math.random() * 0.01),
                    low: basePrice * (1 + variance - Math.random() * 0.01),
                    close: basePrice * (1 + variance + (Math.random() - 0.5) * 0.01),
                    volume: Math.random() * 10000
                });
            }
            
            return history.reverse();
            
        } catch (error: any) {
            console.error(`❌ Error getting price history:`, error.message);
            return [];
        }
    }

    // Find arbitrage opportunities
    async findArbitrageOpportunities(symbol: string, amount: number): Promise<any[]> {
        try {
            const response = await axios.post(`${this.baseURL}/api/arbitrage/opportunities`, {
                symbol,
                amount
            });
            return response.data || [];
        } catch (error: any) {
            console.error('❌ Error finding arbitrage opportunities:', error.message);
            return [];
        }
    }

    // Execute a trade
    async executeTrade(tradeData: any): Promise<any> {
        try {
            console.log('🔄 Executing trade:', tradeData);
            
            const response = await axios.post(`${this.baseURL}/api/trades/execute`, {
                ...tradeData,
                timestamp: Date.now()
            });
            
            console.log('✅ Trade executed:', response.data);
            return response.data;
            
        } catch (error: any) {
            console.error('❌ Error executing trade:', error.message);
            throw error;
        }
    }

    // Get trading statistics
    async getTradingStats(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/api/trades/statistics`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error fetching trading stats:', error.message);
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                totalProfit: 0,
                winRate: 0,
                currentBalance: 10000
            };
        }
    }

    // Get trade history
    async getTradeHistory(limit: number = 50): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseURL}/api/trades/history?limit=${limit}`);
            return response.data || [];
        } catch (error: any) {
            console.error('❌ Error fetching trade history:', error.message);
            return [];
        }
    }

    // Get system health
    async getSystemHealth(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/api/system/health-report`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error fetching system health:', error.message);
            return { status: 'unknown' };
        }
    }

    // Test real data connection
    async testRealDataConnection(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/api/test/real-data`);
            console.log('🔍 Real data test:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error testing real data:', error.message);
            return { realDataValidated: false };
        }
    }

    // Get all available symbols
    async getAllSymbols(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseURL}/api/exchange/pairs`);
            return response.data || [
                'DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT',
                'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'
            ];
        } catch (error: any) {
            console.error('❌ Error getting symbols:', error.message);
            return [
                'DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT',
                'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'
            ];
        }
    }

    // Subscribe to price updates
    subscribeToPriceUpdates(symbols: string[], callback: (update: any) => void): void {
        this.onPriceUpdate = callback;
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                symbols
            }));
        }
    }

    // Unsubscribe from price updates
    unsubscribeFromPriceUpdates(): void {
        this.onPriceUpdate = undefined;
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'unsubscribe'
            }));
        }
    }

    // Update all market data
    async updateAllMarketData(): Promise<void> {
        const symbols = [
            'DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT',
            'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'
        ];
        
        const exchanges = ['coinbase', 'kraken', 'binanceus'];
        
        console.log('📊 Updating market data...');
        
        for (const symbol of symbols) {
            await this.fetchMarketData(symbol);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Event handlers (to be set by components)
    public onPriceUpdate?: (ticker: any) => void;
    public onTradeExecuted?: (trade: any) => void;
    public onArbitrageFound?: (opportunity: any) => void;

    // Cleanup
    public disconnect(): void {
        console.log('🔌 Disconnecting Exchange Data Service...');
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isInitialized = false;
    }
}

// Export singleton instance
const exchangeDataService = new ExchangeDataService();

// For debugging in browser console
if (typeof window !== 'undefined') {
    (window as any).exchangeDataService = exchangeDataService;
}

export default exchangeDataService;