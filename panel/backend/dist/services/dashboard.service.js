"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DashboardService {
    async getStats(tenantId, role, userId) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isUser = role === 'user';
        const [totalCookies, availableCookies, downloadedCookies, todayCookies, countriesResult] = await Promise.all([
            prisma.cookie.count({ where: isUser ? { tenantId, downloadedBy: userId } : { tenantId } }),
            prisma.cookie.count({ where: isUser ? { tenantId, status: 'available' } : { tenantId, status: 'available' } }),
            prisma.cookie.count({ where: isUser ? { tenantId, status: 'downloaded', downloadedBy: userId } : { tenantId, status: 'downloaded' } }),
            prisma.cookie.count({
                where: isUser ? {
                    tenantId,
                    downloadedBy: userId,
                    createdAt: { gte: todayStart },
                } : {
                    tenantId,
                    createdAt: { gte: todayStart },
                },
            }),
            prisma.cookie.groupBy({
                by: ['countryCode'],
                where: isUser ? { tenantId, downloadedBy: userId } : { tenantId },
                _count: true,
            }),
        ]);
        return {
            totalCookies,
            availableCookies,
            downloadedCookies,
            todayCookies,
            totalCountries: countriesResult.length,
        };
    }
    async getCountryStats(tenantId, role, userId) {
        const isUser = role === 'user';
        const countries = await prisma.cookie.groupBy({
            by: ['countryCode', 'countryName'],
            where: isUser ? { tenantId, downloadedBy: userId } : { tenantId },
            _count: { _all: true },
        });
        const countryStats = await Promise.all(countries.map(async (c) => {
            const available = isUser ? 0 : await prisma.cookie.count({
                where: { tenantId, countryCode: c.countryCode, status: 'available' },
            });
            const downloaded = await prisma.cookie.count({
                where: isUser ? { tenantId, countryCode: c.countryCode, status: 'downloaded', downloadedBy: userId } : { tenantId, countryCode: c.countryCode, status: 'downloaded' },
            });
            return {
                countryCode: c.countryCode,
                countryName: c.countryName,
                total: c._count._all,
                available,
                downloaded,
            };
        }));
        return countryStats.sort((a, b) => b.total - a.total);
    }
    async getRecentActivity(tenantId, limit = 10, role, userId) {
        const isUser = role === 'user';
        return prisma.downloadLog.findMany({
            where: isUser ? { tenantId, userId } : { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: { select: { name: true, email: true } },
            },
        });
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map