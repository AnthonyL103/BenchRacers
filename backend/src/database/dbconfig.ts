import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Debug environment variables used for DB
console.log('[DB] Environment variable check:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('  DB_NAME:', process.env.DB_NAME);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
  acquireTimeout: 60000,
  timeout: 30000,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
  ssl: undefined,
};

// Log DB config but hide sensitive info
console.log('[DB] Using config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password ? '***' : undefined,
  database: dbConfig.database,
  connectionLimit: dbConfig.connectionLimit,
  ssl: dbConfig.ssl ? 'enabled' : 'disabled',
});

const pool = mysql.createPool(dbConfig);

// Test connection immediately at startup
(async () => {
  console.log('[DB] Testing connection to MySQL...');
  try {
    const conn = await pool.getConnection();
    console.log('[DB] ✅ Connected to MySQL successfully');
    conn.release();
  } catch (err) {
    console.error('[DB] ❌ Failed to connect to MySQL:', err);
  }
})();

async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] ✅ Connected to MySQL RDS successfully via testConnection()');
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] ❌ Failed to connect to MySQL RDS via testConnection():', error);
    return false;
  }
}

export { pool, testConnection };
