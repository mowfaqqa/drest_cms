import { AdminRole } from '@prisma/client';
export declare class AuthService {
    validateCredentials(email: string, password: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.AdminRole;
        permissions: any;
        avatar: string | undefined;
        lastLoginAt: Date | undefined;
        createdAt: Date;
    }>;
    storeRefreshToken(userId: string, refreshToken: string, sessionData: any): Promise<void>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    revokeAllRefreshTokens(userId: string): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;
    getUserProfile(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.AdminRole;
        permissions: any;
        avatar: string | undefined;
        lastLoginAt: Date | undefined;
        createdAt: Date;
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.AdminRole;
        permissions: any;
        avatar: string | undefined;
        lastLoginAt: Date | undefined;
        createdAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getActiveSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        refreshToken: string;
        deviceInfo: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<void>;
    createAdminUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: AdminRole;
        permissions?: any;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.AdminRole;
        permissions: any;
        avatar: string | undefined;
        lastLoginAt: Date | undefined;
        createdAt: Date;
    }>;
    cleanupExpiredSessions(): Promise<number>;
}
//# sourceMappingURL=auth.service.d.ts.map