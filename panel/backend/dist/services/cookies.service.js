"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookiesService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CookiesService {
    async list(tenantId, page = 1, limit = 50, filters, role, userId) {
        const where = { tenantId };
        if (filters.country) {
            where.countryCode = filters.country;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.cookieData = { contains: filters.search };
        }
        if (role === 'user') {
            if (filters.status === 'downloaded') {
                where.downloadedBy = userId;
            }
            else if (!filters.status) {
                where.OR = [
                    { status: 'available' },
                    { downloadedBy: userId }
                ];
            }
        }
        const [cookies, total] = await Promise.all([
            prisma.cookie.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    cookieData: true,
                    countryCode: true,
                    countryName: true,
                    status: true,
                    isDownloaded: true,
                    createdAt: true,
                    downloadedAt: true,
                },
            }),
            prisma.cookie.count({ where }),
        ]);
        return {
            cookies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async upload(tenantId, cookies, countryCode, countryName) {
        const data = cookies.map((cookieData) => ({
            tenantId,
            cookieData: cookieData.trim(),
            countryCode,
            countryName,
            status: 'available',
            isDownloaded: false,
        }));
        const result = await prisma.cookie.createMany({ data });
        return { inserted: result.count };
    }
    async download(tenantId, userId, quantity, countryCode) {
        const where = {
            tenantId,
            status: 'available',
            isDownloaded: false,
        };
        if (countryCode) {
            where.countryCode = countryCode;
        }
        // Find available cookies
        const availableCookies = await prisma.cookie.findMany({
            where,
            take: quantity,
            orderBy: { createdAt: 'asc' },
            select: { id: true, cookieData: true, countryCode: true, countryName: true },
        });
        if (availableCookies.length === 0) {
            throw new Error('No cookies available for download');
        }
        const cookieIds = availableCookies.map((c) => c.id);
        // Mark as downloaded in a transaction
        await prisma.$transaction([
            prisma.cookie.updateMany({
                where: { id: { in: cookieIds } },
                data: {
                    status: 'downloaded',
                    isDownloaded: true,
                    downloadedBy: userId,
                    downloadedAt: new Date(),
                },
            }),
            prisma.downloadLog.create({
                data: {
                    tenantId,
                    userId,
                    countryCode: countryCode || null,
                    countryName: countryCode
                        ? availableCookies[0]?.countryName || null
                        : null,
                    quantity: availableCookies.length,
                },
            }),
        ]);
        return {
            cookies: availableCookies.map((c) => c.cookieData),
            count: availableCookies.length,
            requestedCount: quantity,
        };
    }
    async getCountries(tenantId) {
        const countries = await prisma.cookie.groupBy({
            by: ['countryCode', 'countryName'],
            where: { tenantId, status: 'available' },
            _count: { _all: true },
        });
        return countries
            .map((c) => ({
            code: c.countryCode,
            name: c.countryName,
            available: c._count._all,
        }))
            .sort((a, b) => b.available - a.available);
    }
}
exports.CookiesService = CookiesService;
//# sourceMappingURL=cookies.service.js.map