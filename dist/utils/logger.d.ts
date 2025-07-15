import winston from 'winston';
declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, duration: number) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logSecurityEvent: (event: string, details: any) => void;
export declare const logPerformance: (operation: string, duration: number, metadata?: any) => void;
export declare const logAudit: (action: string, userId: string, resource: string, resourceId: string, changes?: any) => void;
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map