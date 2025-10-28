/**
 * Database Connection - MongoDB
 * Simple connection setup for intern level
 */

import mongoose from 'mongoose';
import { logger } from '../core/logger.js';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGO_URI || 'MONGO_URI=mongodb+srv://karthikguddanti_25:abcdefgh@cluster0.mtkzmzx.mongodb.net/digantra?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri);
    isConnected = true;
    
    console.log('🗄️  MongoDB Connected Successfully!');
    console.log(`   📍 Database: ${mongoUri.split('/').pop()}`);
    console.log(`   🌐 Host: ${mongoUri.split('//')[1].split(':')[0]}`);
    logger.info('Database connected successfully', { uri: mongoUri });
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
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
