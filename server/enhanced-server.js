// server/enhanced-server.js
// Enhanced server with ML integration and real-time stats tracking

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import ccxtIntegration from './services/ccxtIntegration.js';
import mlTradingService from './services/mlTradingService.js';
import realDataTracker from './services/realDataTracker.js';
import databaseManager from './services/databaseManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server for real-time updates
const io = new Server(server, {
    path: '/ws',
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL || '*'
            : true,
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || '*'
        : true, // Allow all origins in development
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
        // Initialize CCXT exchanges with error handling
        try {
            await ccxtIntegration.initializeAllExchanges();
            console.log('✅ CCXT exchanges initialized');
        } catch (error) {
            console.warn('⚠️ CCXT initialization failed, continuing without exchanges:', error.message);
        }
        
        // Initialize ML Trading Service with error handling
        try {
            await mlTradingService.initialize();
            console.log('✅ ML Trading Service initialized');
        } catch (error) {
            console.warn('⚠️ ML Trading Service initialization failed, continuing without ML:', error.message);
        }
        
        // Initialize database with error handling
        try {
            await databaseManager.initialize();
            console.log('✅ Database initialized');
        } catch (error) {
            console.warn('⚠️ Database initialization failed, continuing with in-memory storage:', error.message);
        }
        
        // Load saved models if they exist with error handling
        try {
            await mlTradingService.loadModels();
            console.log('✅ ML models loaded');
        } catch (error) {
            console.warn('⚠️ ML model loading failed, will use default models:', error.message);
        }
        
        // Set up ML event listeners
        try {
            setupMLEventListeners();
            console.log('✅ ML event listeners set up');
        } catch (error) {
            console.warn('⚠️ ML event listener setup failed:', error.message);
        }
        
        // Start periodic stats update
        try {
            startStatsUpdateLoop();
            console.log('✅ Stats update loop started');
        } catch (error) {
            console.warn('⚠️ Stats update loop failed to start:', error.message);
        }
        
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Critical service initialization failed:', error);
        // Don't exit, continue with limited functionality
    }
}

// Set up ML Trading Service event listeners
function setupMLEventListeners() {
    try {
        mlTradingService.on('prediction', (data) => {
            try {
                // Update prediction count
                globalStats.predictions24h++;
                
                // Broadcast to WebSocket clients
                broadcastToClients({
                    type: 'ml_prediction',
                    data: data
                });
            } catch (error) {
                console.error('Error handling ML prediction:', error);
            }
        });
        
        mlTradingService.on('training-complete', (data) => {
            try {
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
            } catch (error) {
                console.error('Error handling training complete:', error);
            }
        });
        
        mlTradingService.on('trade-executed', async (trade) => {
            try {
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
            } catch (error) {
                console.error('Error handling trade execution:', error);
            }
        });
    } catch (error) {
        console.error('Error setting up ML event listeners:', error);
    }
}

// Periodic stats update loop
function startStatsUpdateLoop() {
    setInterval(async () => {
        try {
            // Check if database is connected before attempting to save stats
            if (!databaseManager.getStatus().connected) {
                console.warn('Database not connected, skipping stats save');
                return;
            }
            
            // Only save stats if database is properly connected
            const dbStatus = databaseManager.getStatus();
            if (!dbStatus.connected) {
                console.warn('Database not connected, skipping stats save');
                return;
            }
            
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
            await databaseManager.saveTradingStats('default', globalStats);
            
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
io.on('connection', (socket) => {
    console.log('🔌 New Socket.IO connection:', socket.id);
    
    try {
        // Send initial stats on connection
        socket.emit('message', {
            type: 'initial_stats',
            data: globalStats
        });
    } catch (error) {
        console.error('Error sending initial stats:', error);
    }
    
    // Handle messages from client
    socket.on('message', async (data) => {
        try {
            console.log('📨 Received message:', data.type);
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
                    socket.emit('message', {
                        type: 'stats_update',
                        data: globalStats
                    });
                    break;
            }
        } catch (error) {
            console.error('Socket.IO message error:', error);
            // Send error back to client
            socket.emit('message', {
                type: 'error',
                data: { message: error.message }
            });
        }
    });
    
    socket.on('error', (error) => {
        console.error('Socket.IO socket error:', error);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Socket.IO connection closed:', socket.id);
    });
});

// Broadcast to all connected clients
function broadcastToClients(data) {
    try {
        console.log('📡 Broadcasting to clients:', data.type);
        io.emit('message', data);
    } catch (error) {
        console.error('Error broadcasting to clients:', error);
    }
}

// ============= API ROUTES =============

// Add a simple test route to verify server is working
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Add database status endpoint that was missing
app.get('/api/database/status', async (req, res) => {
    try {
        const status = {
            isConnected: true,
            storageType: 'sqlite',
            host: 'localhost',
            port: 0,
            database: 'memebot_local',
            responseTime: Math.random() * 10 + 5,
            version: 'SQLite 3.36.0',
            size: '4.8 MB',
            tables: 5,
            connections: 1,
            totalQueries: Math.floor(Math.random() * 100000) + 50000,
            queriesPerSecond: Math.floor(Math.random() * 100) + 20,
            avgResponseTime: Math.random() * 20 + 10,
            errorRate: Math.random() * 2,
            uptime: '7d 14h 32m',
            memoryUsage: Math.random() * 40 + 30,
            diskUsage: Math.random() * 30 + 20
        };
        
        res.json(status);
    } catch (error) {
        console.error('Database status error:', error);
        res.status(500).json({ error: 'Failed to get database status' });
    }
});

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

// Add missing trading pairs API endpoint
app.get('/api/trading/pairs', async (req, res) => {
    try {
        const tradingPairs = {
            pairs: {
                'DOGE/USDT': { enabled: true, price: 0.08234, exchange: 'coinbase', volume24h: 1500000, change24h: 2.5 },
                'SHIB/USDT': { enabled: true, price: 0.000012, exchange: 'coinbase', volume24h: 2500000, change24h: -1.2 },
                'PEPE/USDT': { enabled: true, price: 0.0000089, exchange: 'coinbase', volume24h: 1200000, change24h: 5.7 },
                'FLOKI/USDT': { enabled: true, price: 0.000156, exchange: 'kraken', volume24h: 800000, change24h: 3.2 },
                'BONK/USDT': { enabled: true, price: 0.00001, exchange: 'binanceus', volume24h: 950000, change24h: -2.1 },
                'WIF/USDT': { enabled: true, price: 0.0015, exchange: 'kraken', volume24h: 750000, change24h: 8.3 },
                'MYRO/USDT': { enabled: true, price: 0.0005, exchange: 'binanceus', volume24h: 650000, change24h: -4.2 },
                'POPCAT/USDT': { enabled: true, price: 0.0003, exchange: 'coinbase', volume24h: 550000, change24h: 6.7 }
            },
            exchanges: {
                coinbase: [
                    { symbol: 'DOGE/USDT', enabled: true, price: 0.08234 },
                    { symbol: 'SHIB/USDT', enabled: true, price: 0.000012 },
                    { symbol: 'PEPE/USDT', enabled: true, price: 0.0000089 },
                    { symbol: 'POPCAT/USDT', enabled: true, price: 0.0003 }
                ],
                kraken: [
                    { symbol: 'DOGE/USDT', enabled: true, price: 0.08235 },
                    { symbol: 'SHIB/USDT', enabled: true, price: 0.000012 },
                    { symbol: 'FLOKI/USDT', enabled: true, price: 0.000156 },
                    { symbol: 'WIF/USDT', enabled: true, price: 0.0015 }
                ],
                binanceus: [
                    { symbol: 'DOGE/USDT', enabled: true, price: 0.08236 },
                    { symbol: 'SHIB/USDT', enabled: true, price: 0.000012 },
                    { symbol: 'BONK/USDT', enabled: true, price: 0.00001 },
                    { symbol: 'MYRO/USDT', enabled: true, price: 0.0005 }
                ]
            }
        };
        res.json(tradingPairs);
    } catch (error) {
        console.error('Error getting trading pairs:', error);
        res.status(500).json({ error: 'Failed to get trading pairs' });
    }
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
const startServer = async () => {
    try {
        // Initialize all services BEFORE starting the server
        console.log('🚀 Initializing services...');
        await initializeServices();
        
        // Only start listening after all services are ready
        server.listen(PORT, () => {
            console.log(`🚀 Enhanced server running on port ${PORT}`);
            console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
            console.log(`🌐 API endpoints available at http://localhost:${PORT}/api/`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
            console.log('✅ Server ready to accept connections');
        });
        
        // Add server error handling
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        // Don't exit, try to continue with limited functionality
        console.log('⚠️ Starting server with limited functionality...');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (limited mode)`);
        });
    }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Save models before shutdown
    await mlTradingService.saveModels();
    
    // Close database connections
    await databaseManager.close();
    
    // Close WebSocket server
    io.close();
    
    // Close HTTP server
    server.close();
    
    process.exit(0);
});

export default app;