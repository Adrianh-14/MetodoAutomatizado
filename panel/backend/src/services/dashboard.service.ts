import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalCookies, availableCookies, downloadedCookies, todayCookies, countriesResult] =
      await Promise.all([
        prisma.cookie.count({ where: { tenantId } }),
        prisma.cookie.count({ where: { tenantId, status: 'available' } }),
        prisma.cookie.count({ where: { tenantId, status: 'downloaded' } }),
        prisma.cookie.count({
          where: {
            tenantId,
            createdAt: { gte: todayStart },
          },
        }),
        prisma.cookie.groupBy({
          by: ['countryCode'],
          where: { tenantId },
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

  async getCountryStats(tenantId: string) {
    const countries = await prisma.cookie.groupBy({
      by: ['countryCode', 'countryName'],
      where: { tenantId },
      _count: { _all: true },
    });

    const countryStats = await Promise.all(
      countries.map(async (c) => {
        const available = await prisma.cookie.count({
          where: { tenantId, countryCode: c.countryCode, status: 'available' },
        });
        const downloaded = await prisma.cookie.count({
          where: { tenantId, countryCode: c.countryCode, status: 'downloaded' },
        });

        return {
          countryCode: c.countryCode,
          countryName: c.countryName,
          total: c._count._all,
          available,
          downloaded,
        };
      })
    );

    return countryStats.sort((a, b) => b.total - a.total);
  }

  async getRecentActivity(tenantId: string, limit: number = 10) {
    return prisma.downloadLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}
