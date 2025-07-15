"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
class AuthService {
    async validateCredentials(email, password) {
        const user = await database_1.prisma.adminUser.findUnique({
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
            (0, logger_1.logSecurityEvent)('LOGIN_ATTEMPT_INVALID_EMAIL', {
                email,
                timestamp: new Date()
            });
            throw new error_middleware_1.AuthenticationError('Invalid email or password');
        }
        if (!user.isActive) {
            (0, logger_1.logSecurityEvent)('LOGIN_ATTEMPT_INACTIVE_USER', {
                userId: user.id,
                email: user.email
            });
            throw new error_middleware_1.AuthenticationError('Account has been deactivated');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            (0, logger_1.logSecurityEvent)('LOGIN_ATTEMPT_INVALID_PASSWORD', {
                userId: user.id,
                email: user.email
            });
            throw new error_middleware_1.AuthenticationError('Invalid email or password');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: user.permissions,
            avatar: user.avatar || undefined,
            lastLoginAt: user.lastLoginAt || undefined,
            createdAt: user.createdAt
        };
    }
    async storeRefreshToken(userId, refreshToken, sessionData) {
        const createData = {
            adminUserId: userId,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true
        };
        if (sessionData.userAgent) {
            createData.deviceInfo = { userAgent: sessionData.userAgent };
        }
        if (sessionData.ipAddress) {
            createData.ipAddress = sessionData.ipAddress;
        }
        await database_1.prisma.adminSession.create({
            data: createData
        });
    }
    async refreshAccessToken(refreshToken) {
        try {
            const session = await database_1.prisma.adminSession.findUnique({
                where: { refreshToken },
                include: {
                    adminUser: {
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
                throw new error_middleware_1.AuthenticationError('Invalid or expired refresh token');
            }
            if (!session.adminUser.isActive) {
                throw new error_middleware_1.AuthenticationError('Account has been deactivated');
            }
            const accessToken = jsonwebtoken_1.default.sign({
                userId: session.adminUser.id,
                email: session.adminUser.email,
                role: session.adminUser.role
            }, process.env['JWT_SECRET'], {
                expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
                issuer: 'drest-cms',
                audience: 'drest-admin'
            });
            return { accessToken };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new error_middleware_1.AuthenticationError('Invalid refresh token');
            }
            throw error;
        }
    }
    async revokeRefreshToken(refreshToken) {
        await database_1.prisma.adminSession.updateMany({
            where: { refreshToken },
            data: { isActive: false }
        });
    }
    async revokeAllRefreshTokens(userId) {
        await database_1.prisma.adminSession.updateMany({
            where: { adminUserId: userId },
            data: { isActive: false }
        });
    }
    async updateLastLogin(userId) {
        await database_1.prisma.adminUser.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() }
        });
    }
    async getUserProfile(userId) {
        const user = await database_1.prisma.adminUser.findUnique({
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
            throw new error_middleware_1.AuthenticationError('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: user.permissions,
            avatar: user.avatar || undefined,
            lastLoginAt: user.lastLoginAt || undefined,
            createdAt: user.createdAt
        };
    }
    async updateProfile(userId, data) {
        const user = await database_1.prisma.adminUser.update({
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
            permissions: user.permissions,
            avatar: user.avatar || undefined,
            lastLoginAt: user.lastLoginAt || undefined,
            createdAt: user.createdAt
        };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.adminUser.findUnique({
            where: { id: userId },
            select: { password: true }
        });
        if (!user) {
            throw new error_middleware_1.AuthenticationError('User not found');
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new error_middleware_1.AuthenticationError('Current password is incorrect');
        }
        if (newPassword.length < 8) {
            throw new error_middleware_1.ValidationError('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            throw new error_middleware_1.ValidationError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.adminUser.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
    }
    async getActiveSessions(userId) {
        return await database_1.prisma.adminSession.findMany({
            where: {
                adminUserId: userId,
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
    async revokeSession(userId, sessionId) {
        const session = await database_1.prisma.adminSession.findFirst({
            where: {
                id: sessionId,
                adminUserId: userId
            }
        });
        if (!session) {
            throw new error_middleware_1.ValidationError('Session not found');
        }
        await database_1.prisma.adminSession.update({
            where: { id: sessionId },
            data: { isActive: false }
        });
    }
    async createAdminUser(data) {
        const existingUser = await database_1.prisma.adminUser.findUnique({
            where: { email: data.email.toLowerCase() }
        });
        if (existingUser) {
            throw new error_middleware_1.ValidationError('User with this email already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await database_1.prisma.adminUser.create({
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
            permissions: user.permissions,
            avatar: user.avatar || undefined,
            lastLoginAt: user.lastLoginAt || undefined,
            createdAt: user.createdAt
        };
    }
    async cleanupExpiredSessions() {
        const result = await database_1.prisma.adminSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false }
                ]
            }
        });
        logger_1.logger.info(`Cleaned up ${result.count} expired admin sessions`);
        return result.count;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map