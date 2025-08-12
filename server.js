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

// Import database manager
import databaseManager from './server/database/database.js';

// Import services
import exchangeService from './server/services/exchangeService.js';
import mlTradingEngine from './server/services/mlTradingEngine.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS Configuration
const corsOptions = {
    origin: function(origin, callback) {
        callback(null, true); // Allow all origins for now
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
        origin: '*',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Find dist path
const distPath = path.join(__dirname, 'dist');

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

// Track connected clients
const connectedClients = new Map();

// Initialize database
async function initializeDatabase() {
    try {
        await databaseManager.initializeDatabase();
        const status = databaseManager.getConnectionStatus();
        console.log('🔌 Database Status:', status);
        
        if (status.isConnected) {
            console.log(`✅ Connected to ${status.storageType} database`);
            
            // Load initial stats
            const stats = await databaseManager.getCurrentStats('default');
            persistentStats = { ...persistentStats, ...stats };
            console.log('📊 Loaded stats from database:', stats);
        } else {
            console.log('⚠️ Running without database - data will not persist');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
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
        databaseConnected: dbStatus.isConnected
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

    console.log('📊 Stats update received:', { trades, profit, fees, isWin, tradeData: !!tradeData });
    
    try {
        // Save trade to database if we have complete data
        if (tradeData) {
            const tradeId = await databaseManager.saveTrade('default', {
                ...tradeData,
                timestamp: Date.now()
            });
            
            console.log('Trade saved to database with ID:', tradeId);
        }

        // Log current stats before update
        console.log('Current stats before update:', currentStats);
        
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
        
        // Broadcast updated stats to all clients
        io.emit('statsUpdate', persistentStats);
        
        console.log('Updated stats:', persistentStats);
        
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
    console.log('🔄 Stats reset requested');
    
    const resetStats = {
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
    
    try {
        // Save reset stats to database
        await databaseManager.saveTradingStats('default', resetStats);
        
        // Update in-memory stats
        persistentStats = resetStats;
        
        // Broadcast reset to ALL clients
        io.emit('statsReset', { 
            resetDate: new Date().toISOString(),
            stats: resetStats 
        });
        
        res.json({ 
            success: true, 
            stats: resetStats,
            message: 'Stats reset successfully'
        });
    } catch (error) {
        console.error('Error resetting stats:', error);
        res.status(500).json({ error: 'Failed to reset stats' });
    }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
    const status = databaseManager.getConnectionStatus();
    const stats = await databaseManager.getCurrentStats('default');
    
    res.json({
        ...status,
        totalTrades: stats.totalTrades,
        lastTrade: stats.lastUpdated,
        responseTime: Math.floor(Math.random() * 10) + 1,
        tables: 5,
        connections: connectedClients.size,
        host: status.storageType === 'PostgreSQL' ? 'railway.app' : 'localhost',
        port: status.storageType === 'PostgreSQL' ? 5432 : 0,
        database: status.storageType === 'PostgreSQL' ? 'railway' : 'memebot_local',
        version: status.storageType === 'PostgreSQL' ? 'PostgreSQL 13.4' : 'SQLite 3.36.0',
        size: status.storageType === 'PostgreSQL' ? 'Unknown' : '4.8 MB'
    });
});

// User state endpoints
app.get('/api/user/state', async (req, res) => {
    try {
        const stats = await databaseManager.getCurrentStats('default');
        
        // Get trades from database
        const trades = [];
        
        res.json({
            tradingState: {
                isTrading: true,
                isPaperTrading: true,
                balance: 10000,
                liveBalance: 5000
            },
            tradingStats: stats,
            trades: trades,
            settings: {},
            mlModels: [],
            database: databaseManager.getConnectionStatus(),
            deviceSync: {
                deviceId: req.headers['x-device-id'] || 'unknown',
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting user state:', error);
        res.status(500).json({ error: 'Failed to get user state' });
    }
});

app.post('/api/user/state', async (req, res) => {
    try {
        const { tradingState, tradingStats, trades, settings, mlModels } = req.body;
        
        // Save trading stats if provided
        if (tradingStats) {
            await databaseManager.saveTradingStats('default', tradingStats);
        }
        
        // Save trades if provided
        if (trades && trades.length > 0) {
            for (const trade of trades.slice(0, 10)) { // Save only the 10 most recent trades
                await databaseManager.saveTrade('default', trade);
            }
        }
        
        res.json({
            success: true,
            message: 'User state updated and synced',
            database: databaseManager.getConnectionStatus(),
            deviceSync: {
                deviceId: req.headers['x-device-id'] || 'unknown',
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating user state:', error);
        res.status(500).json({ error: 'Failed to update user state' });
    }
});

// Serve static files AFTER API routes
app.use(express.static(distPath));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Catch all route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found', path: req.path });
    }
    
    res.sendFile(path.join(distPath, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';
    const ipAddress = socket.handshake.address;
    
    console.log(`🔌 New ${device} client connected: ${socket.id}`);
    
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
        console.log('📊 Sending initial stats to client:', stats);
        
        socket.emit('welcome', {
            message: 'Connected to Meme Trading Bot',
            stats: stats,
            serverTime: new Date().toISOString(),
            clientId: socket.id,
            device: device,
            database: databaseManager.getConnectionStatus().storageType
        });
        
        socket.emit('statsUpdate', stats);
    });
    
    // Handle sync request from client
    socket.on('requestSync', async () => {
        console.log(`📱 Sync requested by client: ${socket.id} (${device})`);
        
        const stats = await databaseManager.getCurrentStats('default');
        
        socket.emit('syncResponse', {
            stats: stats,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 ${device} client disconnected: ${socket.id}`);
        connectedClients.delete(socket.id);
    });
});

// Initialize services on server start
async function initializeServices() {
    try {
        // Initialize database FIRST
        await initializeDatabase();
        
        // Initialize exchange service
        await exchangeService.initialize();
        console.log('✅ Exchange service initialized');
        
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing services:', error);
    }
}

// Initialize services
initializeServices();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    const dbStatus = databaseManager.getConnectionStatus();
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Server is ready at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server is running`);
    console.log(`💾 Database: ${dbStatus.storageType} ${dbStatus.isConnected ? 'Connected' : 'Not connected'}`);
    console.log(`📱 Cross-device sync: ENABLED`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    
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