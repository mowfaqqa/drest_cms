"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getDatabaseStats = exports.checkDatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
    errorFormat: 'pretty',
});
exports.prisma = prisma;
if (process.env['NODE_ENV'] === 'development') {
    globalThis.__prisma = prisma;
}
process.on('beforeExit', async () => {
    logger_1.logger.info('Disconnecting from database...');
    await prisma.$disconnect();
});
process.on('SIGINT', async () => {
    logger_1.logger.info('Received SIGINT, disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('Received SIGTERM, disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});
const checkDatabaseConnection = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
const getDatabaseStats = async () => {
    try {
        const [productCount, categoryCount, userCount, orderCount,] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.user.count(),
            prisma.order.count(),
        ]);
        return {
            products: productCount,
            categories: categoryCount,
            users: userCount,
            orders: orderCount,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get database stats:', error);
        throw error;
    }
};
exports.getDatabaseStats = getDatabaseStats;
exports.default = prisma;
//# sourceMappingURL=database.js.map