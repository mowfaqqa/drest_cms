import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: AdminRole;
                permissions?: any;
            };
        }
    }
}
export declare const authMiddleware: (req: Request, _res: any, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: AdminRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireOwnership: (resourceIdParam?: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const userRateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const generateToken: (user: {
    id: string;
    email: string;
    role: AdminRole;
}) => string;
export declare const generateRefreshToken: (userId: string) => string;
//# sourceMappingURL=auth.middleware.d.ts.map