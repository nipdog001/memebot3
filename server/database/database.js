import Database from 'better-sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
    constructor() {
        this.db = null;
        this.pgClient = null;
        this.connectionType = 'none';
        this.isConnected = false;
        this.connectionStatus = {
            isConnected: false,
            storageType: 'none',
            lastAttempt: null,
            error: null
        };
    }

    async initializeDatabase() {
        console.log('🔄 Initializing database connection...');
        
        // Try PostgreSQL first (Railway)
        if (await this.connectToPostgreSQL()) {
            console.log('✅ Connected to PostgreSQL database');
            await this.createPostgreSQLTables();
            return;
        }
        
        // Fallback to SQLite
        console.log('⚠️ PostgreSQL unavailable, falling back to SQLite');
        this.connectToSQLite();
        this.createSQLiteTables();
    }

    async connectToPostgreSQL() {
        try {
            // Check for Railway PostgreSQL environment variables
            let databaseUrl = process.env.DATABASE_URL || 
                             process.env.POSTGRES_URL || 
                             process.env.RAILWAY_DATABASE_URL;
            
            if (!databaseUrl) {
                // For development, use a default connection string
                if (process.env.NODE_ENV === 'development') {
                    databaseUrl = 'postgres://postgres:postgres@localhost:5432/memebot';
                    console.log('⚠️ Using default PostgreSQL connection string for development');
                } else {
                    console.log('❌ No PostgreSQL connection string found');
                    return false;
                }
            }

            console.log('🔗 Attempting PostgreSQL connection...');
            
            const { Client } = pg;
            this.pgClient = new Client({
                connectionString: databaseUrl,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                // Increase connection timeout
                connectionTimeoutMillis: 10000
            });

            try {
                await this.pgClient.connect();
            } catch (connectionError) {
                console.error('❌ PostgreSQL connection error:', connectionError.message);
                console.log('⚠️ Falling back to SQLite');
                return false;
            }
            
            // Test the connection
            const result = await this.pgClient.query('SELECT NOW()');
            console.log('✅ PostgreSQL connection successful:', result.rows[0]);
            
            this.connectionType = 'postgresql';
            this.isConnected = true;
            this.connectionStatus = {
                isConnected: true,
                storageType: 'PostgreSQL',
                lastAttempt: new Date().toISOString(),
                error: null
            };
            
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            console.log('⚠️ Falling back to SQLite');
            this.connectionStatus = {
                isConnected: false,
                storageType: 'none',
                lastAttempt: new Date().toISOString(),
                error: error.message
            };
            return false;
        }
    }

    connectToSQLite() {
        try {
            const dbPath = path.join(__dirname, '..', 'data', 'trading.db');
            const dataDir = path.dirname(dbPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            this.db = new Database(dbPath);
            this.connectionType = 'sqlite';
            this.isConnected = true;
            this.connectionStatus = {
                isConnected: true,
                storageType: 'SQLite',
                lastAttempt: new Date().toISOString(),
                error: null
            };
            
            console.log('✅ SQLite database initialized');
        } catch (error) {
            console.error('❌ SQLite initialization failed:', error);
            this.connectionStatus = {
                isConnected: false,
                storageType: 'none',
                lastAttempt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    async createPostgreSQLTables() {
        const tables = [
            // Trading statistics table
            `CREATE TABLE IF NOT EXISTS trading_stats (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) DEFAULT 'default',
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                losing_trades INTEGER DEFAULT 0,
                total_profit DECIMAL(15,2) DEFAULT 0,
                total_fees DECIMAL(15,2) DEFAULT 0,
                daily_pl DECIMAL(15,2) DEFAULT 0,
                weekly_pl DECIMAL(15,2) DEFAULT 0,
                monthly_pl DECIMAL(15,2) DEFAULT 0,
                win_rate DECIMAL(5,2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Individual trades table
            `CREATE TABLE IF NOT EXISTS trades (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) DEFAULT 'default',
                symbol VARCHAR(50) NOT NULL,
                buy_exchange VARCHAR(50) NOT NULL,
                sell_exchange VARCHAR(50) NOT NULL,
                amount DECIMAL(15,8) NOT NULL,
                buy_price DECIMAL(15,8) NOT NULL,
                sell_price DECIMAL(15,8) NOT NULL,
                net_profit DECIMAL(15,2) NOT NULL,
                total_fees DECIMAL(15,2) NOT NULL,
                buy_fee DECIMAL(15,2) NOT NULL,
                sell_fee DECIMAL(15,2) NOT NULL,
                ml_confidence DECIMAL(5,2) NOT NULL,
                deciding_models TEXT,
                position_size DECIMAL(5,2) NOT NULL,
                timestamp BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // ML decisions table
            `CREATE TABLE IF NOT EXISTS ml_decisions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) DEFAULT 'default',
                symbol VARCHAR(50) NOT NULL,
                decision VARCHAR(10) NOT NULL,
                confidence DECIMAL(5,2) NOT NULL,
                models_used TEXT,
                market_data TEXT,
                executed BOOLEAN DEFAULT FALSE,
                trade_id INTEGER REFERENCES trades(id),
                timestamp BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Trading settings table
            `CREATE TABLE IF NOT EXISTS trading_settings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) DEFAULT 'default',
                ml_confidence_threshold INTEGER DEFAULT 75,
                position_size DECIMAL(5,2) DEFAULT 2.0,
                risk_level VARCHAR(20) DEFAULT 'medium',
                unlimited_trades BOOLEAN DEFAULT TRUE,
                settings_json TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Exchange data table
            `CREATE TABLE IF NOT EXISTS exchange_data (
                id SERIAL PRIMARY KEY,
                exchange VARCHAR(50) NOT NULL,
                symbol VARCHAR(50) NOT NULL,
                price DECIMAL(15,8) NOT NULL,
                volume_24h DECIMAL(20,2),
                change_24h DECIMAL(8,4),
                bid DECIMAL(15,8),
                ask DECIMAL(15,8),
                timestamp BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            try {
                await this.pgClient.query(table);
                console.log('✅ PostgreSQL table created/verified');
            } catch (error) {
                console.error('❌ Error creating PostgreSQL table:', error);
            }
        }

        // Create indexes for better performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)',
            'CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_exchange_data_symbol ON exchange_data(symbol)',
            'CREATE INDEX IF NOT EXISTS idx_exchange_data_timestamp ON exchange_data(timestamp)'
        ];

        for (const index of indexes) {
            try {
                await this.pgClient.query(index);
            } catch (error) {
                console.error('❌ Error creating index:', error);
            }
        }
    }

    createSQLiteTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS trading_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT DEFAULT 'default',
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                losing_trades INTEGER DEFAULT 0,
                total_profit REAL DEFAULT 0,
                total_fees REAL DEFAULT 0,
                daily_pl REAL DEFAULT 0,
                weekly_pl REAL DEFAULT 0,
                monthly_pl REAL DEFAULT 0,
                win_rate REAL DEFAULT 0,
                last_updated INTEGER DEFAULT (strftime('%s', 'now')),
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            `CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT DEFAULT 'default',
                symbol TEXT NOT NULL,
                buy_exchange TEXT NOT NULL,
                sell_exchange TEXT NOT NULL,
                amount REAL NOT NULL,
                buy_price REAL NOT NULL,
                sell_price REAL NOT NULL,
                net_profit REAL NOT NULL,
                total_fees REAL NOT NULL,
                buy_fee REAL NOT NULL,
                sell_fee REAL NOT NULL,
                ml_confidence REAL NOT NULL,
                deciding_models TEXT,
                position_size REAL NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            `CREATE TABLE IF NOT EXISTS exchange_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exchange TEXT NOT NULL,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                volume_24h REAL,
                change_24h REAL,
                bid REAL,
                ask REAL,
                timestamp INTEGER NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`
        ];

        tables.forEach(table => {
            try {
                this.db.exec(table);
            } catch (error) {
                console.error('❌ Error creating SQLite table:', error);
            }
        });
    }

    async saveTrade(userId, tradeData) {
        try {
            if (this.connectionType === 'postgresql') {
                const query = `
                    INSERT INTO trades (
                        user_id, symbol, buy_exchange, sell_exchange, amount, 
                        buy_price, sell_price, net_profit, total_fees, buy_fee, 
                        sell_fee, ml_confidence, deciding_models, position_size, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    RETURNING id
                `;
                
                const values = [
                    userId, tradeData.symbol, tradeData.buyExchange, tradeData.sellExchange,
                    tradeData.amount, tradeData.buyPrice, tradeData.sellPrice, tradeData.netProfit,
                    tradeData.totalFees, tradeData.buyFee, tradeData.sellFee, tradeData.mlConfidence,
                    JSON.stringify(tradeData.decidingModels), tradeData.positionSize, tradeData.timestamp
                ];
                
                const result = await this.pgClient.query(query, values);
                return result.rows[0].id;
            } else {
                const stmt = this.db.prepare(`
                    INSERT INTO trades (
                        user_id, symbol, buy_exchange, sell_exchange, amount, 
                        buy_price, sell_price, net_profit, total_fees, buy_fee, 
                        sell_fee, ml_confidence, deciding_models, position_size, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                const result = stmt.run(
                    userId, tradeData.symbol, tradeData.buyExchange, tradeData.sellExchange,
                    tradeData.amount, tradeData.buyPrice, tradeData.sellPrice, tradeData.netProfit,
                    tradeData.totalFees, tradeData.buyFee, tradeData.sellFee, tradeData.mlConfidence,
                    JSON.stringify(tradeData.decidingModels), tradeData.positionSize, tradeData.timestamp
                );
                
                return result.lastInsertRowid;
            }
        } catch (error) {
            console.error('❌ Error saving trade:', error);
            throw error;
        }
    }

    async saveTradingStats(userId, stats) {
        try {
            if (this.connectionType === 'postgresql') {
                const query = `
                    INSERT INTO trading_stats (
                        user_id, total_trades, winning_trades, losing_trades, 
                        total_profit, total_fees, daily_pl, weekly_pl, monthly_pl, win_rate
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (user_id) DO UPDATE SET
                        total_trades = EXCLUDED.total_trades,
                        winning_trades = EXCLUDED.winning_trades,
                        losing_trades = EXCLUDED.losing_trades,
                        total_profit = EXCLUDED.total_profit,
                        total_fees = EXCLUDED.total_fees,
                        daily_pl = EXCLUDED.daily_pl,
                        weekly_pl = EXCLUDED.weekly_pl,
                        monthly_pl = EXCLUDED.monthly_pl,
                        win_rate = EXCLUDED.win_rate,
                        last_updated = CURRENT_TIMESTAMP
                `;
                
                await this.pgClient.query(query, [
                    userId, stats.totalTrades, stats.winningTrades, stats.losingTrades,
                    stats.totalProfit, stats.totalFees, stats.dailyPL, stats.weeklyPL,
                    stats.monthlyPL, stats.winRate
                ]);
            } else {
                const stmt = this.db.prepare(`
                    INSERT OR REPLACE INTO trading_stats (
                        user_id, total_trades, winning_trades, losing_trades, 
                        total_profit, total_fees, daily_pl, weekly_pl, monthly_pl, win_rate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                stmt.run(
                    userId, stats.totalTrades, stats.winningTrades, stats.losingTrades,
                    stats.totalProfit, stats.totalFees, stats.dailyPL, stats.weeklyPL,
                    stats.monthlyPL, stats.winRate
                );
            }
        } catch (error) {
            console.error('❌ Error saving trading stats:', error);
            throw error;
        }
    }

    async getCurrentStats(userId) {
        try {
            if (this.connectionType === 'postgresql') {
                const result = await this.pgClient.query(
                    'SELECT * FROM trading_stats WHERE user_id = $1 ORDER BY last_updated DESC LIMIT 1',
                    [userId]
                );
                
                return result.rows[0] || this.getDefaultStats();
            } else {
                const stmt = this.db.prepare('SELECT * FROM trading_stats WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1');
                const result = stmt.get(userId);
                
                return result || this.getDefaultStats();
            }
        } catch (error) {
            console.error('❌ Error getting current stats:', error);
            return this.getDefaultStats();
        }
    }

    async saveExchangeData(exchangeData) {
        try {
            if (this.connectionType === 'postgresql') {
                const query = `
                    INSERT INTO exchange_data (exchange, symbol, price, volume_24h, change_24h, bid, ask, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                
                await this.pgClient.query(query, [
                    exchangeData.exchange, exchangeData.symbol, exchangeData.price,
                    exchangeData.volume24h, exchangeData.change24h, exchangeData.bid,
                    exchangeData.ask, exchangeData.timestamp
                ]);
            } else {
                const stmt = this.db.prepare(`
                    INSERT INTO exchange_data (exchange, symbol, price, volume_24h, change_24h, bid, ask, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                stmt.run(
                    exchangeData.exchange, exchangeData.symbol, exchangeData.price,
                    exchangeData.volume24h, exchangeData.change24h, exchangeData.bid,
                    exchangeData.ask, exchangeData.timestamp
                );
            }
        } catch (error) {
            console.error('❌ Error saving exchange data:', error);
        }
    }

    getDefaultStats() {
        return {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfit: 0,
            totalFees: 0,
            dailyPL: 0,
            weeklyPL: 0,
            monthlyPL: 0,
            winRate: 0,
            lastUpdated: Date.now()
        };
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }

    async close() {
        try {
            if (this.pgClient) {
                await this.pgClient.end();
            }
            if (this.db) {
                this.db.close();
            }
        } catch (error) {
            console.error('❌ Error closing database:', error);
        }
    }
}

export default new DatabaseManager();