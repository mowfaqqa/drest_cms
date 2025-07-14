import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

// Extend NodeJS.Global to include 'server'
declare global {
  // eslint-disable-next-line no-var
  var server: import('http').Server | undefined;
}

import app from './app';
import { logger } from '@/utils/logger';
import { checkDatabaseConnection, getDatabaseStats } from '@/config/database';

const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
//   server.close(() => {
//     logger.info('HTTP server closed');
    
//     // Close database connections and other cleanup
//     process.exit(0);
//   });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Check database connection
    logger.info('Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Get initial database statistics
    try {
      const stats = await getDatabaseStats();
      logger.info('Database statistics:', stats);
    } catch (error) {
      logger.warn('Could not retrieve database statistics:', error);
    }

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📝 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        logger.info(`🎨 Admin Dashboard: http://localhost:${PORT}/admin`);
        logger.info(`📚 API Documentation: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}/docs`);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    // Export server for graceful shutdown
    global.server = server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Export for testing
export default app;