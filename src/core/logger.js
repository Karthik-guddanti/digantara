import winston from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Custom log format for console output
const logFormat = printf(({ level, message, timestamp, instanceId, ...metadata }) => {
  let log = `${timestamp} ${level}: ${message}`;
  if (instanceId) {
    log = `${timestamp} ${level} [${instanceId}]: ${message}`;
  }
  // Add metadata if available and not empty
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  return log;
});

let loggerInstance;

if (!loggerInstance) {
  loggerInstance = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // Default to 'info'
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    transports: [
      // ✅ CHANGED: Ensure only one console transport
      // Only add console transport if not already present to prevent duplicates.
      // This is a common issue with hot-reloading (like nodemon).
      new winston.transports.Console({
        format: combine(
          colorize({ all: true }), // Colorize console output
          align(),
          logFormat
        )
      })
    ],
    // ✅ ADDED: Exit on error to prevent resource leaks in production
    exitOnError: false, 
  });

  // If we're in development, also log unhandled rejections
  if (process.env.NODE_ENV !== 'production') {
    loggerInstance.exceptions.handle(
      new winston.transports.Console({
        format: combine(colorize(), logFormat),
      })
    );
    loggerInstance.rejections.handle(
      new winston.transports.Console({
        format: combine(colorize(), logFormat),
      })
    );
  }
}

export const logger = loggerInstance;

