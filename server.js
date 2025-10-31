import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/database/database-connection.js';
import { SchedulerManager } from './src/scheduler/scheduler-manager.js';
// ✅ FIXED: Import the class 'JobService', not the default object
import { JobService } from './src/database/job-service.js';
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

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(corsMiddleware());
app.use(requestSizeLimiter);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Variables for services
let schedulerService = null;
let jobService = null;
let jobRepository = null;

// Main startup function
async function startServer() {
  try {
    // 1️⃣ Connect to MongoDB
    await connectToDatabase();
    logger.info('Database connected successfully');

    // 2️⃣ Initialize core services
    // ✅ FIXED: Implement Dependency Injection
    jobRepository = new JobRepository();
    jobService = new JobService(jobRepository); // Inject repository into service
    
    schedulerService = new SchedulerManager(jobService); // Inject service into manager

    // 3️⃣ Middleware to inject services into request
    // This MUST come after services are initialized
    app.use((req, res, next) => {
      res.locals.jobService = jobService;
      res.locals.jobRepository = jobRepository;
      res.locals.schedulerService = schedulerService;
      next();
    });

    // 4️⃣ Start the scheduler
    await schedulerService.start();
    logger.info('Job scheduler started successfully');

    // 5️⃣ Mount routes AFTER everything is ready
    app.use('/api/jobs', jobRoutes);

    // 6️⃣ Scheduler status endpoint
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

    // 7️⃣ Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 8️⃣ Start listening
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server listening on port ${PORT}`, {
        api: `http://localhost:${PORT}/api/jobs`,
        schedulerStatus: `http://localhost:${PORT}/api/scheduler/status`
      });
    });

  } catch (error) {
    logger.error('Server startup failed:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown() {
  logger.info('Shutdown signal received, shutting down gracefully');
  try {
    if (schedulerService) await schedulerService.shutdown();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();