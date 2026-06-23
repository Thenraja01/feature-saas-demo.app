import pino from 'pino';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure transport for pretty printing in development
const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: true,
        messageFormat: '{levelLabel} {msg}',
      },
      level: 'info',
    },
    // Log to file in production
    ...(process.env.NODE_ENV === 'production' ? [{
      target: 'pino/file',
      options: {
        destination: path.join(logsDir, 'app.log'),
        mkdir: true,
      },
      level: 'info',
    }] : []),
    // Error log file
    ...(process.env.NODE_ENV === 'production' ? [{
      target: 'pino/file',
      options: {
        destination: path.join(logsDir, 'error.log'),
        mkdir: true,
      },
      level: 'error',
    }] : []),
  ],
});

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'feature-flag-system',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, transport);

// Create child loggers for different contexts
export const createChildLogger = (context) => {
  return logger.child({ context });
};

// Logger for database operations
export const dbLogger = logger.child({ module: 'database' });

// Logger for authentication
export const authLogger = logger.child({ module: 'auth' });

// Logger for API requests
export const apiLogger = logger.child({ module: 'api' });
// Add organization logger
export const organizationLogger = logger.child({ module: 'organizations' });
// Add feature flag logger
export const featureFlagLogger = logger.child({ module: 'feature-flags' });
export default logger;