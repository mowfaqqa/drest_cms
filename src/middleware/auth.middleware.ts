import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { AuthenticationError, AuthorizationError } from '@/middleware/error.middleware';
import { logger, logSecurityEvent } from '@/utils/logger';
import { AdminRole } from '@prisma/client';

// Extend Request interface to include user
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

interface JWTPayload {
  userId: string;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

// Extract token from request
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

// Verify JWT token
const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
};

// Main authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      logSecurityEvent('MISSING_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });
      throw new AuthenticationError('Access token is required');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.adminUser.findUnique({
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
      logSecurityEvent('USER_NOT_FOUND', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      logSecurityEvent('INACTIVE_USER_ACCESS', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new AuthenticationError('Account has been deactivated');
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions as any
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.adminUser.findUnique({
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
          permissions: user.permissions as any
        };
      }
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: AdminRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.originalUrl,
        ip: req.ip
      });
      throw new AuthorizationError(`Requires one of: ${roles.join(', ')}`);
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Super admin has all permissions
    if (req.user.role === AdminRole.SUPER_ADMIN) {
      return next();
    }

    // Check if user has specific permission
    const userPermissions = req.user.permissions || {};
    if (!userPermissions[permission]) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions: Object.keys(userPermissions),
        path: req.originalUrl,
        ip: req.ip
      });
      throw new AuthorizationError(`Missing permission: ${permission}`);
    }

    next();
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Super admin can access everything
      if (req.user.role === AdminRole.SUPER_ADMIN) {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new AuthorizationError('Resource ID is required');
      }

      // Add your ownership check logic here
      // This is a placeholder - implement based on your business logic
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
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
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
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

// Generate JWT token
export const generateToken = (user: { id: string; email: string; role: AdminRole }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env['JWT_SECRET']!,
    {
      expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
      issuer: 'drest-cms',
      audience: 'drest-admin'
    } as any
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env['JWT_REFRESH_SECRET']!,
    {
      expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
      issuer: 'drest-cms',
      audience: 'drest-admin'
    } as any
  );
};