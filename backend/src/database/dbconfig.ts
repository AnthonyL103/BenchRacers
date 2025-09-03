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
  connectionLimit: 100,
  queueLimit: 0,
  acquireTimeout: 5000,           // Fail fast - was 60000
  timeout: 30000,                 // 30 seconds for query execution
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,       // Start keep-alive immediately
  maxIdle: 10,                    // Keep idle connections
  idleTimeout: 28800000,          // 8 hours (don't drop connections)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
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

// Connection timing monitoring
const originalGetConnection = pool.getConnection;
pool.getConnection = function(...args) {
  const start = Date.now();
  console.log('[DB] Requesting connection...');
  
  return originalGetConnection.apply(this, args).then(connection => {
    console.log(`[DB] ⚡ Connection acquired in ${Date.now() - start}ms`);
    return connection;
  }).catch(err => {
    console.log(`[DB] ❌ Connection failed after ${Date.now() - start}ms`);
    throw err;
  });
};

// Monitor connection creation patterns
let connectionCreationTimes: number[] = [];

pool.on('connection', (connection) => {
  const now = Date.now();
  connectionCreationTimes.push(now);
  console.log(`[DB] 🔗 New connection ${connection.threadId} created`);
  
  // Log if we're creating connections frequently (possible pool thrashing)
  const recentConnections = connectionCreationTimes.filter(time => now - time < 10000);
  if (recentConnections.length > 5) {
    console.warn(`[DB] ⚠️  Created ${recentConnections.length} connections in last 10s - possible pool thrashing`);
  }
  
  // Clean up old timestamps (keep only last hour)
  connectionCreationTimes = connectionCreationTimes.filter(time => now - time < 3600000);
});



// Real-time pool monitoring
setInterval(() => {
  console.log('[DB] Pool stats:', {
    totalConnections: (pool as any)._allConnections?.length || 'unknown',
    freeConnections: (pool as any)._freeConnections?.length || 'unknown',
    queuedRequests: (pool as any)._connectionQueue?.length || 'unknown'
  });
}, 30000); // Every 30 seconds

// Pre-warm connection pool
(async () => {
  console.log('[DB] Pre-warming connection pool...');
  const connections = [];
  
  // Create 10 connections upfront
  for (let i = 0; i < 10; i++) {
    try {
      const conn = await pool.getConnection();
      connections.push(conn);
    } catch (err) {
      console.error('[DB] Failed to pre-warm connection:', err);
    }
  }
  
  // Release them back to pool
  connections.forEach(conn => conn.release());
  console.log(`[DB] ✅ Pre-warmed ${connections.length} connections`);
})();

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