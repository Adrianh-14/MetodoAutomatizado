export declare class DashboardService {
    getStats(tenantId: string, role?: string, userId?: string): Promise<{
        totalCookies: number;
        availableCookies: number;
        downloadedCookies: number;
        todayCookies: number;
        totalCountries: number;
    }>;
    getCountryStats(tenantId: string, role?: string, userId?: string): Promise<{
        countryCode: string;
        countryName: string;
        total: number;
        available: number;
        downloaded: number;
    }[]>;
    getRecentActivity(tenantId: string, limit?: number, role?: string, userId?: string): Promise<({
        user: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        userId: string;
        countryCode: string | null;
        countryName: string | null;
        quantity: number;
    })[]>;
}
//# sourceMappingURL=dashboard.service.d.ts.map