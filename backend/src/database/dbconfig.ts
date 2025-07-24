import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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


const pool = mysql.createPool(dbConfig);

/*

async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Starting database initialization...');
    
    const sqlScript = fs.readFileSync(
      path.join(__dirname, './ddl.sql'),
      'utf8'
    );
    
    const connection = await pool.getConnection();
    
    try {
      console.log('Executing SQL script...');
      await connection.query(sqlScript);
      console.log('Database schema created successfully!');
      return true;
    } catch (error) {
      console.error('Error executing SQL script:', error);
      return false;
    } finally {
      
      connection.release();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

*/

async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL RDS successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to MySQL RDS:', error);
    return false;
  }
}

export { pool, testConnection };