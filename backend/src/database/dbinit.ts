import {testConnection } from './dbconfig';

async function initialize() {
  try {
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Failed to connect to RDS. Please check your credentials and network.');
      process.exit(1);
    }
    
    console.log('Connection to RDS successful');
  } catch (error) {
    console.error('Unexpected error during initialization:', error);
    process.exit(1);
  }
}

initialize();