import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
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

if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = prisma;
}

// Logging for queries in development
if (process.env['NODE_ENV'] === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Error logging
prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

// Connection lifecycle logging
prisma.$on('info', (e: any) => {
  logger.info('Prisma Info:', e.message);
});

prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning:', e.message);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Database statistics
export const getDatabaseStats = async () => {
  try {
    const [
      productCount,
      categoryCount,
      userCount,
      orderCount,
    ] = await Promise.all([
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
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    throw error;
  }
};

export { prisma };
export default prisma;