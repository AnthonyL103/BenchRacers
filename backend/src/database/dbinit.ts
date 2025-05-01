import { initializeDatabase, testConnection } from './dbconfig';

async function initialize() {
  try {
    // Test connection to RDS
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Failed to connect to RDS. Please check your credentials and network.');
      process.exit(1);
    }
    
    console.log('Connection to RDS successful. Initializing database schema...');
    
    // Initialize database schema
    const initialized = await initializeDatabase();
    
    if (initialized) {
      console.log('Database schema initialized successfully!');
    } else {
      console.error('Failed to initialize database schema.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initialize();