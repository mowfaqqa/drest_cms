"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const error_middleware_2 = require("../middleware/error.middleware");
class AuthController {
    constructor() {
        this.login = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new error_middleware_1.ValidationError('Email and password are required');
            }
            const user = await this.authService.validateCredentials(email, password);
            const accessToken = (0, auth_middleware_1.generateToken)(user);
            const refreshToken = (0, auth_middleware_1.generateRefreshToken)(user.id);
            await this.authService.storeRefreshToken(user.id, refreshToken, {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip
            });
            await this.authService.updateLastLogin(user.id);
            const cookieOptions = {
                httpOnly: true,
                secure: process.env['NODE_ENV'] === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            };
            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000
            });
            res.cookie('refreshToken', refreshToken, cookieOptions);
            (0, logger_1.logSecurityEvent)('SUCCESSFUL_LOGIN', {
                userId: user.id,
                email: user.email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            (0, logger_1.logAudit)('LOGIN', user.id, 'admin_user', user.id);
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
        this.refreshToken = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                throw new error_middleware_1.AuthenticationError('Refresh token is required');
            }
            const result = await this.authService.refreshAccessToken(refreshToken);
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env['NODE_ENV'] === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000
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
        this.logout = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.cookies;
            if (refreshToken) {
                await this.authService.revokeRefreshToken(refreshToken);
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            if (req.user) {
                (0, logger_1.logSecurityEvent)('LOGOUT', {
                    userId: req.user.id,
                    email: req.user.email,
                    ip: req.ip
                });
                (0, logger_1.logAudit)('LOGOUT', req.user.id, 'admin_user', req.user.id);
            }
            res.json({
                success: true,
                message: 'Logout successful'
            });
        });
        this.getProfile = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('User not authenticated');
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
        this.updateProfile = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('User not authenticated');
            }
            const { firstName, lastName, avatar } = req.body;
            const updatedUser = await this.authService.updateProfile(req.user.id, {
                firstName,
                lastName,
                avatar
            });
            (0, logger_1.logAudit)('UPDATE', req.user.id, 'admin_user', req.user.id, {
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
        this.changePassword = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('User not authenticated');
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                throw new error_middleware_1.ValidationError('Current password and new password are required');
            }
            await this.authService.changePassword(req.user.id, currentPassword, newPassword);
            await this.authService.revokeAllRefreshTokens(req.user.id);
            (0, logger_1.logSecurityEvent)('PASSWORD_CHANGED', {
                userId: req.user.id,
                email: req.user.email,
                ip: req.ip
            });
            (0, logger_1.logAudit)('PASSWORD_CHANGE', req.user.id, 'admin_user', req.user.id);
            res.json({
                success: true,
                message: 'Password changed successfully. Please login again.'
            });
        });
        this.getSessions = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('User not authenticated');
            }
            const sessions = await this.authService.getActiveSessions(req.user.id);
            res.json({
                success: true,
                data: {
                    sessions: sessions.map((session) => ({
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
        this.revokeSession = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new error_middleware_1.AuthenticationError('User not authenticated');
            }
            const { sessionId } = req.params;
            await this.authService.revokeSession(req.user.id, sessionId);
            (0, logger_1.logSecurityEvent)('SESSION_REVOKED', {
                userId: req.user.id,
                sessionId,
                ip: req.ip
            });
            res.json({
                success: true,
                message: 'Session revoked successfully'
            });
        });
        this.validateToken = (0, error_middleware_2.asyncHandler)(async (req, res) => {
            res.json({
                success: true,
                data: {
                    valid: true,
                    user: req.user
                }
            });
        });
        this.authService = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map