export default {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/digantra',
  REDIS_URL: process.env.REDIS_URL || null,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // add other app-specific config values here
};