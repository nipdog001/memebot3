import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function fixStats() {
    // Get the DATABASE_URL from your Railway project
    // You can find this in Railway dashboard > PostgreSQL > Variables
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        console.log('Please set DATABASE_URL in your .env file');
        console.log('Get it from Railway dashboard > PostgreSQL > Variables');
        return;
    }
    
    const client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('Connected to Railway PostgreSQL!');
        
        // Check trade count
        const countRes = await client.query('SELECT COUNT(*) FROM trades');
        console.log(`Total trades: ${countRes.rows[0].count}`);
        
        // Get stats breakdown
        const statsRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN net_profit > 0 THEN 1 ELSE 0 END) as wins,
                SUM(net_profit) as profit
            FROM trades
        `);
        
        const stats = statsRes.rows[0];
        const winRate = (stats.wins / stats.total * 100).toFixed(2);
        
        console.log(`Wins: ${stats.wins}/${stats.total} (${winRate}%)`);
        console.log(`Total profit: $${parseFloat(stats.profit).toFixed(2)}`);
        
        // Fix the stats table
        await client.query(`
            UPDATE trading_stats 
            SET total_trades = $1,
                winning_trades = $2,
                losing_trades = $3,
                win_rate = $4
            WHERE user_id = 'default'
        `, [stats.total, stats.wins, stats.total - stats.wins, winRate]);
        
        console.log('Stats updated successfully!');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixStats();