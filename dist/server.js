"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
console.log('Loading environment variables...');
dotenv_1.default.config();
console.log('Environment variables loaded');
console.log('Importing modules...');
try {
    console.log('Importing app...');
    const app = require('./app').default;
    console.log('App imported successfully');
    console.log('Importing logger...');
    const { logger } = require('./utils/logger');
    console.log('Logger imported successfully');
    console.log('Importing database functions...');
    const { checkDatabaseConnection, getDatabaseStats } = require('./config/database');
    console.log('Database functions imported successfully');
    const PORT = process.env['PORT'] || 3000;
    const NODE_ENV = process.env['NODE_ENV'] || 'development';
    console.log(`PORT: ${PORT}, NODE_ENV: ${NODE_ENV}`);
    const gracefulShutdown = (signal) => {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        logger.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    const startServer = async () => {
        try {
            console.log('Starting server...');
            if (typeof checkDatabaseConnection !== 'function') {
                console.error('checkDatabaseConnection is not a function');
                logger.error('checkDatabaseConnection is not a function');
                process.exit(1);
            }
            console.log('Checking database connection...');
            logger.info('Checking database connection...');
            const dbConnected = await checkDatabaseConnection();
            console.log('Database connection result:', dbConnected);
            if (!dbConnected) {
                console.error('Failed to connect to database');
                logger.error('Failed to connect to database');
                process.exit(1);
            }
            try {
                console.log('Getting database statistics...');
                const stats = await getDatabaseStats();
                console.log('Database statistics:', stats);
                logger.info('Database statistics:', stats);
            }
            catch (error) {
                console.warn('Could not retrieve database statistics:', error);
                logger.warn('Could not retrieve database statistics:', error);
            }
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
            server.on('error', (error) => {
                console.error('Server error:', error);
                if (error.code === 'EADDRINUSE') {
                    console.error(`Port ${PORT} is already in use`);
                    logger.error(`Port ${PORT} is already in use`);
                }
                else {
                    logger.error('Server error:', error);
                }
                process.exit(1);
            });
            global.server = server;
        }
        catch (error) {
            console.error('Failed to start server:', error);
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    };
    console.log('Calling startServer...');
    startServer().catch((error) => {
        console.error('Error in startServer:', error);
        process.exit(1);
    });
}
catch (error) {
    console.error('Error during module imports:', error);
    process.exit(1);
}
//# sourceMappingURL=server.js.map