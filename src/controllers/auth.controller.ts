import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { generateToken, generateRefreshToken } from '@/middleware/auth.middleware';
import { AuthenticationError, ValidationError } from '@/middleware/error.middleware';
import { logSecurityEvent, logAudit } from '@/utils/logger';
import { asyncHandler } from '@/middleware/error.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Admin login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await this.authService.validateCredentials(email, password);

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await this.authService.storeRefreshToken(user.id, refreshToken, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Update last login
    await this.authService.updateLastLogin(user.id);

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Log successful login
    logSecurityEvent('SUCCESSFUL_LOGIN', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logAudit('LOGIN', user.id, 'admin_user', user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions
        },
        accessToken,
        expiresIn: '15m'
      }
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        expiresIn: '15m'
      }
    });
  });

  /**
   * Logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Log logout
    if (req.user) {
      logSecurityEvent('LOGOUT', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      });

      logAudit('LOGOUT', req.user.id, 'admin_user', req.user.id);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const user = await this.authService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { firstName, lastName, avatar } = req.body;

    const updatedUser = await this.authService.updateProfile(req.user.id, {
      firstName,
      lastName,
      avatar
    });

    logAudit('UPDATE', req.user.id, 'admin_user', req.user.id, {
      firstName,
      lastName,
      avatar
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          avatar: updatedUser.avatar
        }
      }
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    await this.authService.changePassword(req.user.id, currentPassword, newPassword);

    // Revoke all refresh tokens to force re-login
    await this.authService.revokeAllRefreshTokens(req.user.id);

    logSecurityEvent('PASSWORD_CHANGED', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    logAudit('PASSWORD_CHANGE', req.user.id, 'admin_user', req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  });

  /**
   * Get active sessions
   */
  getSessions = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const sessions = await this.authService.getActiveSessions(req.user.id);

    res.json({
      success: true,
      data: {
        sessions: sessions.map((session : any) => ({
          id: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isCurrentSession: session.refreshToken === req.cookies['refreshToken']
        }))
      }
    });
  });

  /**
   * Revoke session
   */
  revokeSession = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { sessionId } = req.params;

    await this.authService.revokeSession(req.user.id, sessionId);

    logSecurityEvent('SESSION_REVOKED', {
      userId: req.user.id,
      sessionId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  });

  /**
   * Validate token (for internal use)
   */
  validateToken = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        valid: true,
        user: req.user
      }
    });
  });
}