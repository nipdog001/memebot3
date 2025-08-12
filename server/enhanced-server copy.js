// server/enhanced-server.js - Complete version with database integration
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services
import exchangeService from './services/exchangeService.js';
import mlTradingEngine from './services/mlTradingEngine.js';

// Import database manager
import databaseManager from './database/database.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS Configuration
const corsOptions = {
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'https://web-production-323cf.up.railway.app'
        ];
        
        if (process.env.NODE_ENV === 'production') {
            if (allowedOrigins.includes(origin) || origin.includes('railway.app')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO with proper CORS
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://web-production-323cf.up.railway.app'] 
            : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Find dist path
const possibleDistPaths = [
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, '..', '..', 'dist'),
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'dist'),
];

let distPath = null;
for (const testPath of possibleDistPaths) {
    if (fs.existsSync(testPath)) {
        distPath = testPath;
        console.log('âœ… Found dist directory at:', distPath);
        break;
    }
}

if (!distPath) {
    console.error('âŒ No dist directory found! Tried:', possibleDistPaths);
    distPath = path.join(process.cwd(), 'dist');
}

// Serve static files
app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        
        if (ext === '.js' || ext === '.css') {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// Initialize stats from database on startup
let persistentStats = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    totalFees: 0,
    dailyPL: 0,
    weeklyPL: 0,
    monthlyPL: 0,
    winRate: 0,
    lastResetDate: new Date().toISOString(),
    weeklyComparison: 0,
    monthlyComparison: 0,
    dailyWins: 0,
    dailyLosses: 0,
    dailyFees: 0,
    previousDayPL: 0,
    lastDayRollover: new Date().toDateString()
};

// Trading pairs configuration
let tradingPairs = {
    'PEPE/USDT': { enabled: true, exchange: 'coinbase', volume24h: 0, price: 0, change24h: 0 },
    'DOGE/USDT': { enabled: true, exchange: 'coinbase', volume24h: 0, price: 0, change24h: 0 },
    'SHIB/USDT': { enabled: true, exchange: 'coinbase', volume24h: 0, price: 0, change24h: 0 },
    'FLOKI/USDT': { enabled: false, exchange: 'kraken', volume24h: 0, price: 0, change24h: 0 },
    'BONK/USDT': { enabled: true, exchange: 'coinbase', volume24h: 0, price: 0, change24h: 0 },
    'WIF/USDT': { enabled: false, exchange: 'gemini', volume24h: 0, price: 0, change24h: 0 },
    'SAITAMA/USDT': { enabled: false, exchange: 'kraken', volume24h: 0, price: 0, change24h: 0 },
    'AKITA/USDT': { enabled: false, exchange: 'gemini', volume24h: 0, price: 0, change24h: 0 }
};

// User state
let userState = {
    isAuthenticated: true,
    tier: 'enterprise',
    preferences: {
        mlConfidenceThreshold: 75,
        maxPositionSize: 10,
        riskLevel: 'medium',
        enableNotifications: true
    },
    limits: {
        maxTrades: -1,
        maxCapital: -1,
        tradesUsed: 0,
        capitalUsed: 0
    },
    settings: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        syncEnabled: true
    }
};

// Track connected clients
const connectedClients = new Map();

// Initialize database
async function initializeDatabase() {
    try {
        await databaseManager.initializeDatabase();
        const status = databaseManager.getConnectionStatus();
        console.log('ðŸ“Š Database Status:', status);
        
        if (status.isConnected) {
            console.log(`âœ… Connected to ${status.storageType} database`);
            
            // Load initial stats
            const stats = await databaseManager.getCurrentStats('default');
            persistentStats = { ...persistentStats, ...stats };
            console.log('ðŸ“Š Loaded stats from database:', stats);
            
            // Load user settings
            const settings = await databaseManager.getTradingSettings('default');
            if (settings) {
                userState.preferences.mlConfidenceThreshold = settings.ml_confidence_threshold;
                userState.preferences.maxPositionSize = settings.position_size;
                userState.preferences.riskLevel = settings.risk_level;
            }
        } else {
            console.log('âš ï¸ Running without database - data will not persist');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Broadcast stats to all connected clients
function broadcastStats(excludeSocketId = null) {
    const dataToSend = {
        stats: persistentStats,
        timestamp: new Date().toISOString(),
        serverTime: new Date().toLocaleTimeString()
    };
    
    if (excludeSocketId) {
        io.except(excludeSocketId).emit('statsUpdate', dataToSend);
    } else {
        io.emit('statsUpdate', dataToSend);
    }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = databaseManager.getConnectionStatus();
    
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        connectedClients: connectedClients.size,
        stats: {
            totalTrades: persistentStats.totalTrades,
            totalProfit: persistentStats.totalProfit
        },
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus.storageType,
        databaseConnected: dbStatus.isConnected,
        distPath: distPath,
        distExists: fs.existsSync(distPath)
    });
});

// Get detailed stats from database
app.get('/api/stats/detailed', async (req, res) => {
    try {
        const stats = await databaseManager.getCurrentStats('default');
        res.json({
            ...stats,
            serverTime: new Date().toISOString(),
            syncEnabled: true,
            database: databaseManager.getConnectionStatus().storageType
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.json(persistentStats);
    }
});

// Update stats - saves to database
app.post('/api/stats/update', async (req, res) => {
    const { trades, profit, fees, isWin, clientId, tradeData } = req.body;
    
    console.log('Stats update received:', { trades, profit, fees, isWin });
    
    try {
        // Save trade to database if we have complete data
        if (tradeData) {
            const tradeId = await databaseManager.saveTrade('default', {
                ...tradeData,
                timestamp: Date.now()
            });
            
            console.log('Trade saved to database with ID:', tradeId);
        }
        
        // Update stats in database
        const currentStats = await databaseManager.getCurrentStats('default');
        
        // Calculate new stats
        const newStats = {
            totalTrades: currentStats.totalTrades + (trades || 1),
            winningTrades: currentStats.winningTrades + (isWin ? 1 : 0),
            losingTrades: currentStats.losingTrades + (isWin ? 0 : 1),
            totalProfit: currentStats.totalProfit + (profit || 0),
            totalFees: currentStats.totalFees + (fees || 0),
            dailyPL: currentStats.dailyPL + (profit || 0),
            winRate: 0
        };
        
        // Calculate win rate
        if (newStats.totalTrades > 0) {
            newStats.winRate = (newStats.winningTrades / newStats.totalTrades) * 100;
        }
        
        // Save updated stats
        await databaseManager.saveTradingStats('default', newStats);
        
        // Update in-memory stats
        persistentStats = { ...persistentStats, ...newStats };
        
        // Broadcast update
        broadcastStats(clientId);
        
        res.json({ 
            success: true, 
            stats: persistentStats,
            savedToDatabase: true
        });
    } catch (error) {
        console.error('Error updating stats:', error);
        res.status(500).json({ error: 'Failed to update stats' });
    }
});

// Reset stats
app.post('/api/stats/reset', async (req, res) => {
    const { zeroOut } = req.body;
    
    console.log('Stats reset requested:', { zeroOut });
    
    if (zeroOut) {
        // Reset in-memory stats
        persistentStats = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfit: 0,
            totalFees: 0,
            dailyPL: 0,
            weeklyPL: 0,
            monthlyPL: 0,
            winRate: 0,
            lastResetDate: new Date().toISOString(),
            weeklyComparison: 0,
            monthlyComparison: 0,
            dailyWins: 0,
            dailyLosses: 0,
            dailyFees: 0,
            previousDayPL: 0,
            lastDayRollover: new Date().toDateString()
        };
        
        // Save reset stats to database
        await databaseManager.saveTradingStats('default', persistentStats);
        
        // Broadcast reset to ALL clients
        io.emit('statsReset', { 
            resetDate: new Date().toISOString(),
            stats: persistentStats 
        });
    }
    
    res.json({ 
        success: true, 
        stats: persistentStats,
        message: 'Stats reset (historical trades preserved in database)'
    });
});

// Get trades from database
app.get('/api/trades', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const trades = await databaseManager.getTrades('default', parseInt(limit));
        
        res.json({
            trades,
            total: trades.length,
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error getting trades:', error);
        res.status(500).json({ error: 'Failed to get trades' });
    }
});

// Generate reports
app.get('/api/reports/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { date } = req.query;
        
        const report = await databaseManager.generateReport('default', type, date);
        res.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
    const status = databaseManager.getConnectionStatus();
    const stats = await databaseManager.getCurrentStats('default');
    
    res.json({
        ...status,
        totalTrades: stats.totalTrades,
        lastTrade: stats.lastUpdated
    });
});

// User state endpoints
app.get('/api/user/state', (req, res) => {
    res.json(userState);
});

app.post('/api/user/state', async (req, res) => {
    const { preferences, settings } = req.body;
    
    if (preferences) {
        userState.preferences = { ...userState.preferences, ...preferences };
        if (preferences.mlConfidenceThreshold !== undefined) {
            mlTradingEngine.setThreshold(preferences.mlConfidenceThreshold);
        }
    }
    
    if (settings) {
        userState.settings = { ...userState.settings, ...settings };
    }
    
    // Save to database
    await databaseManager.saveTradingSettings('default', {
        mlConfidenceThreshold: userState.preferences.mlConfidenceThreshold,
        positionSize: userState.preferences.maxPositionSize,
        riskLevel: userState.preferences.riskLevel,
        unlimitedTrades: userState.limits.maxTrades === -1
    });
    
    io.emit('userStateUpdate', userState);
    
    res.json({ 
        success: true, 
        message: 'User state updated and synced',
        state: userState
    });
});

// Trading endpoints
app.get('/api/trading/status', (req, res) => {
    res.json({
        isActive: mlTradingEngine.isActive || false,
        mode: exchangeService.paperTradingEnabled ? 'paper' : 'live',
        balance: 10000,
        openPositions: 0,
        dailyTrades: persistentStats.totalTrades,
        profitToday: persistentStats.dailyPL
    });
});

app.post('/api/trading/toggle', (req, res) => {
    const { active } = req.body;
    console.log('Trading toggle requested:', active);
    
    io.emit('tradingStatusUpdate', { isActive: active });
    
    res.json({ success: true, isActive: active });
});

// Trading pairs endpoints
app.get('/api/trading/pairs', (req, res) => {
    res.json({
        pairs: tradingPairs,
        totalPairs: Object.keys(tradingPairs).length,
        enabledPairs: Object.values(tradingPairs).filter(p => p.enabled).length
    });
});

app.post('/api/trading/pairs/toggle', (req, res) => {
    const { pair, enabled } = req.body;
    
    if (!pair || !tradingPairs.hasOwnProperty(pair)) {
        return res.status(400).json({ 
            error: 'Invalid pair',
            validPairs: Object.keys(tradingPairs)
        });
    }
    
    tradingPairs[pair].enabled = enabled;
    
    io.emit('tradingPairsUpdate', {
        pair: pair,
        enabled: enabled,
        allPairs: tradingPairs
    });
    
    res.json({ 
        success: true, 
        pair: pair,
        enabled: enabled,
        message: `${pair} trading ${enabled ? 'enabled' : 'disabled'}`
    });
});

// ML Models endpoints
app.get('/api/ml/models', (req, res) => {
    const models = [
        { id: 1, name: 'Linear Regression', accuracy: 72.5, enabled: true },
        { id: 2, name: 'Polynomial Regression', accuracy: 75.1, enabled: true },
        { id: 3, name: 'Moving Average', accuracy: 68.3, enabled: true },
        { id: 4, name: 'RSI Momentum', accuracy: 79.2, enabled: true },
        { id: 5, name: 'Bollinger Bands', accuracy: 81.7, enabled: true },
        { id: 6, name: 'MACD Signal', accuracy: 77.8, enabled: true },
        { id: 7, name: 'LSTM Neural Network', accuracy: 85.4, enabled: true },
        { id: 8, name: 'Ensemble Meta-Model', accuracy: 91.3, enabled: true }
    ];
    
    res.json(models);
});

// ML Status endpoint (was missing)
app.get('/api/ml/status', (req, res) => {
    const stats = mlTradingEngine.getStatistics();
    res.json({
        models: [
            { type: 'linear_regression', name: 'Linear Regression', accuracy: 72.5, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'polynomial_regression', name: 'Polynomial Regression', accuracy: 75.1, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'moving_average', name: 'Moving Average', accuracy: 68.3, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'rsi_momentum', name: 'RSI Momentum', accuracy: 79.2, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'bollinger_bands', name: 'Bollinger Bands', accuracy: 81.7, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'macd_signal', name: 'MACD Signal', accuracy: 77.8, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'lstm_neural', name: 'LSTM Neural Network', accuracy: 85.4, enabled: true, predictions: 0, profitGenerated: 0 },
            { type: 'ensemble_meta', name: 'Ensemble Meta-Model', accuracy: 91.3, enabled: true, predictions: 0, profitGenerated: 0 }
        ]
    });
});

// Exchanges list endpoint (was missing)
app.get('/api/exchanges', async (req, res) => {
    try {
        const status = await exchangeService.getExchangeStatus();
        const exchanges = Object.entries(status).map(([id, data]) => ({
            id,
            name: data.name,
            connected: data.connected,
            enabled: true,
            hasKeys: data.hasApiKeys,
            fees: { maker: 0.001, taker: 0.001 },
            totalPairs: 20,
            enabledPairs: 5
        }));
        res.json(exchanges);
    } catch (error) {
        res.json([]);
    }
});

// Trading pairs endpoint (was missing)
app.get('/api/pairs/all', (req, res) => {
    const exchanges = {};
    ['coinbase', 'kraken', 'binanceus'].forEach(ex => {
        exchanges[ex] = Object.keys(tradingPairs).map(symbol => ({
            symbol,
            enabled: tradingPairs[symbol]?.enabled || false,
            isMeme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'].some(m => symbol.includes(m))
        }));
    });
    res.json({
        exchanges,
        enabledPairs: Object.values(tradingPairs).filter(p => p.enabled).length
    });
});

// WebSocket endpoint info
app.get('/api/ws/info', (req, res) => {
    const protocol = req.secure || process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
    const host = req.get('host');
    res.json({
        url: `${protocol}://${host}`,
        connected: io.engine.clientsCount || 0,
        clients: Array.from(connectedClients.values()).map(c => ({
            id: c.id,
            device: c.device,
            connectedAt: c.connectedAt
        }))
    });
});

// Exchange Service Endpoints
app.get('/api/exchanges/status', async (req, res) => {
    try {
        const status = await exchangeService.getExchangeStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting exchange status:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/exchanges/balances', async (req, res) => {
    try {
        const balances = await exchangeService.getAllBalances();
        res.json(balances);
    } catch (error) {
        console.error('Error getting balances:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/exchanges/toggle-mode', async (req, res) => {
    try {
        const { paperTrading } = req.body;
        const result = await exchangeService.togglePaperTrading(paperTrading);
        
        io.emit('tradingModeChanged', {
            mode: result.mode,
            paperTradingEnabled: result.paperTradingEnabled,
            timestamp: new Date().toISOString()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error toggling trading mode:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/exchanges/fees', (req, res) => {
    const fees = exchangeService.getAllExchangeFees();
    res.json({ fees });
});

app.post('/api/exchanges/arbitrage', async (req, res) => {
    try {
        const { symbol, amount } = req.body;
        
        if (!symbol || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields: symbol, amount' 
            });
        }
        
        const opportunities = await exchangeService.findArbitrageOpportunities(
            symbol,
            parseFloat(amount)
        );
        
        res.json({ 
            symbol,
            amount: parseFloat(amount),
            opportunities,
            found: opportunities.length,
            bestOpportunity: opportunities[0] || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ML Trading Engine Endpoints
app.get('/api/ml/trading/stats', (req, res) => {
    const stats = mlTradingEngine.getStatistics();
    res.json({
        ...stats,
        isActive: mlTradingEngine.isActive || false,
        paperTrading: exchangeService.paperTradingEnabled
    });
});

app.post('/api/ml/trading/threshold', async (req, res) => {
    const { threshold } = req.body;
    
    if (threshold === undefined || threshold < 0 || threshold > 100) {
        return res.status(400).json({ error: 'Threshold must be between 0 and 100' });
    }
    
    const newThreshold = mlTradingEngine.setThreshold(threshold);
    userState.preferences.mlConfidenceThreshold = newThreshold;
    
    // Save to database
    await databaseManager.saveTradingSettings('default', {
        mlConfidenceThreshold: newThreshold,
        positionSize: userState.preferences.maxPositionSize,
        riskLevel: userState.preferences.riskLevel
    });
    
    io.emit('mlThresholdChanged', {
        threshold: newThreshold,
        timestamp: new Date().toISOString()
    });
    
    res.json({ 
        success: true, 
        threshold: newThreshold,
        message: `ML confidence threshold set to ${newThreshold}%` 
    });
});

app.post('/api/ml/trading/start', async (req, res) => {
    try {
        const { interval = 30000 } = req.body;
        
        if (!exchangeService.paperTradingEnabled && !req.body.confirmLiveTrading) {
            return res.status(400).json({ 
                error: 'Live ML trading requires confirmLiveTrading: true' 
            });
        }
        
        // Set up ML trading to save to database
        mlTradingEngine.onTradeExecuted = async (tradeData) => {
            try {
                const tradeId = await databaseManager.saveTrade('default', {
                    ...tradeData,
                    timestamp: Date.now()
                });
                
                console.log('ML Trade saved to database with ID:', tradeId);
                
                // Save ML decision if available
                if (tradeData.mlAnalysis) {
                    await databaseManager.saveMLDecision('default', {
                        ...tradeData.mlAnalysis,
                        executed: true,
                        tradeId: tradeId
                    });
                }
                
                // Update stats
                const stats = await databaseManager.getCurrentStats('default');
                persistentStats = { ...persistentStats, ...stats };
                
                // Broadcast
                broadcastStats();
                
                io.emit('mlTradeExecuted', {
                    result: tradeData,
                    timestamp: new Date().toISOString(),
                    savedToDatabase: true,
                    tradeId
                });
            } catch (error) {
                console.error('Error saving ML trade:', error);
            }
        };
        
        const result = await mlTradingEngine.startAutoTrading(interval);
        
        io.emit('mlTradingStatusChanged', {
            active: true,
            timestamp: new Date().toISOString()
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ml/trading/stop', (req, res) => {
    const result = mlTradingEngine.stopAutoTrading();
    
    io.emit('mlTradingStatusChanged', {
        active: false,
        timestamp: new Date().toISOString()
    });
    
    res.json(result);
});

app.get('/api/ml/trading/opportunities', async (req, res) => {
    try {
        const { minConfidence = 75 } = req.query;
        const opportunities = [];
        
        const enabledPairs = Object.entries(tradingPairs)
            .filter(([_, config]) => config.enabled)
            .map(([symbol, _]) => symbol);
        
        for (const symbol of enabledPairs) {
            const arbs = await exchangeService.findArbitrageOpportunities(symbol, 1000);
            
            for (const arb of arbs) {
                const decision = await mlTradingEngine.analyzeOpportunity(arb);
                
                if (decision.confidence >= minConfidence) {
                    opportunities.push({
                        opportunity: arb,
                        mlAnalysis: decision,
                        recommendedAction: decision.shouldTrade ? 'TRADE' : 'SKIP'
                    });
                }
            }
        }
        
        opportunities.sort((a, b) => b.mlAnalysis.confidence - a.mlAnalysis.confidence);
        
        res.json({
            count: opportunities.length,
            minConfidence,
            opportunities
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root route
app.get('/', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        const dbStatus = databaseManager.getConnectionStatus();
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Meme Millionaire Bot</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #1a1a1a; 
                        color: #fff; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        margin: 0;
                    }
                    .container { text-align: center; }
                    .status { color: #4ade80; }
                    .error { color: #f87171; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>ðŸš€ Meme Millionaire Bot</h1>
                    <p class="status">Server is running!</p>
                    <p>Database: ${dbStatus.storageType} ${dbStatus.isConnected ? 'âœ…' : 'âŒ'}</p>
                    <p>API Status: <span id="api-status">Checking...</span></p>
                </div>
                <script>
                    fetch('/api/health')
                        .then(res => res.json())
                        .then(data => {
                            document.getElementById('api-status').textContent = 'Online';
                            document.getElementById('api-status').className = 'status';
                        })
                        .catch(err => {
                            document.getElementById('api-status').textContent = 'Error';
                            document.getElementById('api-status').className = 'error';
                        });
                </script>
            </body>
            </html>
        `);
    }
});

// Catch all route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        console.log('404 API route:', req.path);
        return res.status(404).json({ error: 'API endpoint not found', path: req.path });
    }
    
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 - Not Found</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #1a1a1a; 
                        color: #fff; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        margin: 0;
                    }
                    .container { text-align: center; }
                    a { color: #4ade80; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404 - Page Not Found</h1>
                    <p>The React app needs to be built first.</p>
                    <p>Run: <code>npm run build</code></p>
                    <p><a href="/">Go to Home</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
    const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';
    const ipAddress = socket.handshake.address;
    
    console.log(`New ${device} client connected:`, socket.id);
    
    // Track connected client
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    connectedClients.set(socket.id, {
        id: socket.id,
        sessionId: sessionId,
        device: device,
        userAgent: userAgent,
        ipAddress: ipAddress,
        connectedAt: new Date().toISOString()
    });
    
    // Send current stats from database
    databaseManager.getCurrentStats('default').then(stats => {
        socket.emit('welcome', {
            message: 'Connected to Meme Trading Bot',
            stats: stats,
            userState: userState,
            tradingPairs: tradingPairs,
            serverTime: new Date().toISOString(),
            clientId: socket.id,
            device: device,
            database: databaseManager.getConnectionStatus().storageType
        });
        
        socket.emit('statsUpdate', stats);
    });
    
    socket.emit('userStateUpdate', userState);
    socket.emit('tradingPairsUpdate', { allPairs: tradingPairs });
    
    // Handle sync request from client
    socket.on('requestSync', async () => {
        console.log('Sync requested by client:', socket.id, device);
        
        const stats = await databaseManager.getCurrentStats('default');
        
        socket.emit('syncResponse', {
            stats: stats,
            userState: userState,
            tradingPairs: tradingPairs,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle stats request
    socket.on('requestStats', async () => {
        const stats = await databaseManager.getCurrentStats('default');
        socket.emit('statsUpdate', stats);
    });
    
    // Handle trading toggle with broadcast
    socket.on('trading_toggle', (data) => {
        console.log('Trading toggle received from:', device, data);
        io.emit('tradingStatusUpdate', data);
    });
    
    // Handle trading pair toggle
    socket.on('trading_pair_toggle', (data) => {
        const { pair, enabled } = data;
        if (tradingPairs.hasOwnProperty(pair)) {
            tradingPairs[pair].enabled = enabled;
            
            io.emit('tradingPairsUpdate', {
                pair: pair,
                enabled: enabled,
                allPairs: tradingPairs
            });
        }
    });
    
    // Handle trade execution - save to database
    socket.on('trade_executed', async (tradeData) => {
        console.log('Trade executed by:', device);
        
        try {
            // Save trade to database
            const tradeId = await databaseManager.saveTrade('default', {
                ...tradeData,
                timestamp: Date.now()
            });
            
            // Reload stats from database
            const stats = await databaseManager.getCurrentStats('default');
            persistentStats = { ...persistentStats, ...stats };
            
            // Broadcast to all clients
            io.emit('newTrade', {
                ...tradeData,
                savedToDatabase: true,
                tradeId: tradeId
            });
            
            io.emit('statsUpdate', stats);
            
        } catch (error) {
            console.error('Error saving trade:', error);
        }
    });
    
    // Handle ML trade execution
    socket.on('ml_trade_executed', async (data) => {
        console.log('ML trade executed:', data);
        
        try {
            // Save ML decision
            if (data.mlAnalysis) {
                await databaseManager.saveMLDecision('default', {
                    ...data.mlAnalysis,
                    executed: true,
                    tradeId: data.tradeId
                });
            }
            
            // Save trade
            if (data.trade) {
                await databaseManager.saveTrade('default', {
                    ...data.trade,
                    timestamp: Date.now()
                });
            }
            
            // Broadcast update
            const stats = await databaseManager.getCurrentStats('default');
            io.emit('mlTradeExecuted', data);
            io.emit('statsUpdate', stats);
            
        } catch (error) {
            console.error('Error saving ML trade:', error);
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`${device} client disconnected:`, socket.id);
        connectedClients.delete(socket.id);
        
        io.emit('clientDisconnected', {
            clientId: socket.id,
            device: device,
            remainingClients: connectedClients.size
        });
    });
});

// Periodic sync broadcast
setInterval(async () => {
    if (connectedClients.size > 0) {
        console.log(`Broadcasting sync to ${connectedClients.size} clients`);
        const stats = await databaseManager.getCurrentStats('default');
        io.emit('statsUpdate', stats);
    }
}, 30000);

// Initialize services on server start
async function initializeServices() {
    try {
        // Initialize database FIRST
        await initializeDatabase();
        
        // Initialize exchange service
        await exchangeService.initialize();
        console.log('âœ… Exchange service initialized');
        
        // Set ML threshold from user preferences
        if (userState.preferences.mlConfidenceThreshold) {
            mlTradingEngine.setThreshold(userState.preferences.mlConfidenceThreshold);
        }
        
        // Configure ML trading engine to save trades to database
        mlTradingEngine.onTradeExecuted = async (tradeData) => {
            try {
                const tradeId = await databaseManager.saveTrade('default', {
                    ...tradeData,
                    timestamp: Date.now()
                });
                
                console.log('ML Trade saved to database with ID:', tradeId);
                
                // Reload stats and broadcast
                const stats = await databaseManager.getCurrentStats('default');
                persistentStats = { ...persistentStats, ...stats };
                broadcastStats();
                
                // Emit trade event
                io.emit('mlTradeExecuted', {
                    result: tradeData,
                    timestamp: new Date().toISOString(),
                    savedToDatabase: true
                });
            } catch (error) {
                console.error('Error saving ML trade to database:', error);
            }
        };
        
        console.log('âœ… All services initialized successfully');
    } catch (error) {
        console.error('âŒ Error initializing services:', error);
    }
}

// Initialize services
initializeServices();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    const dbStatus = databaseManager.getConnectionStatus();
    console.log(`ðŸš€ Enhanced stats server running on port ${PORT}`);
    console.log(`ðŸ“Š Server is ready at http://localhost:${PORT}`);
    console.log(`ðŸ”Œ WebSocket server is running with cross-device sync`);
    console.log(`ðŸ’¾ Database: ${dbStatus.storageType} ${dbStatus.isConnected ? 'Connected' : 'Not connected'}`);
    console.log(`ðŸ“± Cross-device sync: ENABLED`);
    console.log(`ðŸ“ Static files directory: ${distPath}`);
    console.log(`ðŸ“„ Static files exist: ${fs.existsSync(distPath)}`);
    console.log(`ðŸ“ˆ Trading pairs loaded: ${Object.keys(tradingPairs).length}`);
    console.log(`ðŸ¤– ML Trading Engine: Ready`);
    console.log(`ðŸ’± Exchange Service: ${exchangeService.paperTradingEnabled ? 'PAPER MODE' : 'LIVE MODE'}`);
    
    if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        console.log(`ðŸ“¦ Found ${files.length} files in dist:`, files.slice(0, 5).join(', '));
    } else {
        console.log('âš ï¸  No dist directory found. Run: npm run build');
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    
    // Stop ML trading if active
    mlTradingEngine.stopAutoTrading();
    
    // Close database connection
    await databaseManager.close();
    
    // Close connections
    io.close(() => {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for testing
export { app, persistentStats, userState, tradingPairs };
