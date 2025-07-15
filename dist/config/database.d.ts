import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const checkDatabaseConnection: () => Promise<boolean>;
export declare const getDatabaseStats: () => Promise<{
    products: number;
    categories: number;
    users: number;
    orders: number;
}>;
export { prisma };
export default prisma;
//# sourceMappingURL=database.d.ts.map