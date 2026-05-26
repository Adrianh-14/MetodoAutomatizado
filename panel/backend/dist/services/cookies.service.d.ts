export declare class CookiesService {
    list(tenantId: string, page: number | undefined, limit: number | undefined, filters: {
        country?: string;
        status?: string;
        search?: string;
    }, role?: string, userId?: string): Promise<{
        cookies: {
            id: string;
            createdAt: Date;
            status: string;
            cookieData: string;
            countryCode: string;
            countryName: string;
            isDownloaded: boolean;
            downloadedAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    upload(tenantId: string, cookies: string[], countryCode: string, countryName: string): Promise<{
        inserted: number;
    }>;
    download(tenantId: string, userId: string, quantity: number, countryCode?: string): Promise<{
        cookies: string[];
        count: number;
        requestedCount: number;
    }>;
    getCountries(tenantId: string): Promise<{
        code: string;
        name: string;
        available: number;
    }[]>;
}
//# sourceMappingURL=cookies.service.d.ts.map