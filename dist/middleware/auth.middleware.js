"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateToken = exports.userRateLimit = exports.requireOwnership = exports.requirePermission = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    const cookieToken = req.cookies?.['accessToken'];
    if (cookieToken) {
        return cookieToken;
    }
    return null;
};
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new error_middleware_1.AuthenticationError('Token has expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new error_middleware_1.AuthenticationError('Invalid token');
        }
        throw new error_middleware_1.AuthenticationError('Token verification failed');
    }
};
const authMiddleware = async (req, _res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            (0, logger_1.logSecurityEvent)('MISSING_TOKEN', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.originalUrl
            });
            throw new error_middleware_1.AuthenticationError('Access token is required');
        }
        const decoded = verifyToken(token);
        const user = await database_1.prisma.adminUser.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                permissions: true,
                isActive: true,
                lastLoginAt: true
            }
        });
        if (!user) {
            (0, logger_1.logSecurityEvent)('USER_NOT_FOUND', {
                userId: decoded.userId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            throw new error_middleware_1.AuthenticationError('User not found');
        }
        if (!user.isActive) {
            (0, logger_1.logSecurityEvent)('INACTIVE_USER_ACCESS', {
                userId: user.id,
                email: user.email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            throw new error_middleware_1.AuthenticationError('Account has been deactivated');
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const decoded = verifyToken(token);
            const user = await database_1.prisma.adminUser.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    permissions: true,
                    isActive: true
                }
            });
            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new error_middleware_1.AuthenticationError('Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            (0, logger_1.logSecurityEvent)('INSUFFICIENT_PERMISSIONS', {
                userId: req.user.id,
                requiredRoles: roles,
                userRole: req.user.role,
                path: req.originalUrl,
                ip: req.ip
            });
            throw new error_middleware_1.AuthorizationError(`Requires one of: ${roles.join(', ')}`);
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permission) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new error_middleware_1.AuthenticationError('Authentication required');
        }
        if (req.user.role === client_1.AdminRole.SUPER_ADMIN) {
            return next();
        }
        const userPermissions = req.user.permissions || {};
        if (!userPermissions[permission]) {
            (0, logger_1.logSecurityEvent)('INSUFFICIENT_PERMISSIONS', {
                userId: req.user.id,
                requiredPermission: permission,
                userPermissions: Object.keys(userPermissions),
                path: req.originalUrl,
                ip: req.ip
            });
            throw new error_middleware_1.AuthorizationError(`Missing permission: ${permission}`);
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireOwnership = (resourceIdParam = 'id') => {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('Authentication required');
            }
            if (req.user.role === client_1.AdminRole.SUPER_ADMIN) {
                return next();
            }
            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
                throw new error_middleware_1.AuthorizationError('Resource ID is required');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnership = requireOwnership;
const userRateLimit = (maxRequests, windowMs) => {
    const userRequests = new Map();
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const userId = req.user.id;
        const now = Date.now();
        const userLimit = userRequests.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            userRequests.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        if (userLimit.count >= maxRequests) {
            (0, logger_1.logSecurityEvent)('RATE_LIMIT_EXCEEDED', {
                userId,
                path: req.originalUrl,
                ip: req.ip,
                requestCount: userLimit.count
            });
            res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            });
            return;
        }
        userLimit.count++;
        next();
    };
};
exports.userRateLimit = userRateLimit;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        role: user.role
    }, process.env['JWT_SECRET'], {
        expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
        issuer: 'drest-cms',
        audience: 'drest-admin'
    });
};
exports.generateToken = generateToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env['JWT_REFRESH_SECRET'], {
        expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
        issuer: 'drest-cms',
        audience: 'drest-admin'
    });
};
exports.generateRefreshToken = generateRefreshToken;
//# sourceMappingURL=auth.middleware.js.map