import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    constructor();
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    revokeSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    validateToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=auth.controller.d.ts.map