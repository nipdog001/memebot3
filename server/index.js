// server/index.js - COMPLETE BACKEND SERVER
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import exchangeService from './services/exchangeService.js';
import ccxtIntegration from './services/ccxtIntegration.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || '*'
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

app.use(express.json());

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        realDataValidated: exchangeService.realDataValidated,
        connectedExchanges: ccxtIntegration.getConnectionStatus().connectedCount
    });
});

// ============= EXCHANGE ROUTES =============

// Get exchange status
app.get('/api/exchange/status', async (req, res) => {
    try {
        const status = await exchangeService.getExchangeStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting exchange status:', error);
        res.status(500).json({ error: 'Failed to get exchange status' });
    }
});

// Get ticker for specific exchange and symbol
app.get('/api/exchange/ticker/:exchange/:symbol', async (req, res) => {
    try {
        const { exchange, symbol } = req.params;
        const formattedSymbol = symbol.replace('-', '/'); // Convert DOGE-USDT to DOGE/USDT
        
        console.log(`📊 API: Fetching ${formattedSymbol} from ${exchange}`);
        
        // Check if exchange is connected
        if (!ccxtIntegration.isExchangeConnected(exchange)) {
            return res.status(404).json({ 
                error: `Exchange ${exchange} not connected`,
                isRealData: false 
            });
        }
        
        // Fetch real ticker data
        const ticker = await ccxtIntegration.fetchRealTicker(exchange, formattedSymbol);
        
        if (ticker) {
            console.log(`✅ API: Real data for ${formattedSymbol} on ${exchange}: $${ticker.price}`);
            res.json(ticker);
        } else {
            // Fallback to cache
            const cacheKey = `${exchange}:${formattedSymbol}`;
            const cachedData = exchangeService.realDataCache.get(cacheKey);
            
            if (cachedData) {
                res.json(cachedData);
            } else {
                res.status(404).json({ 
                    error: `No data available for ${formattedSymbol} on ${exchange}`,
                    isRealData: false 
                });
            }
        }
        
    } catch (error) {
        console.error('Error fetching ticker:', error);
        res.status(500).json({ 
            error: 'Failed to fetch ticker',
            message: error.message 
        });
    }
});

// Get market data for a symbol across all exchanges
app.get('/api/market-data/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const formattedSymbol = symbol.replace('-', '/');
        
        const marketData = {
            symbol: formattedSymbol,
            exchanges: {},
            timestamp: Date.now()
        };
        
        // Get data from all connected exchanges
        const connectedExchanges = Object.keys(ccxtIntegration.exchanges || {});
        
        if (connectedExchanges.length === 0) {
            // Fallback to cached data
            for (const [key, data] of exchangeService.realDataCache) {
                const [exchangeId, cachedSymbol] = key.split(':');
                if (cachedSymbol === formattedSymbol) {
                    marketData.exchanges[exchangeId] = {
                        price: data.price,
                        bid: data.bid,
                        ask: data.ask,
                        volume: data.volume24h,
                        change24h: data.change24h,
                        dataSource: data.validatedRealData ? 'VERIFIED_REAL' : 'CACHED',
                        timestamp: data.timestamp
                    };
                }
            }
        } else {
            // Fetch fresh data from connected exchanges
            for (const exchangeId of connectedExchanges) {
                try {
                    const ticker = await ccxtIntegration.fetchRealTicker(exchangeId, formattedSymbol);
                    if (ticker) {
                        marketData.exchanges[exchangeId] = {
                            price: ticker.price,
                            bid: ticker.bid,
                            ask: ticker.ask,
                            volume: ticker.volume24h,
                            change24h: ticker.change24h,
                            dataSource: ticker.dataSource || 'REAL_API',
                            timestamp: ticker.timestamp
                        };
                    }
                } catch (err) {
                    console.warn(`Failed to get ${formattedSymbol} from ${exchangeId}:`, err.message);
                }
            }
        }
        
        res.json(marketData);
        
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Get available trading pairs
app.get('/api/exchange/pairs', async (req, res) => {
    try {
        const pairs = await exchangeService.getAvailableTradingPairs();
        res.json(pairs);
    } catch (error) {
        console.error('Error getting trading pairs:', error);
        res.status(500).json({ error: 'Failed to get trading pairs' });
    }
});

// Get data source statistics
app.get('/api/exchange/data-stats', async (req, res) => {
    try {
        const stats = exchangeService.getDataSourceStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting data stats:', error);
        res.status(500).json({ error: 'Failed to get data statistics' });
    }
});

// ============= ARBITRAGE ROUTES =============

// Find arbitrage opportunities
app.post('/api/arbitrage/opportunities', async (req, res) => {
    try {
        const { symbol, amount } = req.body;
        
        if (!symbol || !amount) {
            return res.status(400).json({ error: 'Symbol and amount are required' });
        }
        
        const opportunities = await exchangeService.findArbitrageOpportunities(symbol, amount);
        res.json(opportunities);
        
    } catch (error) {
        console.error('Error finding arbitrage opportunities:', error);
        res.status(500).json({ error: 'Failed to find arbitrage opportunities' });
    }
});

// ============= TRADING ROUTES =============

// Execute a trade
app.post('/api/trades/execute', async (req, res) => {
    try {
        const tradeData = req.body;
        
        if (!exchangeService.realDataValidated) {
            return res.status(400).json({ 
                error: 'Cannot execute trades without real data validation',
                realDataValidated: false 
            });
        }
        
        const trade = await exchangeService.executePaperTrade(tradeData);
        
        // Broadcast trade via WebSocket
        broadcastToClients({
            type: 'trade_executed',
            trade
        });
        
        res.json(trade);
        
    } catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({ error: 'Failed to execute trade' });
    }
});

// Get trading statistics
app.get('/api/trades/statistics', async (req, res) => {
    try {
        const stats = exchangeService.getAccurateStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Error getting trading stats:', error);
        res.status(500).json({ error: 'Failed to get trading statistics' });
    }
});

// Get trade history
app.get('/api/trades/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = exchangeService.tradeExecutionHistory.slice(-limit);
        res.json(history);
    } catch (error) {
        console.error('Error getting trade history:', error);
        res.status(500).json({ error: 'Failed to get trade history' });
    }
});

// ============= SYSTEM ROUTES =============

// Get system health report
app.get('/api/system/health-report', async (req, res) => {
    try {
        const report = exchangeService.getSystemHealthReport();
        res.json(report);
    } catch (error) {
        console.error('Error getting system health:', error);
        res.status(500).json({ error: 'Failed to get system health report' });
    }
});

// Test real data validation
app.get('/api/test/real-data', async (req, res) => {
    const hasApiKeys = !!(
        process.env.COINBASE_API_KEY || 
        process.env.KRAKEN_API_KEY || 
        process.env.BINANCEUS_API_KEY ||
        process.env.CRYPTOCOM_API_KEY
    );
    
    res.json({
        environment: process.env.NODE_ENV || 'development',
        hasApiKeys,
        realDataValidated: exchangeService.realDataValidated,
        connectedExchanges: ccxtIntegration.getConnectionStatus(),
        timestamp: new Date().toISOString(),
        message: exchangeService.realDataValidated ? 'Using REAL data' : 'No real data connections'
    });
});

// ============= WEBSOCKET HANDLING =============

wss.on('connection', (ws) => {
    console.log('✅ New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 WebSocket message received:', data);
            
            // Handle different message types
            switch (data.type) {
                case 'subscribe':
                    ws.subscriptions = data.symbols || [];
                    ws.send(JSON.stringify({ 
                        type: 'subscribed', 
                        symbols: ws.subscriptions 
                    }));
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
    
    // Send initial status
    ws.send(JSON.stringify({
        type: 'connected',
        realDataValidated: exchangeService.realDataValidated,
        timestamp: Date.now()
    }));
});

// Broadcast to all WebSocket clients
function broadcastToClients(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

// Periodic price broadcasts
setInterval(() => {
    if (exchangeService.realDataValidated && exchangeService.realDataCache.size > 0) {
        const priceUpdates = [];
        
        for (const [key, data] of exchangeService.realDataCache) {
            if (Date.now() - data.timestamp < 60000) { // Only send recent data
                priceUpdates.push({
                    key,
                    ...data
                });
            }
        }
        
        if (priceUpdates.length > 0) {
            broadcastToClients({
                type: 'price_update',
                updates: priceUpdates,
                timestamp: Date.now()
            });
        }
    }
}, 5000);

// ============= SERVER STARTUP =============

async function startServer() {
    try {
        console.log('🚀 Starting Meme Coin Trading Bot Server...');
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔧 Port: ${PORT}`);
        
        // Check for API keys
        const hasApiKeys = !!(
            process.env.COINBASE_API_KEY || 
            process.env.KRAKEN_API_KEY || 
            process.env.BINANCEUS_API_KEY ||
            process.env.CRYPTOCOM_API_KEY
        );
        
        console.log(`🔑 API Keys: ${hasApiKeys ? 'Found' : 'Missing'}`);
        
        // Initialize exchange service
        await exchangeService.initialize();
        
        // Start server
        server.listen(PORT, () => {
            console.log(`\n✅ Server running on port ${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
            console.log(`\n🎯 Real Data Status: ${exchangeService.realDataValidated ? 'VALIDATED ✅' : 'NOT VALIDATED ❌'}`);
            
            if (!exchangeService.realDataValidated) {
                console.log('\n⚠️  WARNING: No real data connections!');
                console.log('📋 To fix:');
                console.log('   1. Set NODE_ENV=production');
                console.log('   2. Add exchange API keys to .env file');
                console.log('   3. Restart the server');
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down server...');
    exchangeService.stop();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start the server
startServer();