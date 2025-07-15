import dotenv from 'dotenv';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();
console.log('Environment variables loaded');

// Extend NodeJS.Global to include 'server'
declare global {
  // eslint-disable-next-line no-var
  var server: import('http').Server | undefined;
}

console.log('Importing modules...');

try {
  console.log('Importing app...');
  const app = require('./app').default;
  console.log('App imported successfully');

  console.log('Importing logger...');
  const { logger } = require('./utils/logger');
  console.log('Logger imported successfully');

  console.log('Importing database functions...');
  // Use require instead of import for better error handling
  const { checkDatabaseConnection, getDatabaseStats } = require('./config/database');
  console.log('Database functions imported successfully');

  const PORT = process.env['PORT'] || 3000;
  const NODE_ENV = process.env['NODE_ENV'] || 'development';

  console.log(`PORT: ${PORT}, NODE_ENV: ${NODE_ENV}`);

  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Graceful shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start server
  const startServer = async () => {
    try {
      console.log('Starting server...');
      
      // Check if database functions exist
      if (typeof checkDatabaseConnection !== 'function') {
        console.error('checkDatabaseConnection is not a function');
        logger.error('checkDatabaseConnection is not a function');
        process.exit(1);
      }

      // Check database connection
      console.log('Checking database connection...');
      logger.info('Checking database connection...');
      
      const dbConnected = await checkDatabaseConnection();
      console.log('Database connection result:', dbConnected);
      
      if (!dbConnected) {
        console.error('Failed to connect to database');
        logger.error('Failed to connect to database');
        process.exit(1);
      }

      // Get initial database statistics
      try {
        console.log('Getting database statistics...');
        const stats = await getDatabaseStats();
        console.log('Database statistics:', stats);
        logger.info('Database statistics:', stats);
      } catch (error) {
        console.warn('Could not retrieve database statistics:', error);
        logger.warn('Could not retrieve database statistics:', error);
      }

      // Start the server
      console.log('Starting HTTP server...');
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server started successfully!`);
        console.log(`📝 Environment: ${NODE_ENV}`);
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`🔗 API URL: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        
        logger.info(`🚀 Server started successfully!`);
        logger.info(`📝 Environment: ${NODE_ENV}`);
        logger.info(`🌐 Server running on port ${PORT}`);
        logger.info(`🔗 API URL: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
        
        if (NODE_ENV === 'development') {
          console.log(`🎨 Admin Dashboard: http://localhost:${PORT}/admin`);
          console.log(`📚 API Documentation: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}/docs`);
          logger.info(`🎨 Admin Dashboard: http://localhost:${PORT}/admin`);
          logger.info(`📚 API Documentation: http://localhost:${PORT}${process.env['API_PREFIX'] || '/api/v1'}/docs`);
        }
      });

      // Handle server errors
      server.on('error', (error: any) => {
        console.error('Server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use`);
          logger.error(`Port ${PORT} is already in use`);
        } else {
          logger.error('Server error:', error);
        }
        process.exit(1);
      });

      // Export server for graceful shutdown
      global.server = server;

    } catch (error) {
      console.error('Failed to start server:', error);
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  // Start the application
  console.log('Calling startServer...');
  startServer().catch((error) => {
    console.error('Error in startServer:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('Error during module imports:', error);
  process.exit(1);
}