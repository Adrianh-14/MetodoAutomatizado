"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
class AuthService {
    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        if (!user.tenant.isActive) {
            throw new Error('Tenant is inactive');
        }
        const isValid = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant: {
                    id: user.tenant.id,
                    name: user.tenant.name,
                    slug: user.tenant.slug,
                },
            },
        };
    }
    async refresh(refreshTokenStr) {
        const payload = (0, jwt_1.verifyRefreshToken)(refreshTokenStr);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { tenant: true },
        });
        if (!user || !user.isActive || !user.tenant.isActive) {
            throw new Error('User or tenant inactive');
        }
        const newPayload = {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(newPayload);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                slug: user.tenant.slug,
            },
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map