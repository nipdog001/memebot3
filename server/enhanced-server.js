// server/enhanced-server.js
// Enhanced server with ML integration and real-time stats tracking

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import ccxtIntegration from './services/ccxtIntegration.js';
import mlTradingService from './services/mlTradingService.js';
import databaseManager from './services/databaseManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || '*'
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// Global state for tracking
let globalStats = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    winRate: 0,
    currentBalance: 10000,
    liveBalance: 5000,
    paperBalance: 10000,
    mlModelStats: [],
    exchangeStatus: {},
    activeModels: 0,
    predictions24h: 0,
    lastUpdate: Date.now()
};

// Initialize services on startup
async function initializeServices() {
    console.log('🚀 Initializing services...');
    
    try {
        // Initialize CCXT exchanges
        await ccxtIntegration.initializeAllExchanges();
        
        // Initialize ML Trading Service
        await mlTradingService.initialize();
        
        // Initialize database
        await databaseManager.initialize();
        
        // Load saved models if they exist
        await mlTradingService.loadModels();
        
        // Set up ML event listeners
        setupMLEventListeners();
        
        // Start periodic stats update
        startStatsUpdateLoop();
        
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
    }
}

// Set up ML Trading Service event listeners
function setupMLEventListeners() {
    mlTradingService.on('prediction', (data) => {
        // Update prediction count
        globalStats.predictions24h++;
        
        // Broadcast to WebSocket clients
        broadcastToClients({
            type: 'ml_prediction',
            data: data
        });
    });
    
    mlTradingService.on('training-complete', (data) => {
        // Update ML model stats
        const mlStats = mlTradingService.getStats();
        globalStats.mlModelStats = mlStats.models;
        globalStats.activeModels = mlStats.models.filter(m => m.enabled).length;
        
        // Save to database
        databaseManager.saveMLStats(mlStats);
        
        // Broadcast to clients
        broadcastToClients({
            type: 'training_complete',
            data: mlStats
        });
    });
    
    mlTradingService.on('trade-executed', async (trade) => {
        // Update trade stats
        globalStats.totalTrades++;
        
        if (trade.profit > 0) {
            globalStats.winningTrades++;
            globalStats.totalProfit += trade.profit;
        } else {
            globalStats.losingTrades++;
            globalStats.totalLoss += Math.abs(trade.profit);
        }
        
        globalStats.winRate = globalStats.totalTrades > 0 
            ? (globalStats.winningTrades / globalStats.totalTrades) * 100 
            : 0;
        
        // Update balances
        if (trade.isPaper) {
            globalStats.paperBalance += trade.profit;
        } else {
            globalStats.liveBalance += trade.profit;
        }
        
        // Save trade to database
        await databaseManager.saveTrade(trade);
        
        // Broadcast trade update
        broadcastToClients({
            type: 'trade_executed',
            data: trade
        });
    });
}

// Periodic stats update loop
function startStatsUpdateLoop() {
    setInterval(async () => {
        try {
            // Get exchange status
            const exchangeStatus = ccxtIntegration.getConnectionStatus();
            globalStats.exchangeStatus = exchangeStatus;
            
            // Get ML stats
            const mlStats = mlTradingService.getStats();
            globalStats.mlModelStats = mlStats.models;
            globalStats.activeModels = mlStats.models.filter(m => m.enabled).length;
            
            // Update timestamp
            globalStats.lastUpdate = Date.now();
            
            // Save to database
            await databaseManager.saveStats(globalStats);
            
            // Broadcast updates
            broadcastToClients({
                type: 'stats_update',
                data: globalStats
            });
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }, 5000); // Update every 5 seconds
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket connection');
    
    // Send initial stats on connection
    ws.send(JSON.stringify({
        type: 'initial_stats',
        data: globalStats
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'start_trading':
                    // Start trading with specified parameters
                    await handleStartTrading(data.params);
                    break;
                    
                case 'stop_trading':
                    // Stop trading
                    await handleStopTrading();
                    break;
                    
                case 'toggle_model':
                    // Enable/disable ML model
                    mlTradingService.toggleModel(data.modelType, data.enabled);
                    break;
                    
                case 'request_stats':
                    // Send current stats
                    ws.send(JSON.stringify({
                        type: 'stats_update',
                        data: globalStats
                    }));
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
    });
});

// Broadcast to all connected clients
function broadcastToClients(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

// ============= API ROUTES =============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            exchanges: ccxtIntegration.getConnectionStatus(),
            ml: mlTradingService.getStats(),
            database: databaseManager.getStatus()
        }
    });
});

// Get current stats
app.get('/api/stats', async (req, res) => {
    try {
        // Get fresh stats
        const mlStats = mlTradingService.getStats();
        const exchangeStatus = ccxtIntegration.getConnectionStatus();
        
        const stats = {
            ...globalStats,
            mlModelStats: mlStats.models,
            exchangeStatus: exchangeStatus,
            timestamp: Date.now()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get ML models
app.get('/api/ml/models', (req, res) => {
    const stats = mlTradingService.getStats();
    res.json(stats.models);
});

// Toggle ML model
app.post('/api/ml/toggle', (req, res) => {
    const { modelType, enabled } = req.body;
    mlTradingService.toggleModel(modelType, enabled);
    res.json({ success: true, modelType, enabled });
});

// Get exchange status
app.get('/api/exchange/status', (req, res) => {
    const status = ccxtIntegration.getConnectionStatus();
    res.json(status);
});

// Connect exchange
app.post('/api/exchange/connect', async (req, res) => {
    try {
        const { exchangeId, apiKey, apiSecret, password } = req.body;
        
        // Save credentials securely (in production, encrypt these)
        process.env[`${exchangeId.toUpperCase()}_API_KEY`] = apiKey;
        process.env[`${exchangeId.toUpperCase()}_API_SECRET`] = apiSecret;
        if (password) {
            process.env[`${exchangeId.toUpperCase()}_PASSWORD`] = password;
        }
        
        // Reinitialize exchange
        await ccxtIntegration.initializeAllExchanges();
        
        res.json({ 
            success: true, 
            status: ccxtIntegration.getConnectionStatus() 
        });
    } catch (error) {
        console.error('Error connecting exchange:', error);
        res.status(500).json({ error: 'Failed to connect exchange' });
    }
});

// Start trading
app.post('/api/trading/start', async (req, res) => {
    try {
        const { isPaper, pairs, riskLevel, tradeSize } = req.body;
        
        // Start trading logic here
        // This would interact with mlTradingService to begin automated trading
        
        res.json({ 
            success: true, 
            message: 'Trading started',
            isPaper: isPaper
        });
    } catch (error) {
        console.error('Error starting trading:', error);
        res.status(500).json({ error: 'Failed to start trading' });
    }
});

// Stop trading
app.post('/api/trading/stop', async (req, res) => {
    try {
        // Stop trading logic here
        
        res.json({ 
            success: true, 
            message: 'Trading stopped'
        });
    } catch (error) {
        console.error('Error stopping trading:', error);
        res.status(500).json({ error: 'Failed to stop trading' });
    }
});

// Get trade history
app.get('/api/trades/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const trades = await databaseManager.getTrades(limit);
        res.json(trades);
    } catch (error) {
        console.error('Error getting trade history:', error);
        res.status(500).json({ error: 'Failed to get trade history' });
    }
});

// Get trading statistics
app.get('/api/trades/statistics', async (req, res) => {
    try {
        const stats = await databaseManager.getTradingStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting trading statistics:', error);
        res.status(500).json({ error: 'Failed to get trading statistics' });
    }
});

// Save user state (for persistence)
app.post('/api/user/state', async (req, res) => {
    try {
        const { tradingState, tradingStats, trades, settings } = req.body;
        
        // Update global stats
        if (tradingStats) {
            globalStats = { ...globalStats, ...tradingStats };
        }
        
        // Save to database
        await databaseManager.saveUserState({
            tradingState,
            tradingStats: globalStats,
            trades,
            settings
        });
        
        res.json({ 
            success: true, 
            message: 'User state saved'
        });
    } catch (error) {
        console.error('Error saving user state:', error);
        res.status(500).json({ error: 'Failed to save user state' });
    }
});

// Get user state
app.get('/api/user/state', async (req, res) => {
    try {
        const userState = await databaseManager.getUserState();
        res.json(userState);
    } catch (error) {
        console.error('Error getting user state:', error);
        res.status(500).json({ error: 'Failed to get user state' });
    }
});

// Save ML models
app.post('/api/ml/save', async (req, res) => {
    try {
        await mlTradingService.saveModels();
        res.json({ success: true, message: 'Models saved successfully' });
    } catch (error) {
        console.error('Error saving models:', error);
        res.status(500).json({ error: 'Failed to save models' });
    }
});

// Force model training
app.post('/api/ml/train', async (req, res) => {
    try {
        const { modelType } = req.body;
        
        if (modelType) {
            await mlTradingService.trainModel(modelType);
        } else {
            // Train all models
            for (const [type] of mlTradingService.models) {
                await mlTradingService.trainModel(type);
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Training initiated',
            stats: mlTradingService.getStats()
        });
    } catch (error) {
        console.error('Error training models:', error);
        res.status(500).json({ error: 'Failed to train models' });
    }
});

// Get real-time market data
app.get('/api/market/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const exchangeId = req.query.exchange || 'coinbase';
        
        const data = await ccxtIntegration.getMarketData(exchangeId, symbol);
        res.json(data);
    } catch (error) {
        console.error('Error getting market data:', error);
        res.status(500).json({ error: 'Failed to get market data' });
    }
});

// WebSocket endpoint for real-time data streaming
app.get('/api/stream', (req, res) => {
    res.json({ 
        websocket: `ws://localhost:${PORT}/ws`,
        status: 'Use WebSocket connection for real-time updates'
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'dist');
    console.log('📁 Serving static files from:', distPath);
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Start server
server.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
    
    // Initialize all services
    await initializeServices();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Save models before shutdown
    await mlTradingService.saveModels();
    
    // Close database connections
    await databaseManager.close();
    
    // Close WebSocket server
    wss.close();
    
    // Close HTTP server
    server.close();
    
    process.exit(0);
});

export default app;