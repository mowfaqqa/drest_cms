import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminRole } from '@prisma/client';
import { prisma } from '@/config/database';
import { AuthenticationError, ValidationError } from '@/middleware/error.middleware';
import { logger, logSecurityEvent } from '@/utils/logger';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: any;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
}

interface SessionData {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  /**
   * Validate user credentials
   */
  async validateCredentials(email: string, password: string) {
    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        permissions: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_EMAIL', {
        email,
        timestamp: new Date()
      });
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      logSecurityEvent('LOGIN_ATTEMPT_INACTIVE_USER', {
        userId: user.id,
        email: user.email
      });
      throw new AuthenticationError('Account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', {
        userId: user.id,
        email: user.email
      });
      throw new AuthenticationError('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions as any,
      avatar: user.avatar || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt
    };
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId: string, refreshToken: string, sessionData: SessionData) {
    await prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        deviceInfo: sessionData.userAgent ? { userAgent: sessionData.userAgent } : null,
        ipAddress: sessionData.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true
      }
    });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env['JWT_REFRESH_SECRET']!) as { userId: string };

      // Check if refresh token exists and is active
      const session = await prisma.userSession.findUnique({
        where: { refreshToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      if (!session.user.isActive) {
        throw new AuthenticationError('Account has been deactivated');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        process.env['JWT_SECRET']!,
        {
          expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
          issuer: 'drest-cms',
          audience: 'drest-admin'
        }
      );

      return { accessToken };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { refreshToken },
      data: { isActive: false }
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.adminUser.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions as any,
      avatar: user.avatar || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<UserProfile> {
    const user = await prisma.adminUser.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.avatar && { avatar: data.avatar })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions as any,
      avatar: user.avatar || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new ValidationError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string) {
    return await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        refreshToken: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }

  /**
   * Create admin user (for setup/seeding)
   */
  async createAdminUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    permissions?: any;
  }): Promise<UserProfile> {
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        permissions: data.permissions || {},
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions as any,
      avatar: user.avatar || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    });

    logger.info(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  }
}