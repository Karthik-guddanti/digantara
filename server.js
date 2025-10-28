import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/database/database-connection.js';
import JobScheduler from './src/scheduler/job-scheduler.js';
import JobService from './src/database/job-service.js';
import { JobRepository } from './src/database/job-repository.js';
import jobRoutes from './src/api/routes/jobRoutes.js';
import {
  corsMiddleware,
  requestSizeLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger
} from './src/core/middleware.js';
import { logger } from './src/core/logger.js';

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Basic middleware
app.use(corsMiddleware());
app.use(requestSizeLimiter);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health & test routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Scheduler API',
    version: '1.0.0',
  });
});

app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server test route works ✅' });
});

// ✅ Variables for services (initialized later)
let schedulerService = null;
let jobService = null;
let jobRepository = null;

// ✅ Middleware to inject services into request
app.use((req, res, next) => {
  res.locals.jobService = jobService;
  res.locals.jobRepository = jobRepository;
  res.locals.schedulerService = schedulerService;
  next();
});

const PORT = process.env.PORT || 8000;

// ✅ Main startup function
async function startServer() {
  try {
    // 1️⃣ Connect to MongoDB
    await connectToDatabase();
    logger.info('Database connected successfully');

    // 2️⃣ Initialize core services
    jobRepository = new JobRepository();
    jobService = JobService;
    schedulerService = new JobScheduler(jobService, null);

    // 3️⃣ Start the scheduler
    await schedulerService.start();
    logger.info('Job scheduler started successfully');

    // 4️⃣ Mount routes AFTER everything is ready
    app.use('/api/jobs', jobRoutes);

    // 5️⃣ Scheduler status endpoint
    app.get('/api/scheduler/status', (req, res) => {
      try {
        const status = schedulerService.getStatus();
        res.json({
          success: true,
          data: status,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    // 6️⃣ Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 7️⃣ Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🌐 Server Started Successfully!');
      console.log(`   🚀 Port: ${PORT}`);
      console.log(`   📋 API: http://localhost:${PORT}/api/jobs`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/`);
      console.log(`   📊 Scheduler: http://localhost:${PORT}/api/scheduler/status`);
      console.log('');
      console.log('🎉 Ready to schedule jobs!');
      console.log('=====================================');
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Server startup failed:', error.message);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// ✅ Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    if (schedulerService) await schedulerService.shutdown();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    if (schedulerService) await schedulerService.shutdown();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error.message);
    process.exit(1);
  }
});

// ✅ Start the server
startServer();
