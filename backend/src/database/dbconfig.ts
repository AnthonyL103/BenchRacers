import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Enable multiple statements
};

// Create connection poolff
const pool = mysql.createPool(dbConfig);

// Function to initialize database
async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Starting database initialization...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, './ddl.sql'),
      'utf8'
    );
    
    // Get a connection from the pool
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
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Test connection function
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

export { pool, initializeDatabase, testConnection };