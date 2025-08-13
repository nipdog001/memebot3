// server/services/databaseManager.js
// Railway-Ready Database Manager - Supports both PostgreSQL (Railway) and SQLite (local)

import pg from 'pg';
import SQLite3Driver from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
    constructor() {
        this.db = null;
        this.pgClient = null;
        this.isPostgres = false;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🗄️ Initializing database...');
            
            // Check if we're on Railway (PostgreSQL) or local (SQLite)
            if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
                try {
                    await this.initializePostgreSQL();
                } catch (error) {
                    console.error('PostgreSQL initialization failed:', error);
                    this.pgClient = null;
                    this.isPostgres = false;
                    throw error;
                }
            } else {
                try {
                    await this.initializeSQLite();
                } catch (error) {
                    console.error('SQLite initialization failed:', error);
                    this.db = null;
                    this.isPostgres = false;
                    throw error;
                }
            }
            
            // Create tables
            await this.createTables();
            
            // Sync with existing data if available
            await this.syncExistingData();
            
            this.isInitialized = true;
            console.log('✅ Database initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            // Explicitly set connections to null on failure
            this.db = null;
            this.pgClient = null;
            this.isInitialized = false;
            return false;
        }
    }

    async initializePostgreSQL() {
        console.log('🐘 Connecting to PostgreSQL (Railway)...');
        
        const { Pool } = pg;
        this.pgClient = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Test connection with a simple query
        await this.pgClient.query('SELECT 1');
        this.isPostgres = true;
        console.log('✅ Connected to PostgreSQL on Railway');
    }

    async initializeSQLite() {
        console.log('💾 Using local SQLite database...');
        
        try {
            const dataDir = path.join(process.cwd(), 'data');
            
            // Ensure data directory exists
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Use the sqlite package's open function properly
            const dbPath = path.join(dataDir, 'trading.db');
            this.db = await open({
                filename: dbPath,
                driver: SQLite3Driver.Database
            });
            
            // Verify the connection by running a simple query
            await this.db.get('SELECT 1');
            
            this.isPostgres = false;
            console.log('✅ Connected to local SQLite');
        } catch (error) {
            console.error('❌ Failed to initialize SQLite:', error);
            this.db = null;
            throw error;
        }
    }

    async createTables() {
        if (this.isPostgres) {
            // PostgreSQL table creation
            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS trading_stats (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT UNIQUE DEFAULT 'default',
                    total_trades INTEGER DEFAULT 0,
                    winning_trades INTEGER DEFAULT 0,
                    losing_trades INTEGER DEFAULT 0,
                    total_profit DECIMAL DEFAULT 0,
                    total_loss DECIMAL DEFAULT 0,
                    win_rate DECIMAL DEFAULT 0,
                    paper_balance DECIMAL DEFAULT 10000,
                    live_balance DECIMAL DEFAULT 5000,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS trades (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT DEFAULT 'default',
                    trade_id TEXT UNIQUE,
                    symbol TEXT,
                    exchange TEXT,
                    action TEXT,
                    amount DECIMAL,
                    price DECIMAL,
                    profit DECIMAL,
                    is_paper BOOLEAN DEFAULT true,
                    ml_model TEXT,
                    confidence DECIMAL,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS ml_stats (
                    id SERIAL PRIMARY KEY,
                    model_type TEXT,
                    accuracy DECIMAL,
                    predictions INTEGER,
                    profit_generated DECIMAL,
                    last_training TIMESTAMP,
                    training_cycles INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS user_state (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT UNIQUE DEFAULT 'default',
                    trading_state TEXT,
                    settings TEXT,
                    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS market_data (
                    id SERIAL PRIMARY KEY,
                    symbol TEXT,
                    exchange TEXT,
                    price DECIMAL,
                    volume DECIMAL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
        } else {
            // SQLite table creation (your existing code)
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS trading_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT DEFAULT 'default',
                    total_trades INTEGER DEFAULT 0,
                    winning_trades INTEGER DEFAULT 0,
                    losing_trades INTEGER DEFAULT 0,
                    total_profit REAL DEFAULT 0,
                    total_loss REAL DEFAULT 0,
                    win_rate REAL DEFAULT 0,
                    paper_balance REAL DEFAULT 10000,
                    live_balance REAL DEFAULT 5000,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT DEFAULT 'default',
                    trade_id TEXT UNIQUE,
                    symbol TEXT,
                    exchange TEXT,
                    action TEXT,
                    amount REAL,
                    price REAL,
                    profit REAL,
                    is_paper BOOLEAN DEFAULT 1,
                    ml_model TEXT,
                    confidence REAL,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS ml_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_type TEXT,
                    accuracy REAL,
                    predictions INTEGER,
                    profit_generated REAL,
                    last_training DATETIME,
                    training_cycles INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS user_state (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE DEFAULT 'default',
                    trading_state TEXT,
                    settings TEXT,
                    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS market_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT,
                    exchange TEXT,
                    price REAL,
                    volume REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(symbol, exchange, timestamp)
                )
            `);
        }
    }

    // Sync with existing Railway data
    async syncExistingData() {
        try {
            // Check if we have existing data in the database
            const existingStats = await this.getTradingStats('default');
            
            if (!existingStats) {
                await this.initializeSQLite();
            }
        } catch (error) {
            console.log('No existing data to sync');
        }
    }

    // Universal query method that works with both databases
    async query(sql, params = []) {
        if (!this.isInitialized) {
            console.warn('Database not initialized, skipping query');
            return [];
        }
        
        if (this.isPostgres && !this.pgClient) {
            console.error('PostgreSQL client is null, cannot execute query');
            return [];
        }
        
        if (!this.isPostgres && !this.db) {
            console.error('SQLite database is null, cannot execute query');
            return [];
        }
        
        if (this.isPostgres) {
            const result = await this.pgClient.query(sql, params);
            return result.rows;
        } else {
            if (!this.db) {
                console.error('SQLite database instance is null, cannot execute query');
                return [];
            }
            if (sql.toLowerCase().startsWith('select')) {
                return await this.db.all(sql, params);
            } else {
                return await this.db.run(sql, params);
            }
        }
    }

    // Universal get single row method
    async get(sql, params = []) {
        if (!this.isInitialized) {
            console.warn('Database not initialized, skipping get query');
            return null;
        }
        
        if (this.isPostgres && !this.pgClient) {
            console.error('PostgreSQL client is null, cannot execute get query');
            return null;
        }
        
        if (!this.isPostgres && !this.db) {
            console.error('SQLite database is null, cannot execute get query');
            return null;
        }
        
        if (this.isPostgres) {
            const result = await this.pgClient.query(sql, params);
            return result.rows[0] || null;
        } else {
            return await this.db.get(sql, params);
        }
    }

    // Save trading statistics
    async saveTradingStats(userId = 'default', stats) {
        try {
            // Check if database is properly initialized and connected
            if (!this.isInitialized) {
                console.warn('Database not initialized, cannot save trading stats');
                return false;
            }
            
            if (this.isPostgres && !this.pgClient) {
                console.error('PostgreSQL client is null, cannot save trading stats');
                return false;
            }
            
            if (!this.isPostgres && !this.db) {
                console.error('SQLite database is null, cannot save trading stats');
                return false;
            }
            
            let sql;
            let params;
            
            if (this.isPostgres) {
                // PostgreSQL upsert
                sql = `
                    INSERT INTO trading_stats (
                        user_id, total_trades, winning_trades, losing_trades,
                        total_profit, total_loss, win_rate, paper_balance, live_balance
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (user_id) DO UPDATE SET
                        total_trades = $2,
                        winning_trades = $3,
                        losing_trades = $4,
                        total_profit = $5,
                        total_loss = $6,
                        win_rate = $7,
                        paper_balance = $8,
                        live_balance = $9,
                        updated_at = CURRENT_TIMESTAMP
                `;
            } else {
                // SQLite upsert
                sql = `
                    INSERT OR REPLACE INTO trading_stats (
                        user_id, total_trades, winning_trades, losing_trades,
                        total_profit, total_loss, win_rate, paper_balance, live_balance
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
            }
            
            params = [
                userId,
                stats.totalTrades || 0,
                stats.winningTrades || 0,
                stats.losingTrades || 0,
                stats.totalProfit || 0,
                stats.totalLoss || 0,
                stats.winRate || 0,
                stats.paperBalance || 10000,
                stats.liveBalance || 5000
            ];
            
            await this.query(sql, params);
            return true;
        } catch (error) {
            console.error('Error saving trading stats:', error);
            return false;
        }
    }

    // Get trading statistics
    async getTradingStats(userId = 'default') {
        try {
            const sql = this.isPostgres
                ? 'SELECT * FROM trading_stats WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1'
                : 'SELECT * FROM trading_stats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
            
            const stats = await this.get(sql, [userId]);
            
            return stats || {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                totalProfit: 0,
                totalLoss: 0,
                winRate: 0,
                paperBalance: 10000,
                liveBalance: 5000
            };
        } catch (error) {
            console.error('Error getting trading stats:', error);
            return null;
        }
    }

    // Save trade
    async saveTrade(userId = 'default', trade) {
        try {
            const sql = this.isPostgres
                ? `INSERT INTO trades (
                    user_id, trade_id, symbol, exchange, action,
                    amount, price, profit, is_paper, ml_model, confidence
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (trade_id) DO NOTHING`
                : `INSERT OR REPLACE INTO trades (
                    user_id, trade_id, symbol, exchange, action,
                    amount, price, profit, is_paper, ml_model, confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                userId,
                trade.id || `trade-${Date.now()}`,
                trade.symbol,
                trade.exchange,
                trade.action,
                trade.amount,
                trade.price,
                trade.profit || 0,
                trade.isPaper ? 1 : 0,
                trade.mlModel || null,
                trade.confidence || null
            ];
            
            await this.query(sql, params);
            return true;
        } catch (error) {
            console.error('Error saving trade:', error);
            return false;
        }
    }

    // Get trades
    async getTrades(limit = 50, userId = 'default') {
        try {
            const sql = this.isPostgres
                ? 'SELECT * FROM trades WHERE user_id = $1 ORDER BY executed_at DESC LIMIT $2'
                : 'SELECT * FROM trades WHERE user_id = ? ORDER BY executed_at DESC LIMIT ?';
            
            const trades = await this.query(sql, [userId, limit]);
            return trades || [];
        } catch (error) {
            console.error('Error getting trades:', error);
            return [];
        }
    }

    // Save ML stats
    async saveMLStats(stats) {
        try {
            for (const model of stats.models) {
                const sql = this.isPostgres
                    ? `INSERT INTO ml_stats (
                        model_type, accuracy, predictions,
                        profit_generated, last_training, training_cycles
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (model_type) DO UPDATE SET
                        accuracy = $2,
                        predictions = $3,
                        profit_generated = $4,
                        last_training = $5,
                        training_cycles = $6,
                        updated_at = CURRENT_TIMESTAMP`
                    : `INSERT OR REPLACE INTO ml_stats (
                        model_type, accuracy, predictions,
                        profit_generated, last_training, training_cycles
                    ) VALUES (?, ?, ?, ?, ?, ?)`;
                
                const params = [
                    model.type,
                    model.accuracy,
                    model.predictions,
                    model.profitGenerated,
                    model.lastTraining || new Date().toISOString(),
                    stats.overall?.trainingCycles || 0
                ];
                
                await this.query(sql, params);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving ML stats:', error);
            return false;
        }
    }

    // Get status
    getStatus() {
        return {
            connected: this.isInitialized,
            type: this.isPostgres ? 'PostgreSQL' : 'SQLite',
            location: this.isPostgres ? 'Railway' : 'Local'
        };
    }

    // Close database connection
    async close() {
        if (this.pgClient) {
            await this.pgClient.end();
        }
        if (this.db) {
            await this.db.close();
        }
        this.isInitialized = false;
        console.log('🔒 Database connection closed');
    }
}

export default new DatabaseManager();