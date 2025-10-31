import mongoose from 'mongoose';
import { logger } from '../core/logger.js'; // Ensure logger is imported
import config from '../config/config.js';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = config.MONGO_URI;
    
    if (!mongoUri) {
        throw new Error('MONGO_URI is not defined in .env file or config.js');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    
    // Basic parsing to avoid logging sensitive info if present
    const uriParts = mongoUri.split('@');
    const dbHost = uriParts.length > 1 ? uriParts[1] : uriParts[0].split('//')[1];

    // ✅ Replaced console.log with logger.info
    logger.info('MongoDB Connected Successfully', { host: dbHost.split('/')[0] });
    
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    // Keep a console.error for critical failures during database connection
    console.error('❌ Database connection failed critically:', error.message);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Database disconnected');
  }
}
