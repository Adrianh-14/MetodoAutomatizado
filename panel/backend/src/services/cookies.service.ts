import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CookiesService {
  async list(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    filters: { country?: string; status?: string; search?: string }
  ) {
    const where: any = { tenantId };

    if (filters.country) {
      where.countryCode = filters.country;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.cookieData = { contains: filters.search };
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

  async upload(tenantId: string, cookies: string[], countryCode: string, countryName: string) {
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

  async download(tenantId: string, userId: string, quantity: number, countryCode?: string) {
    const where: any = {
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

  async getCountries(tenantId: string) {
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
